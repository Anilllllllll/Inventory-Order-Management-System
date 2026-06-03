import prisma from '../services/prisma.js';
import {
  getUnitType,
  convertQuantityToBase,
  formatFriendlyQuantity
} from '../utils/unitConverter.js';
import { Prisma } from '@prisma/client';

// Place an order (User/Seller only)
export const createOrder = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, orderedUnit, orderedQuantity }
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    // We run the validation first, then execute everything inside a prisma transaction
    const validationErrors = [];
    const processedItems = [];
    let orderTotal = new Prisma.Decimal(0);

    // Fetch all products involved to check stock and details
    for (const item of items) {
      const { productId, orderedUnit, orderedQuantity } = item;

      if (!productId || !orderedUnit || orderedQuantity === undefined || Number(orderedQuantity) <= 0) {
        return res.status(400).json({ message: 'Invalid order item parameters' });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      // Check unit alignment
      let productUnitType;
      let orderUnitType;
      try {
        productUnitType = getUnitType(product.baseUnit);
        orderUnitType = getUnitType(orderedUnit);
      } catch (err) {
        return res.status(400).json({ message: `Unit conversion error for ${product.name}: ${err.message}` });
      }

      if (productUnitType !== orderUnitType) {
        return res.status(400).json({
          message: `Unit mismatch for product '${product.name}': Cannot order in '${orderedUnit}' when product base unit is '${product.baseUnit}'`
        });
      }

      // Convert quantity to base unit
      const convertedQuantityVal = convertQuantityToBase(orderedQuantity, orderedUnit);
      const convertedQuantity = new Prisma.Decimal(convertedQuantityVal);

      // Check stock
      if (product.stockQuantity.lessThan(convertedQuantity)) {
        const friendlyStock = formatFriendlyQuantity(product.stockQuantity, productUnitType);
        const requestedFriendly = `${orderedQuantity} ${orderedUnit}`;
        validationErrors.push(
          `Insufficient stock for '${product.name}'. Available: ${friendlyStock}, Requested: ${requestedFriendly}`
        );
        continue;
      }

      // Calculate prices
      const unitPrice = product.basePrice; // price per base unit
      const subtotal = convertedQuantity.times(unitPrice);
      orderTotal = orderTotal.plus(subtotal);

      processedItems.push({
        productId,
        name: product.name,
        orderedUnit,
        orderedQuantity: new Prisma.Decimal(orderedQuantity),
        convertedQuantity,
        unitPrice,
        subtotal,
        currentStock: product.stockQuantity
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Order validation failed',
        errors: validationErrors
      });
    }

    // Execute order creation and stock deduction in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const order = await tx.order.create({
        data: {
          userId,
          status: 'Pending',
          totalAmount: orderTotal
        }
      });

      // 2. Create order items and update product stocks
      for (const item of processedItems) {
        // Create OrderItem
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            orderedUnit: item.orderedUnit,
            orderedQuantity: item.orderedQuantity,
            convertedQuantity: item.convertedQuantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal
          }
        });

        // Deduct product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: item.currentStock.minus(item.convertedQuantity)
          }
        });
      }

      return order;
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};

// Get order history (Sellers see their own, Admins see all)
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role !== 'ADMIN') {
      where.userId = req.user.id;
    }

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, category: true, baseUnit: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    // Format output with friendly labels if needed
    const formattedOrders = orders.map(order => {
      const formattedItems = order.items.map(item => {
        const unitType = getUnitType(item.product.baseUnit);
        return {
          ...item,
          friendlyOrdered: `${item.orderedQuantity} ${item.orderedUnit}`,
          friendlyConverted: formatFriendlyQuantity(item.convertedQuantity, unitType)
        };
      });

      return {
        ...order,
        items: formattedItems
      };
    });

    return res.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

// Get single order details
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, category: true, baseUnit: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Access control
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Cannot access this order' });
    }

    const formattedItems = order.items.map(item => {
      const unitType = getUnitType(item.product.baseUnit);
      return {
        ...item,
        friendlyOrdered: `${item.orderedQuantity} ${item.orderedUnit}`,
        friendlyConverted: formatFriendlyQuantity(item.convertedQuantity, unitType)
      };
    });

    return res.json({
      ...order,
      items: formattedItems
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    return res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Approved, Rejected, Pending

    if (!status || !['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value. Must be Pending, Approved, or Rejected' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    if (previousStatus === status) {
      return res.json({ message: 'Order status is already ' + status, order });
    }

    // Handle stock changes based on status changes
    // If order becomes 'Rejected', return stock to inventory.
    // If order returns from 'Rejected' to 'Approved' or 'Pending', deduct stock again.
    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (status === 'Rejected' && previousStatus !== 'Rejected') {
        // Return stock
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: product.stockQuantity.plus(item.convertedQuantity)
              }
            });
          }
        }
      } else if (previousStatus === 'Rejected' && status !== 'Rejected') {
        // Re-deduct stock
        const errors = [];
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          if (!product || product.stockQuantity.lessThan(item.convertedQuantity)) {
            errors.push(`Cannot re-process order. Insufficient stock for product ID: ${item.productId}`);
          }
        }

        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        // Deduct stock
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: product.stockQuantity.minus(item.convertedQuantity)
            }
          });
        }
      }

      // Update the status
      return await tx.order.update({
        where: { id },
        data: { status }
      });
    });

    return res.json({
      message: `Order status updated from '${previousStatus}' to '${status}'`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

// Create a quotation preview (No DB entries, pure calculation for client)
export const previewQuotation = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Quotation items are required' });
    }

    const previewItems = [];
    let quotationTotal = 0;

    for (const item of items) {
      const { productId, orderedUnit, orderedQuantity } = item;

      if (!productId || !orderedUnit || orderedQuantity === undefined || Number(orderedQuantity) <= 0) {
        return res.status(400).json({ message: 'Invalid quotation item parameters' });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      const productUnitType = getUnitType(product.baseUnit);
      const orderUnitType = getUnitType(orderedUnit);

      if (productUnitType !== orderUnitType) {
        return res.status(400).json({
          message: `Unit mismatch for product '${product.name}'`
        });
      }

      const convertedQuantity = convertQuantityToBase(orderedQuantity, orderedUnit);
      const unitPrice = Number(product.basePrice); // price per base unit
      const subtotal = convertedQuantity * unitPrice;
      quotationTotal += subtotal;

      previewItems.push({
        productId,
        name: product.name,
        category: product.category,
        sku: product.sku,
        orderedUnit,
        orderedQuantity: Number(orderedQuantity),
        convertedQuantity,
        baseUnit: product.baseUnit,
        unitPrice, // price per base unit
        friendlyUnitPrice: `₹${(unitPrice * (orderedUnit === 'kg' || orderedUnit === 'L' ? 1000 : 1)).toFixed(2)} per ${orderedUnit}`,
        subtotal
      });
    }

    return res.json({
      items: previewItems,
      totalAmount: quotationTotal
    });
  } catch (error) {
    console.error('Preview quotation error:', error);
    return res.status(500).json({ message: 'Error calculating quotation', error: error.message });
  }
};
