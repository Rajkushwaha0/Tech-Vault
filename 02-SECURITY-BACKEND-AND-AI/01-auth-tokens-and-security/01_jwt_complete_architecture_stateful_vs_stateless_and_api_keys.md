---
title: "JWT Architecture, Stateful vs Stateless Auth & API Keys"
category: "Security"
sub_category: "Authentication & Tokens"
type: "concept"
tags:
  - "jwt"
  - "authentication"
  - "security"
  - "api-key"
  - "oauth2"
  - "redis"
  - "backend"
  - "system-design"
updated: "2026-09-28"
---

# 01 — JWT Deep Dive: Architecture, Stateful vs. Stateless Auth, and JWT vs. API Keys

> **Author / Mentor Context:** Production Authentication Architecture for Backend & Distributed Systems Engineers.  
> **Core Focus:** Stateful vs. Stateless Auth Fundamentals, JWT Cryptographic Mechanics (HS256 vs RS256/JWKS), Making JWTs Stateful, Dual-Track API Gateway Architecture, and API Keys vs. JWTs.

---

## 🧭 Document Learning Flow

1. **Chapter 1: Foundations** — Stateful vs. Stateless Authentication (Mental Models & Tradeoffs).
2. **Chapter 2: The Core Dilemma** — Is JWT Stateless or Stateful? How to Make JWT Stateful in Production.
3. **Chapter 3: Cryptographic Internals** — How JWT Works Under the Hood (`Header.Payload.Signature`).
4. **Chapter 4: Comparison** — API Key vs. JWT: Which is Better for Your API?
5. **Chapter 5: Production Architecture** — The Dual-Track Gateway (External API Keys + Internal JWTs).
6. **Chapter 6: External Key Management** — Hashing (`SHA-256`), Prefixes (`sk_live_`), and Credit Quotas.
7. **Chapter 7: Master Decision Matrix & Security Checklist**.

---

## Chapter 1: Foundations — Stateful vs. Stateless Authentication

HTTP is a stateless protocol (RFC 7230). Request N+1 carries no inherent memory of Request N. To establish user identity across requests, backend systems use one of two fundamental architectural patterns:

```mermaid
flowchart TD
    subgraph Stateful_Session["Stateful Session Architecture (Redis / Database)"]
        Client1["Client (Browser)"] -->|"Request + SessionID (Cookie)"| Gateway1["API Gateway"]
        Gateway1 -->|"Network I/O: Query Session Store"| Redis["Central Session Store (Redis/DB)"]
        Redis -->|"Return User ID & Roles"| Gateway1
        Gateway1 -->|"Forward User Context"| SvcA["Downstream Services"]
    end

    subgraph Stateless_JWT["Stateless Token Architecture (JWT)"]
        Client2["Client (Browser / App)"] -->|"Request + Bearer JWT"| Gateway2["API Gateway / Microservice"]
        Gateway2 -->|"In-Memory CPU Math (Public Key / Secret)"| Crypt["Cryptographic Verification (Zero Network I/O)"]
        Crypt -->|"Instant User Context Extracted"| SvcB["Downstream Services"]
    end
```

---

### A. Stateful Authentication (Session-Cookie Model)

- **How it Works:**
  1. User logs in with credentials.
  2. Server creates a `session_id` (e.g., a random UUID), stores `{ session_id: { user_id, role, expires_at } }` in a database/Redis cache, and sends `session_id` back in a `Set-Cookie: HttpOnly; Secure` header.
  3. On every subsequent request, the server reads the cookie and queries Redis/DB to validate the session.

#### Pros:
- **Instant Revocation:** Deleting the key in Redis immediately logs the user out or revokes their permissions in 0 ms.
- **Opaque & Private:** The client only holds an opaque pointer; zero sensitive metadata is exposed to the frontend.
- **Tiny Payload:** A UUID cookie is only ~36 bytes on the wire.

#### Cons:
- **Database / Cache Bottleneck:** Every single HTTP request incurs network roundtrip latency to the session store.
- **Single Point of Failure (SPOF):** If the central session cluster goes down, all platform authentication fails.
- **Cross-Domain Friction:** Cookie domains and CORS policies make cross-domain or mobile authentication cumbersome.

---

### B. Stateless Authentication (JSON Web Token Model)

