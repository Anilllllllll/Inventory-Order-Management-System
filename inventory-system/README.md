# InvenFlow | Inventory & Order Management System

InvenFlow is a modern, responsive full-stack inventory and order management system built with a high-end dark-themed aesthetic, robust role-based access control, and a dynamic unit conversion pipeline.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Tailwind CSS, Axios, Lucide Icons, React Router DOM, React Hot Toast
* **Backend:** Node.js, Express.js, Prisma ORM, JSON Web Tokens (JWT), bcryptjs
* **Database:** Neon PostgreSQL (or any PostgreSQL instance)

---

## 📐 Project Structure

```
inventory-system/
├── client/          # Vite React + Tailwind CSS client
│   ├── src/
│   │   ├── components/  # Layouts, Protected Routes
│   │   ├── context/     # Auth Session Context
│   │   ├── pages/       # Login, Register, Dashboards, Catalog
│   │   └── services/    # Axios API config
│   └── index.html
│
├── server/          # Node + Express.js API Server
│   ├── controllers/ # Auth, Products, Orders, Stats controllers
│   ├── middleware/  # JWT Auth & Role guards
│   ├── routes/      # Server endpoints
│   ├── utils/       # Unit converter & SKU generator
│   └── server.js    # Entry point
│
├── prisma/          # Prisma database config
│   ├── schema.prisma # PostgreSQL models schema
│   └── seed.js      # Mock inventory seed script
│
└── README.md
```

---

## ⚙️ Setup and Installation

### 1. Database Configuration
Create a `.env` file inside the `server/` directory (a default template is created for you) and update the `DATABASE_URL` with your Neon PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@your-neon-host.neon.tech/invenflow?sslmode=require"
JWT_SECRET="super-secret-key-12345"
PORT=5000
```

### 2. Database Migrations & Seeding
From the `server/` directory, run the following commands to push the schema to PostgreSQL, generate the Prisma Client, and seed the database with mock users and products:

```bash
# Install dependencies (already completed locally)
npm install

# Push the schema and apply migrations
npx prisma db push --schema=../prisma/schema.prisma

# Seed the database
npx prisma db seed --schema=../prisma/schema.prisma
```

---

## 🚀 Running the Application

### Start the Backend Server
Navigate to the `server/` directory and run:
```bash
npm run dev
```
The server will run on `http://localhost:5000`.

### Start the Frontend Client
Navigate to the `client/` directory and run:
```bash
npm run dev
```
The React frontend will spin up on `http://localhost:5173`. Open this URL in your web browser.

---

## 👤 Sample Accounts for Testing

Once you run the database seed script, you can log in immediately using these pre-configured roles:

### 1. Administrator Account
* **Email:** `admin@invenflow.com`
* **Password:** `admin123`
* **Features:** Full Product CRUD, view inventory analytics, approve/reject pending orders, stock refill alerts.

### 2. Seller / Sales Agent Account
* **Email:** `seller@invenflow.com`
* **Password:** `seller123`
* **Features:** Search and category filter, dynamic unit conversions, quotation builder panel, place orders, check personal order logs.

---

## ⚖️ Unit Conversion Logic Details

Products store their stock quantity and prices internally in **base units** (grams for weights, milliliters for volumes, items for counts) to prevent floating-point inaccuracies and support precise pricing math (e.g. ₹50.00/kg is saved as ₹0.05/gram). 

The system automatically performs conversions at both the client and server levels:
* **Weight:** 1 kg = 1000 g
* **Volume:** 1 L = 1000 mL
* **Count:** 1 item = 1 item
* **Database Prices:** Stored as `NUMERIC(20,6)` for high precision.
