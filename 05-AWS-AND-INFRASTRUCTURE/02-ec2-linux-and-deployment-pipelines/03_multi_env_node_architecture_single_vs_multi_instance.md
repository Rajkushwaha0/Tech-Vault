# Node.js Multi-Environment Setup: Single vs Multi-Instance & PM2 Mechanics

> **Track:** `05-AWS-AND-INFRASTRUCTURE`  
> **Topic:** `02-ec2-linux-and-deployment-pipelines`  
> **Target Audience:** SDE aiming for Senior / Tech Lead  
> **Interview Focus:** "How do you manage Staging and Production on a single box vs multiple boxes? What is the Linux OOM Killer? How does PM2 reload work without downtime?"

---

## 1. Single EC2 vs Multi-EC2: The "Shared Apartment" Analogy

When an interviewer asks: *"Can we deploy both our Staging and Production APIs onto the same EC2 instance?"*

The answer is: **"Yes, we can, but it is like two roommates sharing a small apartment."**

```
TOPOLOGY A: SINGLE EC2 (Shared Apartment)
┌────────────────────────────────────────────────────────┐
│ ONE EC2 INSTANCE (Shared 4GB RAM, 2 vCPUs)             │
│                                                        │
│  STAGING NODE APP (:3001)    PRODUCTION NODE APP (:3000)│
│  (develop branch)            (main branch)             │
│                                                        │
│  [Shared Linux Kernel, Shared Memory, Shared CPU Cores] │
└────────────────────────────────────────────────────────┘
Risk: Staging can crash Production!

TOPOLOGY B: SEPARATE EC2s (Private Houses)
┌──────────────────────────┐    ┌──────────────────────────┐
│ STAGING EC2              │    │ PRODUCTION EC2           │
│ ├─ develop branch        │    │ ├─ main branch           │
│ └─ Staging Database      │    │ └─ Production Database   │
└──────────────────────────┘    └──────────────────────────┘
Complete Safety: Nothing on Staging can ever hurt Production!
```

### The Tradeoff Summary:

| Factor | Single EC2 (Colocated) | Separate EC2s (Isolated) |
| :--- | :--- | :--- |
| **AWS Bill** | Low (Pay for 1 instance) | Higher (Pay for 2 instances) |
| **Blast Radius** | **High** (Staging crash can kill Prod) | **Zero** (Complete hardware separation) |
| **CPU Starvation** | If Staging runs a heavy loop, Prod lags | Zero interference |
| **Best Used For** | Early startups, personal projects, MVPs | **Real Production Companies** |

---

## 2. What is the Linux OOM Killer, and Why Does It Matter?

Imagine your server has **2 GB of RAM**.

1. A developer pushes a bug to the **Staging API**: someone wrote an unpaginated query that accidentally loads 500,000 users into memory at once.
2. Staging's memory usage spikes from 200 MB up to 1.8 GB!
3. Now the server is completely out of memory. The operating system cannot even allocate memory for basic keyboard strokes.
4. To prevent the entire computer from freezing, the Linux kernel activates its built-in referee: the **OOM (Out Of Memory) Killer**.

### The Disaster:
The OOM Killer looks for whichever program is eating up lots of memory and **instantly kills it**.
* If Staging is eating 1.2 GB and Production is sitting quietly at 500 MB, Linux will kill Staging.
* **BUT**, if your Production app had already cached 700 MB of legitimate user sessions, **Linux might shoot your Production API in the head to save the server!**

### How to Protect Yourself with PM2:
We give PM2 a memory ceiling (e.g. `max_memory_restart: '1G'`). If Staging starts leaking memory, **PM2 restarts Staging peacefully BEFORE the Linux kernel panics and kills Production!**

---

## 3. PM2 Process Management: Fork vs Cluster Mode

Node.js is single-threaded. If you buy an EC2 instance with 4 CPU cores and run `node server.js`, **three of your four CPU cores sit at 0% doing nothing!**

PM2 solves this using Node.js's native `cluster` module.

```
                      PM2 MASTER PROCESS
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
[ Worker 1 (Core 0) ]  [ Worker 2 (Core 1) ]  [ Worker 3 (Core 2) ]
All 3 workers listen to Port 3000 simultaneously!
```

### The Two Modes in PM2:
* **Fork Mode (`instances: 1`):** Spawns 1 process. Perfect for **Staging** (saves memory) or background queue workers.
* **Cluster Mode (`instances: 'max'`):** Spawns a worker for every CPU core. Perfect for **Production** to handle maximum web traffic.

---

## 4. `pm2 restart` vs `pm2 reload` (The Elevator Analogy)

In an interview, this is a signature question that separates juniors from seniors:

```
PM2 RESTART (The Rough Way):
Worker 1 ────[KILLED]────> Dead (5 seconds) ────[BOOTING]────> Online
                             ▲
                    Users see 502 Bad Gateway!

PM2 RELOAD (The Zero-Downtime Way):
Worker 1 (Old) ──────────────────────────[Active]─────────> [Drains & Exits]
Worker 2 (New) ──────[BOOTS & WARMS UP]──> [Takes Traffic]
```

