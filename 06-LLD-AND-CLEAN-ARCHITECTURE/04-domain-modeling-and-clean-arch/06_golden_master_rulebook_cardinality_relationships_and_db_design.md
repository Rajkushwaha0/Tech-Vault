# The Golden Master Rulebook: Cardinality, Object Relationships & Database Design

> **Track:** LLD & Domain Modeling  
> **Type:** Master Reference & Production Cheat Sheet  
> **Level:** SDE-1 / SDE-2 $\rightarrow$ Senior Engineer / Tech Lead  
> **Purpose:** The definitive, step-by-step playbook to design 3NF relational schemas, detect UML relationships, and isolate Aggregate Roots with zero guesswork.

---

## 🧭 Master Part 1: The 4 Object Relationships at a Glance

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       THE 4 OBJECT RELATIONSHIPS                                       │
├─────────────────┬──────────┬─────────────────────────────┬──────────────┬──────────────────────────────┤
│ Relationship    │ Symbol   │ Java/C# Code Representation │ Child Dies?  │ Database Rule                │
├─────────────────┼──────────┼─────────────────────────────┼──────────────┼──────────────────────────────┤
│ **DEPENDENCY**  │ Uses-A   │ Method parameter / local var│ Lives on     │ Zero foreign keys            │
│ **ASSOCIATION** │ Knows-A  │ Instance variable reference │ Lives on     │ FK with ON DELETE RESTRICT   │
│ **AGGREGATION** │ Has-A    │ List/Collection of items    │ Lives on     │ Junction or SET NULL         │
│ **COMPOSITION** │ Has-A    │ List/Collection of items    │ ❌ **DIES**   │ FK with ON DELETE CASCADE    │
└─────────────────┴──────────┴─────────────────────────────┴──────────────┴──────────────────────────────┘
```

---

## 🧭 Master Part 2: The 2-Step Universal Decision Tree

Whenever analyzing any two entities (**Table A** and **Table B**), follow this exact 2-step test:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 THE 2-STEP UNIVERSAL DECISION TREE                               │
│                                                                                                  │
│  STEP 1: THE MULTIPLICITY TEST (Determines Cardinality ➔ 1:1, 1:N, N:M)                          │
│  • Ask: "Can ONE row of Table A link to MULTIPLE rows of Table B?" (Yes / No)                     │
│  • Ask: "Can ONE row of Table B link to MULTIPLE rows of Table A?" (Yes / No)                     │
│    ├─ (NO, NO)   ➔ 1 : 1 (One-to-One)                                                            │
│    ├─ (YES, NO)  ➔ 1 : N (One-to-Many)                                                           │
│    ├─ (NO, YES)  ➔ N : 1 (Many-to-One)                                                           │
│    └─ (YES, YES) ➔ N : M (Many-to-Many ➔ MUST USE JUNCTION TABLE!)                              │
│                                                                                                  │
│  STEP 2: THE DEATH TEST (Determines Relationship Type)                                           │
│  • Ask: "If Row A is deleted from the database right now, MUST Row B be deleted immediately to    │
│         prevent orphan data and keep the system valid?"                                          │
│    ├─ YES ➔ COMPOSITION (Child cannot exist without Parent. Example: Order -> OrderItems)        │
│    └─ NO  ➔ AGGREGATION or ASSOCIATION (Child has its own lifecycle. Example: Doctor -> Patient) │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧭 Master Part 3: The Tech Lead 5-Pass Mental Compiler for 3NF Database Design

This is the exact step-by-step cognitive algorithm to build any database schema:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 5-PASS COMPILER                             │
├────────────────────────────────────────────────────────────────────────┤
│ Pass 1: Split Catalog vs. Runtime Execution                            │
│ Pass 2: Apply Cardinality & Foreign Key Placement Rules                │
│ Pass 3: Isolate Aggregate Roots (The Single-Lock ACID Rule)            │
│ Pass 4: Apply 1NF, 2NF, and 3NF Normalization Rules                    │
│ Pass 5: Apply the Time-Travel Legal Snapshot Rule                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### ⚡ PASS 1: Split Catalog vs. Runtime Execution

Split the problem nouns into two completely separate buckets:

1. **Catalog Entities (Static Master Templates):**
   - Created before users interact.
   - Examples: `Product`, `QuestionBank`, `RoomType`, `RestaurantMenu`.
2. **Runtime Execution Entities (Dynamic Transactions):**
   - Created when a user performs an action (books, orders, takes an exam).
   - Examples: `Order`, `ExamAttempt`, `BookingReservation`, `PaymentTransaction`.

> 🚫 **Critical Rule:** Never put runtime status fields (e.g., `is_submitted`, `payment_status`) inside Catalog tables. Keep them strictly in Runtime Execution tables.

---

### ⚡ PASS 2: Exact Foreign Key Placement Rules

Never guess which table gets the foreign key column. Use these mathematical rules:

#### 1. In a One-to-Many ($1 : N$) Relationship:
- **Rule:** The foreign key column ALWAYS goes into the table on the **MANY ($N$)** side.
- **Example:** 1 `Customer` has Many `Orders`.
  - Parent Table: `customers(id, name, email)`
  - Child Table: `orders(id, customer_id, total_amount)` $\leftarrow$ `customer_id` is the FK.

#### 2. In a One-to-One ($1 : 1$) Relationship:
- **Rule:** The foreign key column goes into the **Dependent Table** with a `UNIQUE` constraint.
- **Example:** 1 `User` has 1 `UserProfile`.
  - Main Table: `users(id, email, password_hash)`
  - Dependent Table: `user_profiles(id, user_id UNIQUE, bio, avatar_url)` $\leftarrow$ `user_id` is unique.

#### 3. In a Many-to-Many ($N : M$) Relationship:
- **Rule:** Create a separate **Junction Table** whose Primary Key is the combination of both Foreign Keys.
- **Example:** 1 `Student` enrolls in Many `Courses`; 1 `Course` has Many `Students`.
  - Table 1: `students(id, name)`
  - Table 2: `courses(id, title)`
  - Junction Table: `course_enrollments(student_id, course_id, enrolled_at, PRIMARY KEY (student_id, course_id))`

---

### ⚡ PASS 3: Aggregate Root Detection (The "Single-Lock" Rule)

In Domain-Driven Design (DDD), an **Aggregate Root** is the single top-level entity that guards business rules and acts as the **ACID transaction boundary**.

#### How to detect the Aggregate Root:
Ask: *"When a user executes a write action, which single entity row must be locked with `SELECT ... FOR UPDATE` to prevent race conditions?"*

```
┌───────────────────────────────┬───────────────────────────────┬───────────────────────────────┐
│ Action                        │ Wrong Lock (Causes Deadlocks) │ Correct Aggregate Root (Lock) │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ Student submits exam code     │ Global `Contest` or `User`    │ `ExamAttempt` row             │
│ Customer adds item to cart    │ Global `Product` catalog      │ `ShoppingCart` row            │
│ Guest books a hotel room      │ Global `Hotel` property       │ `RoomInventoryCalendar` row   │
│ Splitwise user records bill   │ All 10 individual users       │ `Expense` aggregate row       │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

