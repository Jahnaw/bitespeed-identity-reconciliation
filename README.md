# Bitespeed Backend Task – Identity Reconciliation

This project implements the **Identity Reconciliation** backend service for Bitespeed. The service consolidates multiple customer identities (emails and phone numbers) into a single unified profile.

---

## 🚀 Tech Stack

* **Backend:** Node.js, TypeScript, Express
* **Database:** PostgreSQL
* **ORM:** Prisma

---

## 📌 Problem Summary

Customers may place multiple orders using different emails or phone numbers. Bitespeed needs a way to:

* Identify if different contact details belong to the same customer
* Link them together
* Always return a **single consolidated customer profile**

Contacts are linked if **either email OR phone number matches**.
The **oldest contact** is treated as the **primary**, and others are **secondary**.

---

## 🔗 API Endpoint

### `POST /identify`

#### Request Body (JSON only)

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

> At least one of `email` or `phoneNumber` will always be present.

---

#### Response Format

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

**Rules:**

* Primary email and phone appear first
* No duplicates
* All linked contacts are included

---

## 🧠 Logic Handled

* New customer → create **primary** contact
* Existing customer with new info → create **secondary** contact
* Two primaries connected → merge and downgrade newer primary
* Always return a unified response

---

## 🛠️ Running Locally

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Setup environment variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
```

### 3️⃣ Run migrations

```bash
npx prisma migrate dev
```

### 4️⃣ Start server

```bash
npm run dev
```

Server runs on:

```
http://localhost:3000
```

---

## 🧪 Testing

Use Postman or curl:

```http
POST /identify
Content-Type: application/json

{
  "email": "test@example.com",
  "phoneNumber": "123456"
}
```

---

## 🌐 Hosted Endpoint

> https://bitespeed-identity-reconciliation-oxjy.onrender.com
