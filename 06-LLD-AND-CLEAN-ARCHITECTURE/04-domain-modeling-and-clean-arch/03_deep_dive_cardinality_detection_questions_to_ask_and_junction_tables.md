# Master Guide: Cardinality Detection, Interview Discovery Questions, & Junction Table Architecture

> **Track:** LLD & Domain Modeling  
> **Topic:** How Cardinality Works (`1:1`, `1:N`, `N:M`), The 2-Way Question Formula, Questions to Ask the Interviewer, & Database Mapping  
> **Level:** SDE-1 / SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Purpose:** 100% precision in detecting cardinalities and designing relational schemas without hesitation.

---

## 🧭 Executive Summary: What is Cardinality from First Principles?

In software and database design, **Cardinality (Multiplicity)** defines the **numerical relationship** between two entities:  
*How many instances of Entity B can be linked to a single instance of Entity A, and vice-versa?*

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE 4 CARDINALITY QUADRANTS                                      │
├─────────────────┬─────────────────┬───────────────────┬──────────────────────────────────────────┤
│ Direction 1     │ Direction 2     │ Result            │ Database Mechanism                       │
│ (A ➔ B)         │ (B ➔ A)         │                   │                                          │
├─────────────────┼─────────────────┼───────────────────┼──────────────────────────────────────────┤
│ 1 (Only One)    │ 1 (Only One)    │ **1 : 1**         │ FK on dependent table with **UNIQUE**    │
│ Many (Multiple) │ 1 (Only One)    │ **1 : N**         │ FK placed strictly on the **"MANY"** side│
│ 1 (Only One)    │ Many (Multiple) │ **N : 1**         │ FK placed strictly on the **"MANY"** side│
│ Many (Multiple) │ Many (Multiple) │ **N : M**         │ **Dedicated Junction / Association Table**│
└─────────────────┴─────────────────┴───────────────────┴──────────────────────────────────────────┘
```

---

## 1. The 2-Way Question Formula (Fail-Safe Algorithm)

Whenever you encounter two entities in an LLD interview (e.g., `Doctor` and `Clinic`, or `Student` and `Course`), **never guess**. Execute these two questions out loud:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      THE 2-WAY QUESTION ALGORITHM                           │
│                                                                             │
│  QUESTION 1 (Forward): "Can ONE Entity A have / belong to MULTIPLE B's?"    │
│  QUESTION 2 (Backward): "Can ONE Entity B have / belong to MULTIPLE A's?"   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deep Dive into the 3 Core Cardinalities

---

### 🏛️ 1. `1 : 1` (One-to-One Relationship)

* **Definition:** Exactly one instance of A corresponds to at most one instance of B.
* **Real-World Examples:**
  - `User` $\leftrightarrow$ `PassportProfile` (1 user has 1 passport; 1 passport belongs to 1 user).
  - `Order` $\leftrightarrow$ `Invoice` (1 order generates 1 invoice; 1 invoice is for 1 order).
  - `User` $\leftrightarrow$ `UserSecuritySettings` (1 user has 1 security settings record).

#### 🗄️ Database Implementation:
Place the Foreign Key on the **dependent / optional child table** and add a **`UNIQUE` constraint**:

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE passport_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    passport_number VARCHAR(50) NOT NULL,
    UNIQUE (user_id) -- 🔒 GUARANTEES 1:1 ENFORCEMENT AT THE DATABASE ENGINE LEVEL!
);
```

---

### 🏛️ 2. `1 : N` (One-to-Many Relationship)

* **Definition:** One instance of A can be linked to multiple instances of B, but an instance of B belongs to only ONE instance of A.
* **Real-World Examples:**
  - `Customer` $\leftrightarrow$ `Orders` (1 customer places many orders; 1 order belongs to 1 customer).
  - `Restaurant` $\leftrightarrow$ `MenuItems` (1 restaurant has 100 menu items; 1 menu item belongs to 1 restaurant).
  - `Department` $\leftrightarrow$ `Employees` (1 department has 50 employees; each employee has 1 department).

#### 🗄️ Database Implementation:
The Foreign Key **ALWAYS goes on the "MANY" side table**. Never put an array of child IDs on the parent!

```sql
CREATE TABLE restaurants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- 🔒 The Foreign Key belongs on the "MANY" table (menu_items)
CREATE TABLE menu_items (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_cents BIGINT NOT NULL
);
```

---

### 🏛️ 3. `N : M` (Many-to-Many Relationship)

