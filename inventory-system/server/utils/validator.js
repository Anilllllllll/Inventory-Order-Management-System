// Backend Validation Utility

/**
 * Validates user registration data.
 */
export function validateRegistration({ name, email, password, role }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (role && !['ADMIN', 'USER'].includes(role)) {
    errors.push('Invalid user role. Must be ADMIN or USER');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates product details.
 */
export function validateProduct({ name, category, inputUnit, pricePerUnit, stockQuantity }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters long');
  }

  if (!category || category.trim().length < 2) {
    errors.push('Category must be at least 2 characters long');
  }

  const validUnits = ['g', 'kg', 'mL', 'L', 'item'];
  if (!inputUnit || !validUnits.includes(inputUnit)) {
    errors.push(`Invalid input unit. Must be one of: ${validUnits.join(', ')}`);
  }

  if (pricePerUnit === undefined || Number(pricePerUnit) < 0) {
    errors.push('Price per unit must be a positive number');
  }

  if (stockQuantity === undefined || Number(stockQuantity) < 0) {
    errors.push('Stock quantity must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