- **How it Works:**
  1. User logs in with credentials.
  2. Server packages identity and permissions into a JSON payload, signs it with a cryptographic key, and hands the signed string (**JWT**) to the client.
  3. On subsequent requests, the client sends `Authorization: Bearer <token>`.
  4. The receiving gateway or microservice verifies the digital signature **in-memory using CPU math** without querying any database.

#### Pros:
- **Zero Database I/O on Auth:** Authentication takes < 0.1 ms of CPU time without database lookups.
- **Decentralized Microservice Verification:** Services only need the **Public Key** to authenticate requests locally.
- **Cross-Platform Native:** Works seamlessly across iOS, Android, Single Page Apps, CLI tools, and webhooks.

#### Cons:
- **Revocation Dilemma:** Once signed, a JWT is valid until its `exp` timestamp. You cannot easily "un-sign" a token.
- **Stale Claims:** If a user's role is demoted, their active JWT continues asserting the old role until it expires.
- **Payload Bloat:** Adds 500 bytes to 2 KB to every HTTP header.

---

### C. Stateful vs. Stateless Summary Table

| Dimension | Stateful Sessions (Redis) | Stateless JWT |
| :--- | :--- | :--- |
| **Verification Location** | Central Database / Redis Cluster | Local Gateway / Microservice Memory |
| **Network Overhead per Request** | 1 DB/Redis network roundtrip | **Zero network calls** (In-memory CPU) |
| **Instant Revocation** | **Trivial & Immediate** | Requires expiration or session blacklist |
| **Horizontal Scalability** | Limited by Redis memory & connections | **Virtually Infinite** |
| **Best Used For** | Monoliths, banking apps, internal admin panels | Distributed microservices, mobile apps, high-throughput APIs |

---

## Chapter 2: The Core Dilemma — Is JWT Stateless or Stateful?

> **The Architectural Truth:**  
> **JWT is a token format, not inherently a stateless or stateful authentication system.**  
> A JWT authentication system is **stateless** when the backend validates requests without maintaining or checking server-side session state. It becomes **stateful** the moment the server checks a database or cache on every request.

---

### A. Why JWT is Stateless by Default

A standard JWT contains all information required to verify identity and permissions without checking a database:

```json
{
  "sub": "user_123",
  "orgId": "org_456",
  "role": "admin",
  "exp": 1790000000
}
```

```mermaid
flowchart LR
    Client["Client"] -->|"Request + Bearer JWT"| Backend["Backend / API Gateway"]
    Backend --> Step1["1. Verify Signature (CPU Math)"]
    Step1 --> Step2["2. Check Expiration (exp > now)"]
    Step2 --> Step3["3. Extract Identity & Permissions"]
    Step3 --> Allow["Allow Request (Zero DB / Redis I/O)"]
```

---

### B. When and How to Make a JWT System Stateful

If your application requires **immediate logout on button click**, **instant user banning**, or **one-click "Logout from all devices"**, you must add server-side state back into the equation.

```mermaid
flowchart LR
    Client["Client"] -->|"Request + Bearer JWT"| Backend["Backend"]
    Backend --> Step1["1. Verify Signature & Expiry (CPU)"]
    Step1 --> Step2["2. Check Session in Redis (Network I/O)"]
    Step2 --> Check{"Session Valid in Redis?"}
    Check -->|Yes| Allow["Allow Request"]
    Check -->|No / Revoked| Reject["401 Unauthorized (Session Killed)"]
```

#### The 3 Production Patterns to Make JWTs Stateful:

1. **Pattern 1: Central Session Check (Full Stateful JWT):**
   - Include a `sessionId` (or `jti`) inside the JWT payload.
   - On every request, verify the JWT signature, then check `GET session:<sessionId>` in Redis.
   - **Tradeoff:** Solves instant revocation, but re-introduces Redis network latency on every request.

2. **Pattern 2: Distributed Blacklist / Bloom Filter (Revocation on Demand):**
   - Keep verification purely stateless by default.
   - When a user logs out early, write their `jti` (JWT ID) to a Redis blacklist with a TTL equal to the token's remaining lifespan.
   - For ultra-high-throughput gateways (> 100k req/sec), maintain a local **Bloom Filter** at the gateway synced via Redis Pub/Sub to check revocation in sub-microseconds.

