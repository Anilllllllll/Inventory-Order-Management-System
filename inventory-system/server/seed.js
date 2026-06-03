import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample inventory records...');

  // 1. Clean existing data
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin Manager',
      email: 'admin@invenflow.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });

  const seller = await prisma.user.create({
    data: {
      name: 'Sarah Seller',
      email: 'seller@invenflow.com',
      password: sellerPassword,
      role: 'USER'
    }
  });

  console.log('Created Users:', { admin: admin.email, seller: seller.email });

  // 4. Create Products
  const products = [
    {
      name: 'White Sugar',
      sku: 'GRO-SUG-A9F3',
      category: 'Groceries',
      baseUnit: 'g',
      basePrice: 0.05, // ₹0.05 per gram (Translates to ₹50 per kg)
      stockQuantity: 50000 // 50 kg Stored as 50,000 g
    },
    {
      name: 'Whole Milk',
      sku: 'GRO-MLK-B8X2',
      category: 'Groceries',
      baseUnit: 'mL',
      basePrice: 0.06, // ₹0.06 per mL (Translates to ₹60 per L)
      stockQuantity: 30000 // 30 L Stored as 30,000 mL
    },
    {
      name: 'Wheat Flour',
      sku: 'GRO-FLR-C7V1',
      category: 'Groceries',
      baseUnit: 'g',
      basePrice: 0.04, // ₹0.04 per gram (Translates to ₹40 per kg)
      stockQuantity: 5000 // 5 kg Stored as 5000 g (Triggers low stock alert since < 10kg)
    },
    {
      name: 'Ballpoint Pen',
      sku: 'STA-PEN-D6K4',
      category: 'Stationery',
      baseUnit: 'item',
      basePrice: 15.00, // ₹15 per item
      stockQuantity: 25 // 25 items
    },
    {
      name: 'Sticky Notes',
      sku: 'STA-STK-E5M9',
      category: 'Stationery',
      baseUnit: 'item',
      basePrice: 20.00, // ₹20 per item
      stockQuantity: 4 // 4 items (Triggers low stock alert since < 10 items)
    }
  ];

  for (const item of products) {
    await prisma.product.create({ data: item });
  }

  console.log('Seeded 5 sample products successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
