# AWS EC2 & Networking: From Blank Cloud Server to Low-Latency Machine

> **Track:** `05-AWS-AND-INFRASTRUCTURE`  
> **Topic:** `02-ec2-linux-and-deployment-pipelines`  
> **Target Audience:** SDE aiming for Senior / Tech Lead  
> **Interview Focus:** "How do you set up an AWS instance, configure public/private IPs, manage ports, and communicate between servers with minimum latency?"

---

## 1. The Big Picture: How Your Server Exists in AWS

Imagine you just joined a company and they say: *"We need a server to run our Node.js API."*

In AWS, you don't just click "create machine". Your machine lives inside a private virtual datacenter called a **VPC (Virtual Private Cloud)**.

Here is the exact visual map of how internet traffic travels from a user on their phone to your server:

```
                      THE INTERNET (Users Worldwide)
                                   │
                                   │ 1. User types "api.example.com"
                                   ▼
                         [ Internet Gateway (IGW) ]
                       (The front gate of your VPC)
                                   │
┌──────────────────────────────────┼──────────────────────────────────┐
│ YOUR AWS VPC (Your Private Cloud Island)                            │
│                                  │                                  │
│   PUBLIC SUBNET (Front Office)   ▼                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ YOUR EC2 INSTANCE (Staging or Production)                   │   │
│   │                                                             │   │
│   │ ├─ Public Elastic IP: 54.210.12.34 (Address visible to web) │   │
│   │ ├─ Private IP:        10.0.1.10    (Internal room number)   │   │
│   │ └─ Security Group:    sg-web-server (The Security Guard)     │   │
│   │                                                             │   │
│   │    [Port 80/443 Open] ──> Nginx ──> [Port 3000] ──> Node.js │   │
│   └──────────────────────────────┬──────────────────────────────┘   │
│                                  │                                  │
│                                  │ 2. Sub-millisecond internal hop  │
│                                  ▼    (Over AWS private fiber)      │
│   PRIVATE SUBNET (Back Office / Safe Vault)                         │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ DATABASE / INTERNAL SERVICE                                 │   │
│   │ ├─ Private IP: 10.0.2.50 (NO internet access, completely safe)│
│   │ └─ Accepts connections ONLY from your EC2 instance          │   │
│   └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. IP Addresses: Public vs Private vs Elastic IP

When you launch an EC2 instance in AWS, it gets assigned network addresses. In an interview, explaining the difference between these three demonstrates that you understand real production operations.

### 1. Private IP (The Internal Room Number)
* **What it is:** An IP like `10.0.1.10` that only exists *inside* your AWS network.
* **Can people on the internet see it?** No. Never.
* **Why it matters:** This is the IP your servers use to talk to each other (Node.js $\rightarrow$ PostgreSQL database, or Server A $\rightarrow$ Server B).
* **Cost:** Free. Unlimited bandwidth within the same data center.

### 2. Auto-Assigned Public IP (The Temporary Phone Number — THE TRAP)
* **What it is:** An IP address given to your instance so it can talk to the internet.
* **The Dangerous Trap:** If you stop your EC2 instance (to resize the CPU/RAM or reboot) and start it again, **AWS gives you a completely different public IP!**
* **Why this breaks production:** If your domain name (`api.example.com`) is pointing to this temporary IP, your entire website goes down after a server reboot because the DNS is now pointing to a dead IP!

### 3. Elastic IP (The Permanent Engraved Address — THE SOLUTION)
* **What it is:** A static, fixed public IPv4 address that you personally reserve in AWS.
* **How it works:** Once you attach an Elastic IP (e.g., `54.210.12.34`) to your EC2 instance, it **never changes**, even if the machine is stopped, rebooted, or upgraded.
* **Rule:** Always point your domain's DNS A-Record to an **Elastic IP**, never to an auto-assigned public IP.

---

## 3. How to Allocate & Attach an Elastic IP

In the AWS Console or Terminal, here is how you make an IP permanent:

### In AWS Console:
1. Go to **EC2 Dashboard** $\rightarrow$ Click **Elastic IPs** on the left menu.
2. Click **Allocate Elastic IP address** $\rightarrow$ Click **Allocate**.
3. Select your new IP $\rightarrow$ Click **Actions** $\rightarrow$ **Associate Elastic IP address**.
4. Choose your running EC2 instance and click **Associate**.

### In AWS CLI:
```bash
# Step 1: Allocate a new static IP from AWS pool
ALLOC_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)

# Step 2: Attach it to your EC2 instance
aws ec2 associate-address --instance-id i-0123456789abcdef0 --allocation-id $ALLOC_ID
```

Now, your server has a permanent identity on the internet.

---

## 4. Security Groups: The "Security Guard" of Your Ports

A Security Group is a virtual firewall that sits in front of your EC2 instance. It checks every incoming packet before it ever reaches your operating system.

### The Junior Mistake vs The Senior Architecture:

```
❌ JUNIOR MISTAKE:
Open Port 3000 to the world (0.0.0.0/0)
Why it's bad: Attackers can bombard Node.js directly, bypass SSL, and run Denial of Service attacks.