3. **Pattern 3: Hybrid Architecture (Short-Lived Stateless JWT + Stateful Refresh Token):**
   - **Access Token (JWT):** Purely stateless, lifespan of **5 to 15 minutes**.
   - **Refresh Token:** Stateful, stored in Redis/DB with lifespan of **7 to 30 days**.
   - When the access token expires, the client calls `/auth/refresh`. The server checks the refresh token in Redis, rotates it, and issues a new 10-minute JWT.
   - **Why Seniors Choose This:** Binds maximum vulnerability to 10 minutes while preserving 99% of stateless performance benefits.

---

### C. Stateless JWT vs. Stateful JWT Comparison

| Feature | Pure Stateless JWT | Stateful JWT (JWT + Session Store) |
| :--- | :--- | :--- |
| **DB/Redis Lookup per Request** | **Not Required** | **Required** |
| **Immediate Logout** | Not inherently supported | **Supported** |
| **Token Revocation** | Requires waiting for `exp` or blacklisting | Easy (Delete session key) |
| **Server-Side Session Storage** | Not required | Required (Redis cluster) |
| **Horizontal Gateway Scaling** | **Effortless** | Requires shared session cluster |

---

## Chapter 3: How JWT Works Under the Hood: Cryptographic Mechanics

A JSON Web Token (RFC 7519) consists of three Base64Url-encoded parts separated by periods (`.`):

```text
JWT Format = Header . Payload . Signature
```

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMTIzIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzkwMDAwMDAwfQ.k8A9Z_...
```

```mermaid
flowchart TD
    subgraph JWT_Structure["JSON Web Token Structure (RFC 7519)"]
        direction LR
        H["Part 1: Header<br/>Base64Url Encoded"] --- DOT1["."]
        DOT1 --- P["Part 2: Payload<br/>Base64Url Encoded"]
        P --- DOT2["."]
        DOT2 --- S["Part 3: Signature<br/>Cryptographic Hash"]
    end

    subgraph Signature_Generation["Signature Computation Flow"]
        H_ENC["Base64Url(Header)"] --> COMBINE["Concatenate with '.'"]
        P_ENC["Base64Url(Payload)"] --> COMBINE
        COMBINE --> HASH_FN["Crypto Algorithm (HMAC-SHA256 / RSA-SHA256)"]
        KEY["Private Key or Secret"] --> HASH_FN
        HASH_FN --> SIG_OUT["Calculated Signature"]
    end
```

---

### 1. Part 1: Header (Metadata)
Specifies the algorithm and token type:
```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

---

### 2. Part 2: Payload (Claims / Identity)
Contains identity claims and permissions:
```json
{
  "sub": "user_123",
  "orgId": "org_456",
  "role": "admin",
  "permissions": ["video:write", "projects:read"],
  "iat": 1711680000,
  "exp": 1711680900
}
```

> [!WARNING]
> **Payload is Encoded, NOT Encrypted!**  
> Base64Url encoding is fully reversible. Anyone who intercepts a JWT can decode and read the JSON payload. **Never store passwords, credit card numbers, or API secrets inside a standard JWT payload.**

---

### 3. Part 3: Signature (Tamper-Proof Guarantee)

The signature is computed over the encoded header and payload:

```text
Signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  server_secret
)
```

#### Why Tampering is Mathematically Impossible:
1. Attacker intercepts JWT with `"role": "user"`.
2. Attacker modifies payload to `"role": "admin"` and Base64Url encodes it.
3. Attacker forwards the modified token to the API Gateway.
4. The Gateway takes the Header + Modified Payload, runs the cryptographic signing function with the server's private secret, and compares the resulting signature with the token's signature.
5. **The signatures do not match.** The request is immediately rejected with `401 Unauthorized`.

---

### 4. Symmetric (HS256) vs. Asymmetric (RS256 / Ed25519 + JWKS)

