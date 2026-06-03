// Unit Conversion Strategy Helper

export const UNIT_TYPES = {
  WEIGHT: 'Weight',
  VOLUME: 'Volume',
  COUNT: 'Count'
};

export const BASE_UNITS = {
  [UNIT_TYPES.WEIGHT]: 'g',
  [UNIT_TYPES.VOLUME]: 'mL',
  [UNIT_TYPES.COUNT]: 'item'
};

// Conversions multiplier/divider relative to base units
const CONVERSION_FACTORS = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  item: 1
};

/**
 * Gets the unit type (Weight, Volume, Count) based on a unit name.
 */
export function getUnitType(unit) {
  if (['g', 'kg'].includes(unit)) return UNIT_TYPES.WEIGHT;
  if (['mL', 'L'].includes(unit)) return UNIT_TYPES.VOLUME;
  if (['item'].includes(unit)) return UNIT_TYPES.COUNT;
  throw new Error(`Unsupported unit: ${unit}`);
}

/**
 * Converts a quantity from a source unit to its base unit.
 * e.g., 2.5 kg -> 2500 g
 */
export function convertQuantityToBase(quantity, unit) {
  const factor = CONVERSION_FACTORS[unit];
  if (!factor) {
    throw new Error(`Unsupported unit: ${unit}`);
  }
  return Number(quantity) * factor;
}

/**
 * Converts a price from price-per-unit to price-per-base-unit.
 * e.g., ₹50 per kg -> ₹0.05 per gram
 */
export function convertPriceToBase(price, unit) {
  const factor = CONVERSION_FACTORS[unit];
  if (!factor) {
    throw new Error(`Unsupported unit: ${unit}`);
  }
  return Number(price) / factor;
}

/**
 * Converts a quantity in base unit to a target display unit.
 * e.g., 2500 g -> 2.5 kg
 */
export function convertQuantityFromBase(quantity, targetUnit) {
  const factor = CONVERSION_FACTORS[targetUnit];
  if (!factor) {
    throw new Error(`Unsupported target unit: ${targetUnit}`);
  }
  return Number(quantity) / factor;
}

/**
 * Formats a display value nicely.
 */
export function formatFriendlyQuantity(baseQuantity, unitType) {
  const q = Number(baseQuantity);
  if (unitType === UNIT_TYPES.WEIGHT) {
    if (q >= 1000) {
      return `${(q / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
    }
    return `${q} g`;
  }
  if (unitType === UNIT_TYPES.VOLUME) {
    if (q >= 1000) {
      return `${(q / 1000).toFixed(2).replace(/\.?0+$/, '')} L`;
    }
    return `${q} mL`;
  }
  return `${q} item${q !== 1 ? 's' : ''}`;
}
