# Nginx as a Reverse Proxy: How It Routes Traffic, Manages Ports & Protects Node.js

> **Track:** `05-AWS-AND-INFRASTRUCTURE`  
> **Topic:** `02-ec2-linux-and-deployment-pipelines`  
> **Target Audience:** SDE aiming for Senior / Tech Lead  
> **Interview Focus:** "What is a reverse proxy? How does Nginx know which request goes to which Node port? Where do you write the configs and how do you debug 502 errors?"

---

## 1. The Real-World Mental Model: Why Node.js Needs a "Bodyguard"

Imagine a restaurant:
* **The Chef (Node.js):** Highly skilled, cooks delicious food, but there is only **one chef** working in the kitchen (Node.js is single-threaded).
* **The Receptionist & Bouncer (Nginx):** Stands at the front entrance, greets customers, checks IDs (SSL certificates), takes coats, holds orders, and only hands simple, ready-to-cook tickets to the chef.

```
Without Nginx (The Dangerous Way):
A customer walks directly into the kitchen, talks very slowly for 10 seconds to place an order.
Meanwhile, the single chef is waiting and CANNOT cook food for anyone else!

With Nginx (The Production Way):
Client (Phone / Browser)
       │ (Sends HTTPS request over the internet)
       ▼
   [ NGINX ] (Port 80 / 443 - Front Gate)
       │ 1. Terminates SSL (decrypts HTTPS so Node doesn't waste CPU)
       │ 2. Buffers slow client uploads into memory
       │ 3. Checks the requested domain name
       │
       ▼ (Fast local socket forwarding: 127.0.0.1)
 [ NODE.JS APP ] (Port 3000 - Protected Kitchen)
```

### Why Node.js Should Never Face the Internet Directly:
1. **Slow Client Protection (Buffering):** If a mobile user on a 2G connection takes 5 seconds to upload a picture, Nginx patiently receives and buffers the file. Once the file is 100% downloaded, Nginx delivers it to Node.js locally in **1 millisecond**. Node.js never stalls!
2. **SSL / TLS Termination:** Encrypting and decrypting HTTPS traffic uses heavy mathematical CPU power. Nginx is written in C and does this at lightning speed, leaving 100% of Node's CPU for your business logic.
3. **Security (No Root Access):** Binding to public ports 80 and 443 on Linux requires `root` privileges. You should never run Node.js as root. Nginx starts as root to bind ports 80/443, then immediately drops to an unprivileged user (`www-data`). Node runs safely as a regular user on port 3000.

---

## 2. How Does Nginx Know Where to Send Each Request?

This is one of the most common backend interview questions:  
*"If you point two domains (`staging.example.com` and `api.example.com`) to the **exact same EC2 server**, how does Nginx know which Node.js port to call?"*

### The Postal Letter Analogy:

```
┌───────────────────────────────────────────────────────────┐
│ THE HTTP REQUEST PACKET                                   │
│                                                           │
│ Line 1: GET /users/profile HTTP/1.1                       │
│ Line 2: Host: staging.example.com  <─── THE RECIPIENT NAME│
│ Line 3: Authorization: Bearer eyJhb...                    │
└───────────────────────────────────────────────────────────┘
```

1. **DNS gets the packet to the building (IP Address):**  
   Both `staging.example.com` and `api.example.com` resolve in DNS to the same IP: `54.210.12.34`.
2. **The packet enters Nginx on port 80 or 443:**  
   Nginx opens the incoming HTTP packet.
3. **Nginx inspects the `Host` header:**  
   Nginx looks at Line 2 of the HTTP request: `Host: staging.example.com`.
4. **Nginx matches the `server_name` directive:**  
   Nginx scans its configuration files to see which block claims that name.
   * If `server_name` is `staging.example.com` $\rightarrow$ forward to `http://127.0.0.1:3001`
   * If `server_name` is `api.example.com` $\rightarrow$ forward to `http://127.0.0.1:3000`

---

## 3. Where are Nginx Config Files Located on the Server?

When you log into an Ubuntu/Debian EC2 instance, Nginx files live in `/etc/nginx/`:

```
/etc/nginx/
├── nginx.conf                 <── The Main Engine Settings (worker processes, gzip, events)
│
├── sites-available/           <── THE DRAFT FOLDER (Where you write your site files)
│   ├── staging.conf
│   └── production.conf
│
└── sites-enabled/             <── THE ACTIVE FOLDER (Where Nginx actually looks!)
    ├── staging.conf   ──────[Symlink shortcut]───> ../sites-available/staging.conf
    └── production.conf ─────[Symlink shortcut]───> ../sites-available/production.conf
```