```mermaid
flowchart TD
    subgraph Symmetric_HS256["Symmetric Signing: HS256 (Shared Secret)"]
        AuthSvc1["Auth Service"] -->|"Signs with Secret 'xyz'"| JWT1["JWT Token"]
        JWT1 --> Gateway1["API Gateway / Microservice"]
        Gateway1 -->|"Verifies using SAME Secret 'xyz'"| OK1["Verified"]
        Note1["Risk: If 1 microservice leaks secret, entire system is compromised"]
    end

    subgraph Asymmetric_RS256["Asymmetric Signing: RS256 (Public / Private Key)"]
        AuthSvc2["Auth Service (IdP)"] -->|"Signs with PRIVATE Key"| JWT2["JWT Token"]
        JWT2 --> Gateway2["Microservice A"]
        JWT2 --> Gateway3["Microservice B"]
        Gateway2 -->|"Verifies with PUBLIC Key (JWKS)"| OK2["Verified"]
        Gateway3 -->|"Verifies with PUBLIC Key (JWKS)"| OK3["Verified"]
    end
```

- **HS256 (Shared Secret):** Fast and simple, but every service that verifies the token must know the shared secret. If one microservice is compromised, all services are exposed.
- **RS256 / Ed25519 (Public/Private Key Pair):** **Production Standard for Microservices.** Only the Auth Service holds the Private Key to sign tokens. Downstream microservices only need the **Public Key** (fetched from `/.well-known/jwks.json`) to verify tokens locally with zero risk of secret compromise.

---

## Chapter 4: API Key vs. JWT — Which is Better for Your API?

A fundamental architectural question for backend engineering teams:

> **Core Rule:**  
> **Use API Keys for External Developers / Server-to-Server integrations.**  
> **Use JWTs for Internal User Authentication & Frontend Sessions.**

```mermaid
flowchart LR
    subgraph External_Developers["External Developers & Server Daemons"]
        ExtDev["Developer Backend / Cron"] -->|"Header: Authorization: Bearer sk_live_..."| GW1["API Gateway"]
        GW1 -->|"Query Hashed Key in Cache/DB"| DB1[("Postgres / Redis")]
        DB1 -->|"Org ID, Scopes, Quotas"| GW1
    end

    subgraph Internal_Users["Internal Frontend & Mobile Users"]
        UserApp["Web App / Mobile App"] -->|"Header: Authorization: Bearer eyJhbGci..."| GW2["API Gateway"]
        GW2 -->|"In-Memory Cryptographic Check"| CPU["Instant Local CPU Math"]
    end
```

### In-Depth Comparison Matrix

| Feature / Dimension | API Key (`sk_live_...`) | JSON Web Token (JWT) |
| :--- | :--- | :--- |
| **Primary Use Case** | External developer & server-to-server API access | Human user authentication & web/mobile sessions |
| **Format** | Opaque, high-entropy random secret string | Structured, signed Base64Url JSON (`Header.Payload.Signature`) |
| **Validation Mechanism** | Database / Cache lookup & hash comparison | In-memory cryptographic signature verification |
| **Expiration** | Optional, long-lived, or permanent until rotated | Short-lived (5 to 15 minutes) |
| **Revocation** | **Instant & Straightforward** (Update `is_active = false`) | Requires token expiration or Redis blacklist |
| **Permissions & Scopes** | Stored in DB and associated with Key ID / Org | Embedded directly inside token payload (`role`, `permissions`) |
| **Rate Limiting & Quotas** | Easy per key, organization, or project tier | Extracted from `sub` or `orgId` claims |
| **Database Load** | 1 DB/Cache query per incoming API request | **Zero DB queries** (100% CPU in-memory math) |
| **Best Fit For** | Stripe, SendGrid, OpenAI-style public APIs | Consumer web apps, mobile apps, internal microservices |

---

## Chapter 5: Recommended Architecture — The Dual-Track Gateway

To support both human users and third-party developers, decouple your authentication layer into a **Dual-Track Gateway**:

```
                             INCOMING HTTP REQUEST
                                       │
                                       ▼
                             API Gateway / Reverse Proxy
                                       │
                                       ▼
                              Authentication Layer
                                       │
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
        External Request (API Key)                 Internal User (JWT)
                  │                                         │
                  ▼                                         ▼
        Validate API Key Hash                      Verify Signature & Expiry
        (Fast Cache / DB Lookup)                   (In-Memory CPU Math)
                  │                                         │
                  ▼                                         ▼
        Check Org Scopes & Quotas                  Check User Role & Tenant Context
                  │                                         │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                             Upstream Business Logic
                                       │
                                       ▼
                               HTTP API Response
```

---