---

### ⚡ PASS 4: The 1NF, 2NF, 3NF Normalization Checklist

Follow these exact checks to ensure your tables are in 3NF:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE 3 NORMAL FORMS (3NF) CHECKLIST                                │
├─────────┬──────────────────────────────┬───────────────────────────────┬───────────────────────┤
│ Form    │ The Rule                     │ Bad Design (Violates Rule)    │ 3NF Fix               │
├─────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────┤
│ **1NF** │ Atomic Values                │ Column `phone_numbers`        │ Create table          │
│         │ (No comma-separated lists)   │ stores `"999-111, 888-222"`   │ `user_phone_numbers`  │
├─────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────┤
│ **2NF** │ Full Key Dependency          │ In junction `order_items`,    │ Move `product_name`   │
│         │ (No partial key dependency)  │ column `product_name` depends │ to `products` table   │
│         │                              │ only on `product_id`          │                       │
├─────────┼──────────────────────────────┼───────────────────────────────┼───────────────────────┤
│ **3NF** │ No Transitive Dependency     │ Table `orders` contains       │ Store `user_id` only; │
│         │ (Non-key columns depend only │ `user_city` and `user_zip`    │ query city from       │
│         │ on the Primary Key)          │                               │ `user_addresses`      │
└─────────┴──────────────────────────────┴───────────────────────────────┴───────────────────────┘
```

> 🎯 **The 3NF Motto:** *"Every non-key column must depend on the Key (1NF), the Whole Key (2NF), and Nothing but the Key (3NF)."*

---

### ⚡ PASS 5: The Time-Travel Legal Snapshot Rule

Whenever an entity records a financial, legal, or grading transaction, you **must not** rely on live joins to catalog tables.

Ask: *"If an admin edits the product price, item description, or tax rate tomorrow, should yesterday's receipts show the NEW price or the OLD price?"*

- If it must show the **OLD price**: Copy the value as an explicit column in the transaction table!

```sql
-- ❌ BAD: Dynamic JOIN to products (If price changes tomorrow, old orders change price!)
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INT
);