* **`pm2 restart`:** Kills the process immediately and starts a new one. All active users downloading files or saving checkouts get disconnected with an error.
* **`pm2 reload`:** Performs a **rolling zero-downtime reload**. It starts the new version of your code, waits until it is fully initialized, starts routing new requests to it, and only then asks the old version to finish its current jobs and exit.

---

## 5. Graceful Shutdown: How to Write it in Express.js

For `pm2 reload` to achieve true zero-downtime, your Node.js application must know what to do when it is told to shut down:

```javascript
// src/server.js
const express = require('express');
const app = express();

const server = app.listen(process.env.PORT || 3000, '127.0.0.1', () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    
    // Tell PM2: "I am warm, initialized, and ready to accept traffic!"
    if (process.send) {
        process.send('ready');
    }
});

// When PM2 wants to replace this process, it sends a SIGINT signal
process.on('SIGINT', () => {
    console.log('Received SIGINT. Starting graceful shutdown...');

    // Step 1: Stop accepting NEW requests from Nginx
    server.close(async () => {
        console.log('All in-flight requests finished cleanly.');

        try {
            // Step 2: Close database and Redis connections cleanly
            // await database.pool.end();
            // await redis.disconnect();
            
            console.log('Database connections closed. Process exiting.');
            process.exit(0);
        } catch (err) {
            console.error('Error during cleanup:', err);
            process.exit(1);
        }
    });

    // Step 3: Emergency safety net (If a query hangs, force quit after 8 seconds)
    setTimeout(() => {
        console.error('Graceful shutdown took too long. Force killing process.');
        process.exit(1);
    }, 8000);
});
```

---

## 6. Declarative PM2 Blueprint: `ecosystem.config.js`

Never start production servers with ad-hoc terminal commands. Create an `ecosystem.config.js` file in `/var/www/`:

```javascript
// /var/www/ecosystem.config.js
module.exports = {
  apps: [
    // 1. STAGING CONFIGURATION
    {
      name: 'api-staging',
      cwd: '/var/www/staging/current',
      script: 'dist/server.js',
      instances: 1,              // Staging only needs 1 process
      exec_mode: 'fork',
      max_memory_restart: '500M',// Kill Staging if it exceeds 500MB (Protects Prod!)
      wait_ready: true,          // Wait for process.send('ready')
      kill_timeout: 5000,        // Give 5 seconds for graceful shutdown
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    },

    // 2. PRODUCTION CONFIGURATION
    {
      name: 'api-production',
      cwd: '/var/www/production/current',
      script: 'dist/server.js',
      instances: 'max',          // Run 1 worker per CPU core
      exec_mode: 'cluster',
      max_memory_restart: '1G',  // Restart worker if it exceeds 1GB RAM
      wait_ready: true,
      kill_timeout: 8000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### PM2 Commands to Memorize:
```bash
# Start or reload all applications from the config
pm2 start /var/www/ecosystem.config.js

# Reload production with zero downtime
pm2 reload api-production

# Check CPU & RAM of every process
pm2 status

# Save running processes so they restart automatically if the EC2 reboots
pm2 save
pm2 startup
```

---

## 7. Secrets Management: Why Storing `.env` on Disk is Dangerous

### The Danger:
Leaving `.env` files lying on your server disk in `/var/www/` means anyone with terminal access, a git leak, or an application bug that allows file reading (Path Traversal) can read your production database passwords.

### The Production Solution (AWS Systems Manager Parameter Store):
Store encrypted secrets in AWS SSM. When the server boots, Node.js fetches secrets directly into **process memory (RAM)** over HTTPS:

```javascript
// src/config/secrets.js
const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');

async function loadSecrets() {
    // Only fetch from AWS in Staging and Production
    if (process.env.NODE_ENV === 'development') return;

    const ssm = new SSMClient({ region: 'us-east-1' });
    const path = `/${process.env.NODE_ENV}/api/`;

    const command = new GetParametersByPathCommand({
        Path: path,
        WithDecryption: true // Automatically decrypt KMS-encrypted passwords
    });

    const response = await ssm.send(command);
    response.Parameters.forEach(param => {
        const key = param.Name.replace(path, '');
        process.env[key] = param.Value; // Loaded into RAM only! Never written to disk!
    });
}

module.exports = { loadSecrets };
```

---

## 8. How to Explain This in an Interview (The 60-Second Pitch)

If an interviewer asks: **"How do you manage Node.js processes and avoid downtime during updates?"**

Say this:

> *"We run Node.js using PM2 in cluster mode on production, which spawns one worker per CPU core to maximize hardware utilization. For zero-downtime updates, we use `pm2 reload` instead of `pm2 restart`.*
> 
> *While restart terminates processes immediately, reload performs a rolling replacement: it boots new workers, waits for them to signal readiness, shifts traffic over, and gracefully drains existing requests using `SIGINT` handlers in our Express code. We also protect our server from the Linux OOM Killer by setting `max_memory_restart` caps in our `ecosystem.config.js`.*
> 
> *For hosting Staging and Production, we can run Staging on port 3001 and Production on port 3000 on a single machine for cost efficiency, but in an enterprise setup, we always isolate them onto separate EC2 instances so a Staging bug can never starve Production CPU or memory."*
