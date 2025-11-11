## House of Charity Database Schema

This document captures the proposed relational design with separate donor and NGO entities, a many-to-many link table, donation tracking, and NGO requests.

---

### donors

| Column             | Type          | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| `id`               | UUID (PK)     | Primary key, generated in backend          |
| `name`             | VARCHAR(255)  | Donor full name                            |
| `email`            | VARCHAR(255)  | Unique contact/login email                 |
| `phone_number`     | VARCHAR(20)   | Mobile or phone                            |
| `address`          | TEXT          | Full address                               |
| `city`             | VARCHAR(100)  | City                                        |
| `state`            | VARCHAR(100)  | State/Province                              |
| `country`          | VARCHAR(100)  | Defaults to `India`                         |
| `pincode`          | VARCHAR(10)   | Postal code                                 |
| `description`      | TEXT          | Profile bio                                 |
| `website`          | VARCHAR(255)  | Personal site or social link                |
| `logo_url`         | VARCHAR(500)  | Avatar / profile image                      |
| `verified`         | BOOLEAN       | Defaults to `FALSE`                         |
| `created_at`       | TIMESTAMP     | Defaults to `CURRENT_TIMESTAMP`            |
| `updated_at`       | TIMESTAMP     | Auto-updated on record changes             |

---

### ngos

| Column             | Type          | Notes                                      |
|--------------------|---------------|--------------------------------------------|
| `id`               | UUID (PK)     | Primary key                                |
| `name`             | VARCHAR(255)  | NGO name                                   |
| `email`            | VARCHAR(255)  | Unique primary contact email               |
| `phone_number`     | VARCHAR(20)   | Office contact                             |
| `address`          | TEXT          | HQ or mailing address                      |
| `city`             | VARCHAR(100)  | City                                        |
| `state`            | VARCHAR(100)  | State/Province                              |
| `country`          | VARCHAR(100)  | Defaults to `India`                         |
| `pincode`          | VARCHAR(10)   | Postal code                                 |
| `works_done`       | TEXT          | Summary of projects completed              |
| `awards_received`  | TEXT          | Awards, recognitions                       |
| `description`      | TEXT          | Mission statement                          |
| `website`          | VARCHAR(255)  | Public website                             |
| `logo_url`         | VARCHAR(500)  | Brand logo                                 |
| `verified`         | BOOLEAN       | Defaults to `FALSE`                        |
| `created_at`       | TIMESTAMP     | Defaults to `CURRENT_TIMESTAMP`            |
| `updated_at`       | TIMESTAMP     | Auto-updated on record changes             |

---

### donor_ngo_links

| Column                | Type                                | Notes                                      |
|-----------------------|-------------------------------------|--------------------------------------------|
| `id`                  | BIGINT (PK, auto-increment)         | Surrogate key for the link                 |
| `donor_id`            | UUID (FK → `donors.id`)             | Donor in the relationship                  |
| `ngo_id`              | UUID (FK → `ngos.id`)               | NGO in the relationship                    |
| `relationship_status` | ENUM(`interested`,`active`,`inactive`,`blocked`) | Engagement state             |
| `notes`               | TEXT                                | Optional comments                          |
| `connected_at`        | TIMESTAMP                           | When the link was created                  |
| `updated_at`          | TIMESTAMP                           | Auto-updated on changes                    |

> **Indexes:** unique composite index on (`donor_id`, `ngo_id`) plus individual indexes for filtering.

---

### donations

| Column            | Type                                              | Notes                                                   |
|-------------------|---------------------------------------------------|---------------------------------------------------------|
| `id`              | UUID (PK)                                         | Donation identifier                                     |
| `donor_id`        | UUID (FK → `donors.id`)                           | Source donor                                            |
| `ngo_id`          | UUID (FK → `ngos.id`)                             | Recipient NGO                                           |
| `donation_type`   | ENUM(`money`,`food`,`daily_essentials`,`services`,`other`) | Category of donation                |
| `amount`          | DECIMAL(12,2)                                     | Monetary value when type is `money`                     |
| `currency`        | VARCHAR(3)                                        | ISO code, defaults to INR                               |
| `quantity`        | DECIMAL(12,2)                                     | Quantity for in-kind contributions                      |
| `unit`            | VARCHAR(50)                                       | Unit for quantity (kg, boxes, hours)                    |
| `details`         | TEXT                                              | Description of items/services                           |
| `status`          | ENUM(`pending`,`confirmed`,`completed`,`cancelled`,`failed`) | Fulfilment status             |
| `created_at`      | TIMESTAMP                                         | Defaults to `CURRENT_TIMESTAMP`                         |
| `updated_at`      | TIMESTAMP                                         | Auto-updated                                            |

---

### donation_requests

| Column         | Type                                              | Notes                                                      |
|----------------|---------------------------------------------------|------------------------------------------------------------|
| `id`           | UUID (PK)                                         | Request identifier                                         |
| `ngo_id`       | UUID (FK → `ngos.id`)                             | NGO making the request                                     |
| `request_type` | ENUM(`money`,`food`,`daily_essentials`,`services`,`other`) | Expected contribution type          |
| `details`      | TEXT                                              | Description of needs                                       |
| `amount_needed`| DECIMAL(12,2)                                     | Target amount for money requests                           |
| `currency`     | VARCHAR(3)                                        | ISO code, defaults to INR                                  |
| `quantity`     | DECIMAL(12,2)                                     | Quantity for goods/services                                |
| `unit`         | VARCHAR(50)                                       | Unit for quantity                                          |
| `priority`     | ENUM(`low`,`medium`,`high`,`urgent`)              | Urgency indicator                                          |
| `status`       | ENUM(`open`,`matched`,`fulfilled`,`cancelled`)    | Current request state                                      |
| `created_at`   | TIMESTAMP                                         | Defaults to `CURRENT_TIMESTAMP`                            |
| `updated_at`   | TIMESTAMP                                         | Auto-updated                                               |

---

### Relationships

- `donor_ngo_links` enforces the many-to-many relationship so any donor can connect with multiple NGOs and vice versa without risking inconsistencies.
- `donations` references the donor and NGO involved; if needed, add a join table to map donations to specific requests.
- `donation_requests` store NGO needs; they can be fulfilled by one or many donations depending on business rules.
