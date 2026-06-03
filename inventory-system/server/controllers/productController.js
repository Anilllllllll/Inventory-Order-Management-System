import prisma from '../services/prisma.js';
import { generateSKU } from '../utils/skuGenerator.js';
import {
  getUnitType,
  convertQuantityToBase,
  convertPriceToBase,
  formatFriendlyQuantity,
  BASE_UNITS
} from '../utils/unitConverter.js';
import { validateProduct } from '../utils/validator.js';

// Get all products (with pagination, search, and filtering)
export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Format products to include unit types and user-friendly displays
    const formattedProducts = products.map(product => {
      const unitType = getUnitType(product.baseUnit);
      return {
        ...product,
        unitType,
        friendlyStock: formatFriendlyQuantity(product.stockQuantity, unitType)
      };
    });

    return res.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const unitType = getUnitType(product.baseUnit);

    return res.json({
      ...product,
      unitType,
      friendlyStock: formatFriendlyQuantity(product.stockQuantity, unitType)
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// Create a product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, sku, category, inputUnit, pricePerUnit, stockQuantity } = req.body;

    const validation = validateProduct({ name, category, inputUnit, pricePerUnit, stockQuantity });
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors.join(', '), errors: validation.errors });
    }

    // Determine unit type and target base unit
    let unitType;
    try {
      unitType = getUnitType(inputUnit);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const baseUnit = BASE_UNITS[unitType];

    // Convert values to base
    const basePrice = convertPriceToBase(pricePerUnit, inputUnit);
    const stockQuantityBase = convertQuantityToBase(stockQuantity, inputUnit);

    // Generate SKU if not provided
    const productSku = (sku && sku.trim()) || generateSKU(name, category);

    // Check SKU uniqueness
    const existingProduct = await prisma.product.findUnique({
      where: { sku: productSku }
    });

    if (existingProduct) {
      return res.status(400).json({ message: `Product SKU '${productSku}' already exists` });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: productSku,
        category: category.trim(),
        baseUnit,
        basePrice,
        stockQuantity: stockQuantityBase
      }
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: {
        ...product,
        unitType,
        friendlyStock: formatFriendlyQuantity(product.stockQuantity, unitType)
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// Update a product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, inputUnit, pricePerUnit, stockQuantity } = req.body;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Combine updates with existing fields for validation
    const testProduct = {
      name: name !== undefined ? name : existingProduct.name,
      category: category !== undefined ? category : existingProduct.category,
      inputUnit: inputUnit !== undefined ? inputUnit : existingProduct.baseUnit,
      pricePerUnit: pricePerUnit !== undefined ? pricePerUnit : Number(existingProduct.basePrice),
      stockQuantity: stockQuantity !== undefined ? stockQuantity : Number(existingProduct.stockQuantity)
    };

    const validation = validateProduct(testProduct);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors.join(', '), errors: validation.errors });
    }

    const data = {};
    if (name) data.name = name.trim();
    if (category) data.category = category.trim();

    if (sku && sku.trim() !== existingProduct.sku) {
      // Check SKU uniqueness
      const skuCheck = await prisma.product.findUnique({
        where: { sku: sku.trim() }
      });
      if (skuCheck) {
        return res.status(400).json({ message: `Product SKU '${sku.trim()}' already exists` });
      }
      data.sku = sku.trim();
    }

    // Handle unit conversion if update fields are provided
    if (inputUnit && (pricePerUnit !== undefined || stockQuantity !== undefined)) {
      let unitType;
      try {
        unitType = getUnitType(inputUnit);
      } catch (err) {
        return res.status(400).json({ message: err.message });
      }

      data.baseUnit = BASE_UNITS[unitType];

      if (pricePerUnit !== undefined) {
        data.basePrice = convertPriceToBase(pricePerUnit, inputUnit);
      }
      if (stockQuantity !== undefined) {
        data.stockQuantity = convertQuantityToBase(stockQuantity, inputUnit);
      }
    } else {
      // If only raw base fields are sent directly
      if (pricePerUnit !== undefined) {
        // Assume price per current base unit
        data.basePrice = pricePerUnit;
      }
      if (stockQuantity !== undefined) {
        // Assume quantity in current base unit
        data.stockQuantity = stockQuantity;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data
    });

    const unitType = getUnitType(updatedProduct.baseUnit);

    return res.json({
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        unitType,
        friendlyStock: formatFriendlyQuantity(updatedProduct.stockQuantity, unitType)
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// Delete a product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await prisma.product.delete({
      where: { id }
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// Get all product categories
export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: {
        _all: true
      }
    });

    return res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};
