# Zero-Downtime Deployment, CI/CD Pipelines & Real-World Observability

> **Track:** `05-AWS-AND-INFRASTRUCTURE`  
> **Topic:** `02-ec2-linux-and-deployment-pipelines`  
> **Target Audience:** SDE aiming for Senior / Tech Lead  
> **Interview Focus:** "How do you deploy code without downtime? How do instant rollbacks work? What is the difference between `/healthz` and `/readyz`? What is your full interview walkthrough?"

---

## 1. The Deployment Maturity Model: From Amateur to Senior

Every developer starts by doing manual deployments. Let's look at why companies move away from manual commands to automated, atomic pipelines:

```
LEVEL 1: MANUAL SSH (The Risky Way)
Developer ──SSH──> EC2 ──> git pull ──> npm install ──> npm run build ──> pm2 restart
Problems:
1. Running "npm run build" on a live server spikes CPU to 100%, causing lag for real users.
2. If TypeScript has a compiler error, the build fails halfway through, leaving your site broken!
3. If the new release has a bug, rollback takes 10 to 15 minutes of panicky git checkouts.

LEVEL 2: ATOMIC SYMLINK RELEASES (The Senior Way)
All versions live side-by-side in a "releases" folder. 
A single Linux shortcut ("current") points to the active version.
Swapping versions takes 1 millisecond. Rollback takes 1 millisecond!

LEVEL 3: FULL CI/CD AUTOMATION (The Enterprise Standard)
Developer pushes to Bitbucket ──> Automated Runner tests & builds artifact ──> Deploys to EC2 ──> Verifies health
```

---

## 2. Atomic Symlink Releases: How 1-Millisecond Rollback Works

On the EC2 server, we structure our application directory like this:

```
/var/www/my-node-api/
├── releases/
│   ├── release-2026-10-05-1000/   <── Version 1.0 (Yesterday's stable code)
│   └── release-2026-10-05-1200/   <── Version 1.1 (Today's new code)
│
├── shared/
│   └── logs/                      <── Permanent logs (never deleted during updates)
│
└── current ──[Linux Symlink]───────> releases/release-2026-10-05-1200
```

### The Magic of the Symlink Switch:
Nginx and PM2 are configured to look **ONLY** at the `/var/www/my-node-api/current` folder.

When you want to deploy a new version:
1. You unpack the new code into a brand new folder: `releases/release-2026-10-05-1200`.
2. You flip the shortcut using one Linux command:
   ```bash
   ln -sfn /var/www/my-node-api/releases/release-2026-10-05-1200 /var/www/my-node-api/current
   ```
3. You trigger `pm2 reload api-production`.
4. **What if the new version has a critical bug?**  
   You run that single `ln -sfn` command pointing back to the previous folder (`release-2026-10-05-1000`) and reload PM2. **Your site is rolled back in literally 1 second!**

---

## 3. The Atomic Deployment Script (`deploy.sh`)

Here is the exact script that runs on the server during an update:

```bash
#!/bin/bash
set -e # Stop script immediately if any command fails!

APP_DIR="/var/www/my-node-api"
RELEASE_TAG=$(date +"%Y%m%d%H%M%S")
NEW_RELEASE_DIR="$APP_DIR/releases/release-$RELEASE_TAG"

echo "Step 1: Creating new release directory..."
mkdir -p "$NEW_RELEASE_DIR"

echo "Step 2: Unpacking pre-built code package..."
tar -xzf /tmp/artifact.tar.gz -C "$NEW_RELEASE_DIR"

echo "Step 3: Pointing shared logs folder..."
ln -sfn "$APP_DIR/shared/logs" "$NEW_RELEASE_DIR/logs"

echo "Step 4: Flipping the atomic symlink..."
ln -sfn "$NEW_RELEASE_DIR" "$APP_DIR/current"

echo "Step 5: Performing zero-downtime rolling reload..."
pm2 reload "$APP_DIR/current/ecosystem.config.js" --update-env

echo "Step 6: Verifying health..."
sleep 2
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/healthz)

if [ "$STATUS" -eq 200 ]; then
    echo "Deployment Successful! System is healthy (HTTP 200)."
    # Clean up old releases, keep only the last 5
    cd "$APP_DIR/releases" && ls -t | tail -n +6 | xargs -r rm -rf
else
    echo "Health check failed with HTTP $STATUS! Rolling back immediately..."
    PREVIOUS_RELEASE=$(ls -td "$APP_DIR/releases"/* | sed -n '2p')
    ln -sfn "$PREVIOUS_RELEASE" "$APP_DIR/current"
    pm2 reload "$APP_DIR/current/ecosystem.config.js"
    exit 1
fi
```