## Chapter 6: Track A — External API Key System Design

For users integrating your APIs into their own applications (e.g., AI video generation, payment processing, transactional email):

### 1. Real-World API Request Example
```http
POST /api/v1/generate-video HTTP/1.1
Host: api.yourplatform.com
Authorization: Bearer sk_test_mock_example_key_xxxxxxxx
Content-Type: application/json

{
  "prompt": "Cinematic shot of a cyberpunk city at night",
  "resolution": "1080p"
}
```

---

### 2. External API Key Lifecycle & Security Rules

```mermaid
sequenceDiagram
    autonumber
    actor Dev as External Developer
    actor Dash as Developer Dashboard
    actor Auth as Auth Backend
    actor DB as Database (Postgres)
    
    Dev->>Dash: Click "Create API Key" (name: "Video Worker", scope: "video:write")
    Dash->>Auth: POST /api-keys/create
    Note over Auth: 1. Generate 32-byte secure random string<br/>2. Format: sk_live_[random_hex]<br/>3. Compute SHA-256 hash of raw key
    Auth->>DB: INSERT INTO api_keys (org_id, key_prefix, key_hash, scopes, rate_limit)
    Auth-->>Dash: Return RAW Key (Shown ONCE)
    Dash-->>Dev: "Copy key now. You will never be able to see it again!"
```

#### Security Best Practices for API Keys:
1. **Never Store Raw Keys in the Database:** Store only the `SHA-256` cryptographic hash of the key. If your database is compromised, the attacker cannot use the hashed keys.
2. **Key Prefixes for Indexing:** Prefix keys with environment identifiers:
   - `sk_live_...` -> Production Secret Key
   - `sk_test_...` -> Sandbox / Test Mode Key
   - Store the first 8 characters (`key_prefix = "sk_live_9f82"`) in plaintext in a database index to quickly locate the key record, then verify the hash.
3. **Billing, Credits & Quotas:** Associate each API Key with an `organization_id` or `user_id` so that API consumption, credit balance deductions, rate limits, and revocation apply uniformly.

---

## Chapter 7: When to Use JWT for External APIs & Master Decision Matrix

### When Should You Use JWT for External APIs?
While API Keys are standard for simple server-to-server calls, use **JWTs for external integrations** when:
1. **OAuth 2.0 Delegated Authorization:** Third-party applications (e.g., Zapier, GitHub integrations) acting on behalf of a user with user-approved scopes.
2. **Short-Lived Ephemeral Actions:** Pre-signed upload/download tokens for direct S3/Cloudflare R2 transfers.
3. **Decentralized Enterprise Verification:** When external partners need to verify authenticity locally using your public JWKS without calling your servers.

---

### Master Architectural Decision Matrix

| Integration Flow | Recommended Auth Strategy | Architectural Rationale |
| :--- | :--- | :--- |
| **Your Web/Mobile Frontend -> Backend** | **Short-Lived JWT + Refresh Token** | Zero DB auth latency; secure HttpOnly cookie refresh rotation. |
| **External Developers -> Backend API** | **Hashed API Key (`sk_live_...`)** | Persistent developer DX; instant revocation; credit tracking. |
| **Third-Party App acting on User's Behalf** | **OAuth 2.0 + JWT Access Token** | Granular user-delegated scopes; RFC-compliant consent screens. |
| **Microservice A -> Microservice B** | **mTLS or Asymmetric RS256 JWT** | Zero-trust service mesh identity; local public-key verification. |
| **Public Endpoints (Health, Landing)** | **No Authentication** | Protected by Cloudflare WAF, IP rate limits, and DDoS shields. |

---

## 🛡️ Tech Lead Golden Rules

1. **Dual-Track Separation:** Use API Keys for external developers; use JWT for frontend user sessions.
2. **Never Store Raw API Keys:** Store only `SHA-256` hashes + key prefixes (`sk_live_...`).
3. **Payloads are Public:** Base64Url is encoding, not encryption. Never store sensitive credentials in a JWT payload.
4. **Microservice Standard:** Use asymmetric **RS256 / Ed25519 with JWKS** so microservices verify tokens locally with public keys.
5. **Enforce Expiration:** Stateless JWT access tokens must expire in **5–15 minutes**, paired with stateful refresh tokens for session renewal.
