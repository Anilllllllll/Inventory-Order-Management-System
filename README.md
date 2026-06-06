Inventory & Order Management System

Tech Stack
Frontend
React.js
Tailwind CSS
React Router
Axios
Backend
Node.js
Express.js
JWT Authentication
bcrypt
Database
Neon PostgreSQL
Prisma ORM
Deployment
Frontend: Vercel
Backend: Render/Railway
Database: Neon PostgreSQL

<img width="1367" height="746" alt="image" src="https://github.com/user-attachments/assets/b85485a0-58e8-4cd5-98fc-99eac7588bb5" />


<img width="1336" height="748" alt="image" src="https://github.com/user-attachments/assets/4ea21aca-bf7a-469d-8fd3-412510869ef2" />


User Roles
Admin
Login
Manage Products (CRUD)
View Orders/Quotations
Update Order Status
View Inventory
User/Seller
Register/Login
Search Products
Filter Products
Create Quotation
Place Orders
View Order History
Database Design
Users
id UUID
name VARCHAR(100)
email VARCHAR(255)
password VARCHAR(255)
role ENUM('ADMIN','USER')
created_at TIMESTAMP
Products
id UUID
name VARCHAR(255)
sku VARCHAR(50)
category VARCHAR(100)

base_unit VARCHAR(20)
base_price NUMERIC(20,6)

stock_quantity NUMERIC(20,6)

created_at TIMESTAMP
Orders
id UUID
user_id UUID
status VARCHAR(50)

total_amount NUMERIC(20,6)

created_at TIMESTAMP
Order Items
id UUID
order_id UUID
product_id UUID

ordered_unit VARCHAR(20)

ordered_quantity NUMERIC(20,6)

converted_quantity NUMERIC(20,6)

unit_price NUMERIC(20,6)

subtotal NUMERIC(20,6)
Unit Conversion Strategy
Weight
1 kg = 1000 g

Store internally in:

grams (g)

Example:

2 kg → 2000 g
Volume
1 L = 1000 mL

Store internally in:

milliliters (mL)

Example:

3 L → 3000 mL
Count
item = item

Store internally as:

item
Price Storage

Use:

NUMERIC(20,6)

Reason:

High precision
No floating point errors
Supports large values

Example:

₹1250.567890
Main Screens
Authentication
Login
Register
User Dashboard
Search Products
Filter Products
Product Details
Create Quotation
Place Order
Order History
Admin Dashboard
Manage Products
Add Product
Edit Product
Delete Product
View Orders
Update Status
Inventory Overview
Order Flow
Step 1

User searches:

Sugar
Step 2

Product:

Rate:
₹50 per kg

Stored:

₹0.05 per gram
Step 3

User enters:

2.5 kg

System converts:

2500 g
Step 4

Calculation

2500 × 0.05

= ₹125
Step 5

Quotation Preview

Product: Sugar

Quantity:
2.5 kg

Converted:
2500 g

Total:
₹125
Folder Structure
inventory-system/

├── client/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── utils/
│
├── prisma/
│
└── README.md