---

## 4. Automated CI/CD with Bitbucket Pipelines

Instead of manually logging into servers, you configure **Bitbucket Pipelines** (`bitbucket-pipelines.yml`) in your repository.

```
Developer pushes code to Bitbucket
               │
               ▼
Bitbucket Runner Machine (Builds & Tests externally so EC2 doesn't sweat!)
├─ Runs: npm test
├─ Runs: npm run build
└─ Packages code into "artifact.tar.gz"
               │
               ▼ (Secure SSH pipe)
Copies artifact to EC2 (/tmp) & executes /var/www/my-node-api/deploy.sh
```

### Complete `bitbucket-pipelines.yml` File:

```yaml
image: node:20-alpine

pipelines:
  branches:
    # 1. Pushes to "develop" branch deploy to STAGING automatically
    develop:
      - step:
          name: Build & Test Artifact
          caches:
            - node
          script:
            - npm ci
            - npm test
            - npm run build
            # Package only compiled code and production configs
            - tar -czf artifact.tar.gz dist/ package.json package-lock.json ecosystem.config.js
          artifacts:
            - artifact.tar.gz
      - step:
          name: Deploy to Staging EC2
          deployment: Staging
          script:
            # Copy file to EC2 using Bitbucket SSH key
            - pipe: atlassian/scp-deploy:0.3.13
              variables:
                USER: 'ubuntu'
                SERVER: $STAGING_SERVER_IP
                SSH_KEY: $STAGING_SSH_KEY
                REMOTE_PATH: '/tmp'
                LOCAL_PATH: 'artifact.tar.gz'
            # Trigger the deploy script
            - pipe: atlassian/ssh-run:0.4.1
              variables:
                SSH_USER: 'ubuntu'
                SERVER: $STAGING_SERVER_IP
                SSH_KEY: $STAGING_SSH_KEY
                COMMAND: '/var/www/my-node-api/deploy.sh'

    # 2. Pushes to "main" branch deploy to PRODUCTION (Requires Manual Click)
    main:
      - step:
          name: Build & Test Production Artifact
          caches:
            - node
          script:
            - npm ci
            - npm test
            - npm run build
            - tar -czf artifact.tar.gz dist/ package.json package-lock.json ecosystem.config.js
          artifacts:
            - artifact.tar.gz
      - step:
          name: Deploy to Production EC2
          deployment: Production
          trigger: manual # Requires a Tech Lead click in the UI to deploy!
          script:
            - pipe: atlassian/scp-deploy:0.3.13
              variables:
                USER: 'ubuntu'
                SERVER: $PROD_SERVER_IP
                SSH_KEY: $PROD_SSH_KEY
                REMOTE_PATH: '/tmp'
                LOCAL_PATH: 'artifact.tar.gz'
            - pipe: atlassian/ssh-run:0.4.1
              variables:
                SSH_USER: 'ubuntu'
                SERVER: $PROD_SERVER_IP
                SSH_KEY: $PROD_SSH_KEY
                COMMAND: '/var/www/my-node-api/deploy.sh'
```

---

## 5. Health vs Readiness Probes: Why You Need Both

In production systems, asking *"Is the server up?"* is not enough. You must distinguish between **Liveness** and **Readiness**:

