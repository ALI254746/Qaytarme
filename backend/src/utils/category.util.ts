/**
 * Category Utility Functions
 * 
 * This utility provides functions to normalize and validate categories
 * according to the Category Format Specification.
 * 
 * Valid categories (14 total):
 * tech, pets, keys, wallet, docs, clothing, jewelry, vehicle, home, sports, toys, books, tools, food
 */

export const VALID_CATEGORIES = [
  'tech', 'pets', 'keys', 'wallet', 'docs', 'clothing', 
  'jewelry', 'vehicle', 'home', 'sports', 'toys', 'books', 'tools', 'food'
] as const;

export type Category = typeof VALID_CATEGORIES[number];

/**
 * Category mapping - maps common variations to standard categories
 */
const CATEGORY_MAP: Record<string, Category> = {
  // Tech variations
  'phone': 'tech',
  'smartphone': 'tech',
  'laptop': 'tech',
  'computer': 'tech',
  'tablet': 'tech',
  'electronics': 'tech',
  'electronic': 'tech',
  
  // Pets variations
  'dog': 'pets',
  'cat': 'pets',
  'pet': 'pets',
  'animal': 'pets',
  'animals': 'pets',
  
  // Keys variations
  'key': 'keys',
  'keychain': 'keys',
  
  // Wallet variations
  'purse': 'wallet',
  'bag': 'wallet',
  'backpack': 'wallet',
  'handbag': 'wallet',
  
  // Documents variations
  'document': 'docs',
  'passport': 'docs',
  'id card': 'docs',
  'idcard': 'docs',
  'certificate': 'docs',
  
  // Clothing variations
  'shirt': 'clothing',
  'shoes': 'clothing',
  'shoe': 'clothing',
  'glasses': 'clothing',
  'sunglasses': 'clothing',
  
  // Jewelry variations
  'ring': 'jewelry',
  'watch': 'jewelry',
  'necklace': 'jewelry',
  'earring': 'jewelry',
  'earrings': 'jewelry',
  'accessories': 'jewelry',
  'accessory': 'jewelry',
  
  // Vehicle variations
  'bicycle': 'vehicle',
  'bike': 'vehicle',
  'scooter': 'vehicle',
  'motorcycle': 'vehicle',
  'automotive': 'vehicle',
  'car parts': 'vehicle',
  'carparts': 'vehicle',
  
  // Home variations
  'furniture': 'home',
  'chair': 'home',
  'table': 'home',
  'appliance': 'home',
  'appliances': 'home',
  
  // Sports variations
  'sport': 'sports',
  'ball': 'sports',
  'racket': 'sports',
  'equipment': 'sports',
  
  // Toys variations
  'toy': 'toys',
  'doll': 'toys',
  'game': 'toys',
  
  // Books variations
  'book': 'books',
  'notebook': 'books',
  'journal': 'books',
  'magazine': 'books',
  
  // Tools variations
  'tool': 'tools',
  'hammer': 'tools',
  'saw': 'tools',
  
  // Food variations
  'drink': 'food',
  'beverage': 'food',
  'product': 'food',
  'products': 'food',
};

/**
 * Normalize category to match the 14 valid categories
 * Maps various category names to the standard format
 * 
 * @param category - The category string to normalize
 * @returns Normalized category (one of 14 valid categories) or 'tech' as default
 */
export function normalizeCategory(category: string | undefined | null): Category {
  if (!category) return 'tech'; // Default value
  
  // Normalize: lowercase and trim
  const normalized = category.toLowerCase().trim();
  
  // If already valid, return it
  if (VALID_CATEGORIES.includes(normalized as Category)) {
    return normalized as Category;
  }
  
  // Check if mapped category exists
  if (CATEGORY_MAP[normalized]) {
    return CATEGORY_MAP[normalized];
  }
  
  // If no match found, return default
  console.warn(`Unknown category "${category}", defaulting to "tech"`);
  return 'tech';
}

/**
 * Validate if a category is valid
 * 
 * @param category - The category string to validate
 * @returns true if category is valid, false otherwise
 */
export function isValidCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  const normalized = category.toLowerCase().trim();
  return VALID_CATEGORIES.includes(normalized as Category);
}
