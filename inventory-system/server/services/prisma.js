import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const USE_MOCK_DB = process.env.USE_MOCK_DB !== 'false'; // Default to true if not explicitly false

let prismaInstance;

// Setup in-memory databases
const users = [];
const products = [];
const orders = [];
const orderItems = [];

// Helper to generate UUID-like string
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Seed in-memory databases with mock data
const seedInMemoryDB = async () => {
  const adminHash = await bcrypt.hash('admin123', 10);
  const sellerHash = await bcrypt.hash('seller123', 10);

  users.push({
    id: generateUUID(),
    name: 'System Admin Manager',
    email: 'admin@invenflow.com',
    password: adminHash,
    role: 'ADMIN',
    createdAt: new Date()
  });

  users.push({
    id: generateUUID(),
    name: 'Sarah Seller',
    email: 'seller@invenflow.com',
    password: sellerHash,
    role: 'USER',
    createdAt: new Date()
  });

  products.push(
    {
      id: generateUUID(),
      name: 'White Sugar',
      sku: 'GRO-SUG-A9F3',
      category: 'Groceries',
      baseUnit: 'g',
      basePrice: new Prisma.Decimal(0.05),
      stockQuantity: new Prisma.Decimal(50000),
      createdAt: new Date()
    },
    {
      id: generateUUID(),
      name: 'Whole Milk',
      sku: 'GRO-MLK-B8X2',
      category: 'Groceries',
      baseUnit: 'mL',
      basePrice: new Prisma.Decimal(0.06),
      stockQuantity: new Prisma.Decimal(30000),
      createdAt: new Date()
    },
    {
      id: generateUUID(),
      name: 'Wheat Flour',
      sku: 'GRO-FLR-C7V1',
      category: 'Groceries',
      baseUnit: 'g',
      basePrice: new Prisma.Decimal(0.04),
      stockQuantity: new Prisma.Decimal(5000),
      createdAt: new Date()
    },
    {
      id: generateUUID(),
      name: 'Ballpoint Pen',
      sku: 'STA-PEN-D6K4',
      category: 'Stationery',
      baseUnit: 'item',
      basePrice: new Prisma.Decimal(15.00),
      stockQuantity: new Prisma.Decimal(25),
      createdAt: new Date()
    },
    {
      id: generateUUID(),
      name: 'Sticky Notes',
      sku: 'STA-STK-E5M9',
      category: 'Stationery',
      baseUnit: 'item',
      basePrice: new Prisma.Decimal(20.00),
      stockQuantity: new Prisma.Decimal(4),
      createdAt: new Date()
    }
  );
};

// Immediately seed the mock DB in the background
if (USE_MOCK_DB) {
  seedInMemoryDB().then(() => {
    console.log('💡 In-memory Mock Database initialized successfully.');
  });
}