```
1. Liveness (/healthz): "Is the Node.js process alive and listening?"
   - Does NOT check database.
   - If this fails: Node.js process has frozen or crashed. PM2 should restart it.

2. Readiness (/readyz): "Can this server actually process customer orders right now?"
   - Checks if the PostgreSQL connection pool is alive and Redis responds to PING.
   - If this fails: Nginx / AWS Load Balancer stops sending new traffic to this instance.
```

### Express.js Implementation:

```javascript
// src/routes/health.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const redis = require('../redis');

// Liveness check: Fast and lightweight
router.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'alive', uptime: process.uptime() });
});

// Readiness check: Validates database and cache connectivity
router.get('/readyz', async (req, res) => {
    let dbOk = false;
    let redisOk = false;

    try {
        await db.query('SELECT 1');
        dbOk = true;
    } catch (err) {
        console.error('Database readiness failed:', err.message);
    }

    try {
        const ping = await redis.ping();
        if (ping === 'PONG') redisOk = true;
    } catch (err) {
        console.error('Redis readiness failed:', err.message);
    }

    if (dbOk && redisOk) {
        return res.status(200).json({ status: 'ready' });
    } else {
        // Return 503 Service Unavailable so load balancers stop sending traffic
        return res.status(503).json({ status: 'unready', db: dbOk, redis: redisOk });
    }
});

module.exports = router;
```

---

## 6. How to Verify Production is Live Right Now

When you want to verify that your deployment succeeded, run these quick sanity checks:

```bash
# 1. Test from your own computer or browser
curl -I https://api.example.com/healthz
# Expected: HTTP/2 200

# 2. Check PM2 status on the server
pm2 status
# Expected: All workers showing "online" with low memory

# 3. Stream real-time application logs
pm2 logs api-production --lines 50

# 4. Check Nginx access logs to see incoming live user traffic
sudo tail -f /var/log/nginx/access.log
```

---

## 7. The Ultimate Interview Walkthrough: "How Would You Deploy a Node.js Project?"

When an interviewer asks you this question, do not give a one-sentence answer. Deliver this structured, articulate walkthrough:

> *"To deploy a Node.js project from scratch to staging and production, I set up a complete pipeline covering networking, reverse proxying, process management, and automated CI/CD.*
> 
> *1. **AWS Infrastructure & Networking:**  
> I provision EC2 instances in a VPC public subnet and bind them to permanent Elastic IPs so DNS A-records never break on reboots. For security, we configure Security Groups to only allow incoming traffic on port 80 (HTTP) and 443 (HTTPS) for the public, and restrict port 22 strictly to our VPN. Node.js port 3000 is never exposed to the internet; it binds locally to `127.0.0.1`.*
> 
> *2. **Nginx Reverse Proxy & Routing:**  
> Nginx acts as our public edge gateway, handling SSL termination via Certbot and buffering slow client connections to protect Node's single-threaded event loop. By inspecting the incoming HTTP `Host` header, Nginx routes `staging.example.com` to internal port 3001 and `api.example.com` to internal port 3000.*
> 
> *3. **Process Management with PM2:**  
> We run Node.js under PM2 in cluster mode across CPU cores on production. For zero-downtime releases, we use `pm2 reload` instead of `pm2 restart`. This performs a rolling reload where new workers boot and signal readiness before old workers are gracefully shut down via `SIGINT` handlers that drain existing database queries.*
> 
> *4. **Automated CI/CD & Atomic Releases:**  
> We use Bitbucket Pipelines where pushes to `develop` deploy to staging, and pushes to `main` deploy to production after manual approval. To avoid slowing down production, builds happen on the CI runner, not the server. On the server, we use an **atomic symlink structure** (`/current -> releases/<timestamp>`), allowing us to swap versions or execute an instant rollback in less than one second.*
> 
> *5. **Health Checks & Observability:**  
> The application exposes decoupled `/healthz` (liveness) and `/readyz` (database connectivity) endpoints, and server logs are shipped to CloudWatch for centralized monitoring."*

That answer covers every single layer of the stack with confidence and clarity!