* **Definition:** One instance of A can link to multiple instances of B, **AND** one instance of B can link to multiple instances of A.
* **Real-World Examples:**
  - `Doctor` $\leftrightarrow$ `Clinic` (1 doctor visits many clinics; 1 clinic has many doctors).
  - `Student` $\leftrightarrow$ `Course` (1 student enrolls in 5 courses; 1 course has 100 students).
  - `Movie` $\leftrightarrow$ `Actor` (1 movie has a cast of 20 actors; 1 actor acts in 50 movies).
  - `User` $\leftrightarrow$ `Role` (1 user has `['ADMIN', 'SUPPORT']`; 1 role is assigned to 1,000 users).

#### 🗄️ Database Implementation (The Junction / Association Table):
Relational databases cannot store arrays across normalized rows. You **must introduce a third table**:

```sql
-- Table A
CREATE TABLE doctors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL
);

-- Table B
CREATE TABLE clinics (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL
);

-- 🔗 JUNCTION TABLE (Association Table)
CREATE TABLE doctor_clinic_affiliations (
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    clinic_id VARCHAR(36) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    
    -- 💡 SENIOR INSIGHT: Junction tables can store relationship-specific metadata!
    consultation_fee_cents BIGINT NOT NULL, -- Dr. Strange charges $50 at Clinic A, but $80 at Clinic B!
    room_number VARCHAR(20),
    working_days VARCHAR(50),               -- e.g. "MON,WED,FRI"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (doctor_id, clinic_id)      -- 🔒 Composite Primary Key prevents duplicate links!
);
```

---

## 3. What Questions Should You Ask the Interviewer?

In real-world business, cardinality is not always fixed; **it depends on the company's business rules**.

Asking the right clarifying questions immediately demonstrates Senior / Tech Lead maturity:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                            5 ESSENTIAL INTERVIEW CLARIFYING QUESTIONS                            │
├───────────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Domain Area                   │ Exact Question to Ask the Interviewer                            │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **1. Multi-Vendor / Scope**   │ *"Can an order contain items from multiple restaurants/vendors,   │
│                               │  or is an order restricted to a single restaurant?"*             │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **2. Employment & Exclusivity**│ *"Are doctors/drivers exclusively tied to one hospital/fleet,   │
│                               │  or can they operate across multiple clinics/platforms?"*         │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **3. Profiles & Tenants**     │ *"Can a user belong to multiple workspaces/organizations, or    │
│                               │  is their account strictly bound to a single workspace?"*        │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **4. History & Rescheduling** │ *"When a driver/doctor cancels, do we keep an audit trail of all │
│                               │  past assigned drivers, or just overwrite the current active one?"*│
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **5. Discounts & Coupons**    │ *"Can a customer apply multiple promo codes to a single cart,    │
│                               │  or is it strictly 1 coupon per order?"*                         │
└───────────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 4. Common Candidate Traps & How to Avoid Them

### ❌ Trap 1: The "Catalog Concept" vs. "Ordered Line Item" Trap
* **The Confusion:** A candidate thinks: *"A Product can be in many Orders, and an Order has many Products, so `Order <-> Product` is N:M!"*
* **Why it's a Trap:** In an actual order, you don't just link to `Product`. You create an **`OrderItem` Entity** with quantity, locked price, and custom toppings.
  - `Order` $\leftrightarrow$ `OrderItem`: **`1 : N` Composition**.
  - `OrderItem` $\leftrightarrow$ `Product`: **`N : 1` Reference**.

### ❌ Trap 2: The Comma-Separated List / JSON Array Anti-Pattern
* **The Mistake:** Storing `clinic_ids: "c1,c2,c3"` or `roles: ["ADMIN", "EDITOR"]` in a single varchar/text column.
* **Why it breaks:** You cannot index foreign keys, cannot enforce foreign key integrity (`ON DELETE CASCADE`), and queries like *"Find all doctors in Clinic X"* require slow full table scans (`LIKE '%c1%'`).
* **✅ Fix:** Always use a dedicated Junction Table for `N : M` relations.

---

## 📊 Summary Comparison Cheat Sheet

| Question | If Answer is YES | If Answer is NO |
| :--- | :--- | :--- |
| **Can 1 A have multiple B?** | Move to Question 2 | Cardinality is either `1:1` or `N:1` |
| **Can 1 B have multiple A?** | If Q1 was YES $\rightarrow$ **`N : M` (Junction Table)** | If Q1 was YES $\rightarrow$ **`1 : N` (FK on B)** |

---

## 🔗 Related Vault Topics
- [02_lld_interview_framework_cardinality_and_db_schema_design.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/02_lld_interview_framework_cardinality_and_db_schema_design.md)
- [03_production_db_design_normalization_3nf_indexing_concurrency.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/03_production_db_design_normalization_3nf_indexing_concurrency.md)
- [04_production_drill_food_delivery_order_aggregate_relationships.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/04-domain-modeling-and-clean-arch/04_production_drill_food_delivery_order_aggregate_relationships.md)