// Build the Prisma Client mockup
const mockPrisma = {
  user: {
    findUnique: async ({ where }) => {
      if (where.email) {
        return users.find(u => u.email === where.email.toLowerCase().trim()) || null;
      }
      if (where.id) {
        return users.find(u => u.id === where.id) || null;
      }
      return null;
    },
    create: async ({ data }) => {
      const newUser = {
        id: generateUUID(),
        name: data.name,
        email: data.email.toLowerCase().trim(),
        password: data.password,
        role: data.role || 'USER',
        createdAt: new Date()
      };
      users.push(newUser);
      return newUser;
    }
  },

  product: {
    count: async ({ where } = {}) => {
      let filtered = [...products];
      if (where) {
        if (where.OR) {
          const search = where.OR[0].name.contains.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.sku.toLowerCase().includes(search)
          );
        }
        if (where.category) {
          const cat = where.category.equals.toLowerCase();
          filtered = filtered.filter(p => p.category.toLowerCase() === cat);
        }
      }
      return filtered.length;
    },
    findMany: async ({ where, skip, take, orderBy } = {}) => {
      let filtered = [...products];
      if (where) {
        if (where.OR) {
          const search = where.OR[0].name.contains.toLowerCase();
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.sku.toLowerCase().includes(search)
          );
        }
        if (where.category) {
          const cat = where.category.equals.toLowerCase();
          filtered = filtered.filter(p => p.category.toLowerCase() === cat);
        }
      }
      
      // Order By
      if (orderBy && orderBy.createdAt) {
        filtered.sort((a, b) => orderBy.createdAt === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
      }

      // Pagination
      if (skip !== undefined && take !== undefined) {
        filtered = filtered.slice(skip, skip + take);
      }
      return filtered;
    },
    findUnique: async ({ where }) => {
      if (where.id) {
        return products.find(p => p.id === where.id) || null;
      }
      if (where.sku) {
        return products.find(p => p.sku === where.sku) || null;
      }
      return null;
    },
    create: async ({ data }) => {
      const newProduct = {
        id: generateUUID(),
        name: data.name,
        sku: data.sku,
        category: data.category,
        baseUnit: data.baseUnit,
        basePrice: new Prisma.Decimal(data.basePrice),
        stockQuantity: new Prisma.Decimal(data.stockQuantity),
        createdAt: new Date()
      };
      products.push(newProduct);
      return newProduct;
    },
    update: async ({ where, data }) => {
      const idx = products.findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error('Product not found');
      
      const current = products[idx];
      const updated = {
        ...current,
        name: data.name !== undefined ? data.name : current.name,
        sku: data.sku !== undefined ? data.sku : current.sku,
        category: data.category !== undefined ? data.category : current.category,
        baseUnit: data.baseUnit !== undefined ? data.baseUnit : current.baseUnit,
        basePrice: data.basePrice !== undefined ? new Prisma.Decimal(data.basePrice) : current.basePrice,
        stockQuantity: data.stockQuantity !== undefined ? new Prisma.Decimal(data.stockQuantity) : current.stockQuantity
      };
      products[idx] = updated;
      return updated;
    },
    delete: async ({ where }) => {
      const idx = products.findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error('Product not found');
      products.splice(idx, 1);
      return { id: where.id };
    },
    groupBy: async ({ by }) => {
      // Simplistic category aggregation
      const categoriesMap = {};
      products.forEach(p => {
        categoriesMap[p.category] = (categoriesMap[p.category] || 0) + 1;
      });
      return Object.keys(categoriesMap).map(cat => ({
        category: cat,
        _count: { _all: categoriesMap[cat] }
      }));
    }
  },

  order: {
    count: async ({ where } = {}) => {
      let filtered = [...orders];
      if (where && where.userId) {
        filtered = filtered.filter(o => o.userId === where.userId);
      }
      return filtered.length;
    },
    findMany: async ({ where, include, orderBy, skip, take } = {}) => {
      let filtered = [...orders];
      if (where && where.userId) {
        filtered = filtered.filter(o => o.userId === where.userId);
      }

      // Populate user and items relationships
      const result = filtered.map(order => {
        const orderUser = users.find(u => u.id === order.userId);
        const orderItemsList = orderItems
          .filter(oi => oi.orderId === order.id)
          .map(item => {
            const prod = products.find(p => p.id === item.productId);
            return { ...item, product: prod };
          });

        return {
          ...order,
          user: orderUser ? { id: orderUser.id, name: orderUser.name, email: orderUser.email } : null,
          items: orderItemsList
        };
      });

      // Sort
      if (orderBy && orderBy.createdAt) {
        result.sort((a, b) => orderBy.createdAt === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
      }

      // Pagination
      if (skip !== undefined && take !== undefined) {
        return result.slice(skip, skip + take);
      }
      return result;
    },
    findUnique: async ({ where, include }) => {
      const order = orders.find(o => o.id === where.id);
      if (!order) return null;

      const orderUser = users.find(u => u.id === order.userId);
      const orderItemsList = orderItems
        .filter(oi => oi.orderId === order.id)
        .map(item => {
          const prod = products.find(p => p.id === item.productId);
          return { ...item, product: prod };
        });

      return {
        ...order,
        user: orderUser ? { id: orderUser.id, name: orderUser.name, email: orderUser.email } : null,
        items: orderItemsList
      };
    },
    create: async ({ data }) => {
      const newOrder = {
        id: generateUUID(),
        userId: data.userId,
        status: data.status || 'Pending',
        totalAmount: new Prisma.Decimal(data.totalAmount),
        createdAt: new Date()
      };
      orders.push(newOrder);
      return newOrder;
    },
    update: async ({ where, data }) => {
      const idx = orders.findIndex(o => o.id === where.id);
      if (idx === -1) throw new Error('Order not found');
      orders[idx].status = data.status;
      return orders[idx];
    },
    aggregate: async ({ where, _sum }) => {
      let filtered = [...orders];
      if (where && where.status) {
        filtered = filtered.filter(o => o.status === where.status);
      }
      
      const sum = filtered.reduce((total, o) => total.plus(o.totalAmount), new Prisma.Decimal(0));
      return {
        _sum: {
          totalAmount: sum
        }
      };
    }
  },

  orderItem: {
    create: async ({ data }) => {
      const newItem = {
        id: generateUUID(),
        orderId: data.orderId,
        productId: data.productId,
        orderedUnit: data.orderedUnit,
        orderedQuantity: new Prisma.Decimal(data.orderedQuantity),
        convertedQuantity: new Prisma.Decimal(data.convertedQuantity),
        unitPrice: new Prisma.Decimal(data.unitPrice),
        subtotal: new Prisma.Decimal(data.subtotal)
      };
      orderItems.push(newItem);
      return newItem;
    }
  },

  $transaction: async (fn) => {
    // Sequentially execute the function passing the mock client itself
    return await fn(mockPrisma);
  }
};

if (USE_MOCK_DB) {
  prismaInstance = mockPrisma;
} else {
  prismaInstance = new PrismaClient();
}

export default prismaInstance;
export { Prisma };
