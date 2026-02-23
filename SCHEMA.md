# Database Schema Specification

## Client Proof Vault

This document defines the required database schema for Client Proof Vault.
It is the **single source of truth** for Supabase table design and RLS rules.

---

## 1. Users

Authentication is handled by **Supabase Auth**.

- Table: `auth.users`
- No custom user profile table in v1
- All ownership is derived from `auth.users.id`

---

## 2. Proof Pages

### Table: `proof_pages`

| Column       | Type      | Notes                |
| ------------ | --------- | -------------------- |
| id           | uuid      | Primary key          |
| user_id      | uuid      | FK → auth.users.id   |
| title        | text      |                      |
| headline     | text      |                      |
| bio          | text      | Nullable             |
| slug         | text      | Unique               |
| status       | enum      | `draft`, `published` |
| theme        | enum      | `light`, `dark`      |
| accent_color | enum      | Preset list          |
| created_at   | timestamp |                      |
| updated_at   | timestamp |                      |

**Constraints**

- One proof page per user (unique constraint on `user_id`)
- Slug must be globally unique

---

## 3. Proof Sections

### Table: `proof_sections`

| Column        | Type      | Notes                                   |
| ------------- | --------- | --------------------------------------- |
| id            | uuid      | Primary key                             |
| proof_page_id | uuid      | FK → proof_pages.id                     |
| type          | enum      | `testimonial`, `work_example`, `metric` |
| position      | int       | Ordering                                |
| created_at    | timestamp |                                         |

**Rules**

- Sections are ordered by `position`
- Cascade delete on proof page deletion

---

## 4. Testimonials

### Table: `testimonials`

| Column           | Type      | Notes                  |
| ---------------- | --------- | ---------------------- |
| id               | uuid      | Primary key            |
| proof_section_id | uuid      | FK → proof_sections.id |
| name             | text      |                        |
| role_company     | text      | Nullable               |
| quote            | text      |                        |
| avatar_url       | text      | Nullable               |
| created_at       | timestamp |                        |

---

## 5. Work Examples

### Table: `work_examples`

| Column           | Type      | Notes                  |
| ---------------- | --------- | ---------------------- |
| id               | uuid      | Primary key            |
| proof_section_id | uuid      | FK → proof_sections.id |
| image_url        | text      | Nullable               |
| link_url         | text      | Nullable               |
| description      | text      |                        |
| metric_text      | text      | Nullable               |
| created_at       | timestamp |                        |

---

## 6. Metrics

### Table: `metrics`

| Column           | Type      | Notes                  |
| ---------------- | --------- | ---------------------- |
| id               | uuid      | Primary key            |
| proof_section_id | uuid      | FK → proof_sections.id |
| label            | text      |                        |
| value            | text      |                        |
| created_at       | timestamp |                        |

---

## 7. Page Views

### Table: `page_views`

| Column        | Type      | Notes               |
| ------------- | --------- | ------------------- |
| id            | uuid      | Primary key         |
| proof_page_id | uuid      | FK → proof_pages.id |
| viewed_at     | timestamp |                     |

**Rules**

- Anonymous inserts allowed
- Read access restricted to owning user

---

## 8. Row Level Security (RLS)

RLS must be enabled on **all tables**.

### Authenticated Users

- Full read/write access to records they own
- Ownership determined via `user_id` or join through proof_page

### Public / Anonymous Users

- Read access to published proof pages only
- Read access to sections and content belonging to published pages
- Insert access to `page_views` only
- No update or delete access

---

## 9. Storage

### Supabase Storage Bucket: `proof-media`

Rules:

- Files are associated with owning `user_id`
- Only owners can upload or delete
- Public read access only for published proof pages

---

## 10. Notes for Implementation

- Use UUID primary keys everywhere
- Enforce referential integrity with foreign keys
- Add indexes where appropriate for public page lookup (slug, status)
- Do not introduce tables or features not listed here