-- ✅ GOOD: Explicit Snapshot Columns for Legal & Financial Immutability
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price_at_purchase NUMERIC(10, 2) NOT NULL, -- Snapshot
    tax_rate_at_purchase NUMERIC(5, 2) NOT NULL,    -- Snapshot
    product_title_snapshot VARCHAR(255) NOT NULL    -- Snapshot
);
```

---

## 🧭 Master Part 4: Complete Relational Cheat Sheet Matrix

| Relationship Scenario | Cardinality | Parent Table | Child Table | FK Location & Constraints |
|---|---|---|---|---|
| **Author writes Books** | $1 : N$ Association | `authors(id, name)` | `books(id, author_id, title)` | `books.author_id` $\rightarrow$ `authors.id` |
| **Order contains Items** | $1 : N$ Composition | `orders(id, total)` | `order_items(id, order_id, ...)` | `order_items.order_id` with `ON DELETE CASCADE` |
| **User has UserProfile** | $1 : 1$ Composition | `users(id, email)` | `user_profiles(id, user_id, bio)` | `user_profiles.user_id` with `UNIQUE` |
| **Doctor visits Clinics** | $N : M$ Association | `doctors(id)`, `clinics(id)` | `doctor_clinics(doc_id, clinic_id)` | Junction table with composite PK `(doc_id, clinic_id)` |
| **Contest has Questions** | $1 : N$ Composition | `contests(id)` | `exam_questions(id, contest_id, ...)` | `exam_questions.contest_id` with `ON DELETE CASCADE` |
| **ExamQuestion from Bank**| $N : 1$ Association | `question_bank(id)` | `exam_questions(id, qbank_id, ...)` | `exam_questions.qbank_id` with `ON DELETE SET NULL` + Snapshot |
| **Attempt has Scorecard** | $1 : 1$ Composition | `exam_attempts(id)` | `scorecards(id, attempt_id, ...)` | `scorecards.attempt_id` with `UNIQUE` + `CASCADE` |

---

## 🧭 Master Part 5: The 5 Questions to Ask the Interviewer

Never guess ambiguous requirements. Ask these 5 questions during the first 3 minutes of an LLD interview:

1. **Multi-Vendor / Scope:** *"Can a single order contain items from multiple merchants, or is it strictly 1 merchant per order?"*
2. **Exclusivity / Sharing:** *"Can a resource (e.g., Doctor, Driver, Room) be shared across multiple entities ($N:M$), or is it dedicated to one ($1:N$)?"*
3. **Deletion & Audit Compliance:** *"When a user deletes their account, do we cascade-delete their orders, or retain anonymized records for tax/audit laws?"*
4. **Custom Pricing / Overrides:** *"Is the price of an item global, or can different contests/stores set custom pricing and weightages?"*
5. **Concurrency Limits:** *"Can multiple users book the same physical slot simultaneously, or must we enforce strict mutual exclusion?"*

---

## 🔗 Related System Drills
- [04_production_drill_food_delivery_order_aggregate_relationships.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/04_production_drill_food_delivery_order_aggregate_relationships.md)
- [05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/05_production_drill_telemedicine_prescription_aggregate_and_relationship_discovery.md)
- [06_production_drill_splitwise_expense_settlement_ledger.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/06_production_drill_splitwise_expense_settlement_ledger.md)
- [07_production_drill_online_assessment_and_examination_engine.md](file:///Users/flixstock/Desktop/personal%20project/learn/06-LLD-AND-CLEAN-ARCHITECTURE/05-system-drills/07_production_drill_online_assessment_and_examination_engine.md)