✅ SENIOR ARCHITECTURE:
Internet ──[Port 80 / 443 ONLY]──> Nginx ──[Local Port 3000]──> Node.js
```

### Exact Security Group Configuration to Explain in an Interview:

| Port | Protocol | Source (Who can connect?) | Purpose |
| :--- | :--- | :--- | :--- |
| **22** | SSH | **Your IP only** (e.g., `122.161.45.10/32`) | Secure terminal access. Never open to `0.0.0.0/0`! |
| **80** | HTTP | `0.0.0.0/0` (Everyone) | Used by Certbot for SSL renewal and redirecting users to HTTPS. |
| **443** | HTTPS | `0.0.0.0/0` (Everyone) | Secure encrypted public user traffic to Nginx. |
| **3000** | Custom TCP | **NOBODY OUTSIDE** (Closed) | Node.js listens internally only on `127.0.0.1`. |

> **Tech Lead Note:** Security Groups are **stateful**. This means if you allow incoming traffic on port 443, the response back to the user is automatically allowed out. You don't need to write custom outbound return rules.

---

## 5. Communicating Between Instances with Minimum Latency

If you have two servers—say, **Server 1 (Node.js API)** and **Server 2 (Database or Microservice B)**—how should they talk to each other?

### The 3 Ways to Connect (From Slowest to Fastest):

```
WAY 1: Via Public Elastic IP (SLOW & EXPENSIVE)
[Server 1] ──> Out to Internet Gateway ──> Public Internet ──> Back into [Server 2]
- Latency: 10ms - 25ms
- Cost: You pay AWS for "Data Transfer Out" ($0.09 per GB)
- Security: Data travels over the public internet.

WAY 2: Via Private IP in the Same VPC (FAST & STANDARD)
[Server 1] ──> AWS Internal High-Speed SDN Fabric ──> [Server 2]
- Latency: ~1 millisecond (0.5ms - 1.2ms)
- Cost: Free within the same Availability Zone.
- Security: 100% private. Data never leaves AWS's internal cables.

WAY 3: AWS Cluster Placement Group (ULTRA-FAST MICROSECOND LATENCY)
[Server 1] ═════ Same Physical Server Rack (Direct 100Gbps Switch) ═════ [Server 2]
- Latency: Under 50 microseconds (< 0.05ms)
- When to use: High-frequency trading, real-time multiplayer gaming, huge Redis clusters.
```

### How to Allow Server 1 to Talk to Server 2 via Security Groups:
Instead of typing IP addresses into firewall rules, AWS lets you **chain Security Groups together**:

1. In Server 2's Security Group (e.g. Database):
   * Add Inbound Rule: **Port 5432 (Postgres)**
   * Source: Select **`sg-web-server`** (The Security Group ID of Server 1).
2. **What this means:** Any instance wearing the `sg-web-server` badge is automatically allowed into Server 2 over its Private IP! Even if Server 1 is replaced or gets a new IP, the rule still works automatically!

---

## 6. How to Verify Networking on the Actual Server

Once you SSH into your EC2 server, run these simple commands to see exactly what is happening:

```bash
# 1. What is my Private IP address?
ip addr show eth0
# Output will show: inet 10.0.1.10/24 (Your internal IP)

# 2. What is my Public IP? (Ask AWS's internal metadata service)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/public-ipv4
# Output: 54.210.12.34 (Your Elastic IP)

# 3. Can I reach Server 2 over the private network?
ping -c 3 10.0.2.50

# 4. Can I connect to Server 2's specific port (e.g. 5432 or 3000)?
nc -zv 10.0.2.50 5432
# Output: Connection to 10.0.2.50 5432 port [tcp/*] succeeded!
```

---

## 7. How to Explain This in an Interview (The 60-Second Pitch)

If the interviewer asks: **"How do you set up the AWS networking for your application?"**

Say this:

> *"I provision the EC2 instance inside a public subnet of our VPC and attach a permanent Elastic IP so the public address never changes across reboots. For security, we configure a Security Group that opens only ports 80 and 443 for public web traffic, and restricts SSH port 22 strictly to our office IP or VPN.*
> 
> *Our Node.js port 3000 is never exposed to the public internet; it only listens locally behind Nginx. For communicating with our database or internal microservices, we never route traffic over public IPs. We use the internal Private IPs within the same VPC subnet, which keeps latency under 1 millisecond and avoids AWS internet data transfer costs. We secure this connection by referencing the web server's Security Group ID directly in the database's inbound firewall rules."*