> **Why does Nginx have both `sites-available` and `sites-enabled`?**  
> Think of `sites-available` as your draft folder, and `sites-enabled` as the live switch. If you want to temporarily disable a site, you don't delete your configuration file; you simply delete the shortcut link in `sites-enabled`!

---

## 4. Complete Configuration Blueprints (Single Server with Staging & Prod)

Let's configure both environments on one server:
* `staging.example.com` $\rightarrow$ forwards internally to Node on port `3001`
* `api.example.com` $\rightarrow$ forwards internally to Node on port `3000`

### Step 1: Create the Staging Config
File path: `/etc/nginx/sites-available/staging.conf`

```nginx
server {
    # Listen on standard web port 80 (HTTP)
    listen 80;
    
    # The domain name Nginx looks for in the "Host:" header
    server_name staging.example.com;

    # Every incoming request to this domain goes here
    location / {
        # Forward the request to Staging Node.js running on port 3001
        proxy_pass http://127.0.0.1:3001;

        # Use modern HTTP 1.1 protocol for internal speed
        proxy_http_version 1.1;

        # Pass the real user's details to Node.js (so req.ip works correctly)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts: If Node.js takes longer than 60 seconds, don't hang forever
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

### Step 2: Create the Production Config
File path: `/etc/nginx/sites-available/production.conf`

```nginx
server {
    listen 80;
    
    # Production domain
    server_name api.example.com;

    # Allow uploading files up to 10MB (images/documents)
    client_max_body_size 10M;

    location / {
        # Forward to Production Node.js running on port 3000
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

---

## 5. How to Enable the Sites and Add Free HTTPS (Certbot)

Run these exact commands in your EC2 terminal:

```bash
# 1. Create the symlinks to activate the sites
sudo ln -s /etc/nginx/sites-available/staging.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/production.conf /etc/nginx/sites-enabled/

# 2. Delete the default welcome page so it doesn't conflict
sudo rm -f /etc/nginx/sites-enabled/default

# 3. CRITICAL STEP: Test your configuration for typos BEFORE reloading!
sudo nginx -t
# You must see:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# 4. Reload Nginx without disconnecting a single active user
sudo systemctl reload nginx

# 5. Install Let's Encrypt Certbot for Free Automatic HTTPS
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# 6. Run Certbot (It automatically edits your Nginx files to add SSL certificates!)
sudo certbot --nginx -d staging.example.com -d api.example.com
```

Certbot will ask for your email and automatically configure HTTPS on port 443 with auto-renewal timers!

---

## 6. SDE Debugging Toolkit: What do 502 and 504 Errors Mean?

When you or a customer sees an error in their browser, here is the exact mental diagnostic tree:

```
User sees: "502 Bad Gateway"
Meaning: Nginx reached out to 127.0.0.1:3000, but NO ONE was listening!
Action: 
1. Is Node.js running? Run: pm2 status
2. If it is stopped or crashing, check logs: pm2 logs
3. Start it: pm2 start ...

User sees: "504 Gateway Timeout"
Meaning: Nginx connected to Node.js, but Node.js was silent for > 60 seconds!
Action:
1. Node.js is stuck in an infinite loop, or a database query is deadlocked.
2. Check your backend database locks and slow queries.
```

### The 4 Commands Every Senior Engineer Uses to Debug:

```bash
# 1. Test Nginx syntax and see if any file has errors
sudo nginx -t

# 2. Print the entire combined Nginx configuration to inspect all loaded blocks
sudo nginx -T

# 3. Live stream Nginx error logs (See exactly why requests fail in real time)
sudo tail -f /var/log/nginx/error.log

# 4. Check what programs are listening on what ports right now
sudo ss -tulpn
# Look for:
# nginx on 0.0.0.0:80 and 0.0.0.0:443
# node on 127.0.0.1:3000 and 127.0.0.1:3001
```

---

## 7. How to Explain This in an Interview (The 60-Second Pitch)

If an interviewer asks: **"Explain how Nginx acts as a reverse proxy for your Node.js app."**

Say this:

> *"Nginx acts as our public-facing gateway on ports 80 and 443. We place it in front of Node.js for three main reasons: SSL termination, request buffering to protect Node's single-threaded event loop from slow mobile connections, and routing.*
> 
> *When a request arrives, Nginx parses the HTTP `Host` header to determine whether the user is visiting `staging.example.com` or `api.example.com`. Based on the matching `server_name` directive in our configuration, it proxies the request internally to either port 3001 for staging or port 3000 for production.*
> 
> *Node.js binds strictly to localhost (`127.0.0.1`), meaning it is invisible to the outside world. If Node crashes, Nginx returns a 502 Bad Gateway. If Node hangs on a database lock, Nginx returns a 504 Gateway Timeout. We keep configurations in `/etc/nginx/sites-available` and enable them via symlinks, always running `nginx -t` before issuing a graceful reload."*
