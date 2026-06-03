import prisma from '../services/prisma.js';
import { getUnitType, formatFriendlyQuantity } from '../utils/unitConverter.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total products count
    const totalProducts = await prisma.product.count();

    // 2. Order statistics (counts by status)
    const orderGroups = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });

    const orderStats = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Total: 0
    };

    orderGroups.forEach(group => {
      orderStats[group.status] = group._count._all;
      orderStats.Total += group._count._all;
    });

    // 3. Total revenue/sales (sum of totalAmount for Approved orders)
    const revenueSum = await prisma.order.aggregate({
      where: { status: 'Approved' },
      _sum: {
        totalAmount: true
      }
    });
    const totalSales = revenueSum._sum.totalAmount || 0;

    // 4. Low stock indicator products
    // Thresholds:
    // - weight (g): < 10,000 g (10 kg)
    // - volume (mL): < 10,000 mL (10 L)
    // - count (item): < 10 items
    const allProducts = await prisma.product.findMany();
    const lowStockProducts = allProducts
      .filter(product => {
        const qty = Number(product.stockQuantity);
        if (product.baseUnit === 'g') return qty < 10000;
        if (product.baseUnit === 'mL') return qty < 10000;
        return qty < 10; // Count item
      })
      .map(product => {
        const unitType = getUnitType(product.baseUnit);
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          baseUnit: product.baseUnit,
          stockQuantity: product.stockQuantity,
          friendlyStock: formatFriendlyQuantity(product.stockQuantity, unitType)
        };
      });

    // 5. Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    return res.json({
      totalProducts,
      orderStats,
      totalSales,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      recentOrders
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ message: 'Error calculating dashboard stats', error: error.message });
  }
};
