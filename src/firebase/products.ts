import { where, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { queryDocuments, getAllDocuments, getDocument } from './firestore';
import { Product, Category, Farmer, ProductVariant, VariationType } from './schema';
import { db } from './config';

/**
 * Fetch all active products from Firestore (only show active products to customers)
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    return await queryDocuments<Product>(
      'Products',
      where('status', '==', 'active')
    );
  } catch (error) {
    console.error('Error fetching all products:', error);
    throw error;
  }
};

/**
 * Fetch active products by category ID (now supports multiple categories per product)
 */
export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    // Get all active products first, then filter by category
    const allActiveProducts = await getAllProducts();
    return allActiveProducts.filter(product =>
      product.categoryIDs?.includes(categoryId) || product.primaryCategoryID === categoryId
    );
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Fetch active products by primary category ID
 */
export const getProductsByPrimaryCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    // Get all active products first, then filter by primary category
    const allActiveProducts = await getAllProducts();
    return allActiveProducts.filter(product => product.primaryCategoryID === categoryId);
  } catch (error) {
    console.error(`Error fetching products for primary category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Fetch products by status (active/inactive)
 */
export const getProductsByStatus = async (status: 'active' | 'inActive'): Promise<Product[]> => {
  try {
    return await queryDocuments<Product>(
      'Products',
      where('status', '==', status)
    );
  } catch (error) {
    console.error(`Error fetching products with status ${status}:`, error);
    throw error;
  }
};

/**
 * Fetch a product by ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    return await getDocument<Product>('Products', productId);
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
    throw error;
  }
};

/**
 * Fetch all categories from Firestore
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    console.log('Attempting to fetch categories from Firestore...');
    const categories = await getAllDocuments<Category>('Categories');
    console.log('Successfully fetched categories from Firestore:', {
      count: categories.length,
      categories: categories.map(cat => ({ id: cat.id, name: cat.name, isParentCategory: cat.isParentCategory }))
    });
    return categories;
  } catch (error) {
    console.error('Error fetching all categories:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Build hierarchical category structure similar to admin app
 */
export const buildCategoryHierarchy = (categories: Category[]) => {
  const mainCategories: Category[] = [];
  const subcategories: Category[] = [];

  // Separate main categories from subcategories
  categories.forEach(category => {
    if (category.isParentCategory || category.level === 0) {
      mainCategories.push(category);
    } else {
      subcategories.push(category);
    }
  });

  // Create category mappings
  const categoryIdToName = new Map<string, string>();
  const subcategoryIdToParentId = new Map<string, string>();

  categories.forEach(category => {
    categoryIdToName.set(category.id, category.name);
    if (category.parentCategoryID) {
      subcategoryIdToParentId.set(category.id, category.parentCategoryID);
    }
  });

  console.log('Built category hierarchy:', {
    mainCategories: mainCategories.length,
    subcategories: subcategories.length,
    categoryIdToName: Object.fromEntries(categoryIdToName),
    subcategoryIdToParentId: Object.fromEntries(subcategoryIdToParentId)
  });

  return {
    mainCategories,
    subcategories,
    categoryIdToName,
    subcategoryIdToParentId
  };
};

/**
 * Fetch parent categories (top-level categories)
 */
export const getParentCategories = async (): Promise<Category[]> => {
  try {
    return await queryDocuments<Category>(
      'Categories',
      where('isParentCategory', '==', true)
    );
  } catch (error) {
    console.error('Error fetching parent categories:', error);
    throw error;
  }
};

/**
 * Fetch subcategories for a parent category
 */
export const getSubcategories = async (parentCategoryId: string): Promise<Category[]> => {
  try {
    return await queryDocuments<Category>(
      'Categories',
      where('parentCategoryID', '==', parentCategoryId)
    );
  } catch (error) {
    console.error(`Error fetching subcategories for ${parentCategoryId}:`, error);
    throw error;
  }
};

/**
 * Get products for a category, including all subcategories if it's a parent category
 */
export const getProductsForCategoryWithSubcategories = async (
  categoryId: string,
  categories: Category[]
): Promise<Product[]> => {
  try {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) {
      console.warn(`Category ${categoryId} not found`);
      return [];
    }

    // If it's a parent category, get products from all its subcategories too
    if (category.isParentCategory || category.level === 0) {
      const subcategories = categories.filter(cat => cat.parentCategoryID === categoryId);
      const allCategoryIds = [categoryId, ...subcategories.map(sub => sub.id)];

      console.log(`Fetching products for parent category ${categoryId} and subcategories:`, allCategoryIds);

      // Get products that belong to any of these categories
      const allProducts = await getAllProducts();
      return allProducts.filter(product =>
        product.categoryIDs?.some(catId => allCategoryIds.includes(catId)) ||
        allCategoryIds.includes(product.primaryCategoryID)
      );
    } else {
      // For subcategories, just get products directly assigned to this category
      console.log(`Fetching products for subcategory ${categoryId}`);
      return await getProductsByCategory(categoryId);
    }
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    throw error;
  }
};

/**
 * Fetch product variants for a specific product
 */
export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const variantsRef = collection(db, 'Products', productId, 'Variants');
    const querySnapshot = await getDocs(variantsRef);

    const variants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as ProductVariant);

    return variants;
  } catch (error) {
    console.error(`Error fetching variants for product ${productId}:`, error);
    return []; // Return empty array instead of throwing to prevent UI breaks
  }
};

/**
 * Fetch a specific product variant
 */
export const getProductVariant = async (productId: string, variantId: string): Promise<ProductVariant | null> => {
  try {
    const variantRef = doc(db, 'Products', productId, 'Variants', variantId);
    const variantSnap = await getDoc(variantRef);

    if (variantSnap.exists()) {
      const variant = { id: variantSnap.id, ...variantSnap.data() } as ProductVariant;
      return variant;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching variant ${variantId} for product ${productId}:`, error);
    return null;
  }
};

/**
 * Fetch all variation types
 */
export const getAllVariationTypes = async (): Promise<VariationType[]> => {
  try {
    return await getAllDocuments<VariationType>('VariationTypes');
  } catch (error) {
    console.error('Error fetching variation types:', error);
    throw error;
  }
};

/**
 * Fetch farmer information by farmer ID
 */
export const getFarmerById = async (farmerId: string): Promise<Farmer | null> => {
  try {
    console.log(`Fetching farmer with ID: ${farmerId}`);

    // First try to get the farmer directly by document ID
    try {
      const farmer = await getDocument<Farmer>('Farmers', farmerId);
      if (farmer) {
        console.log('Found farmer by document ID:', farmer);
        return farmer;
      }
    } catch (directFetchError) {
      console.log('Could not find farmer by document ID, trying farmerId field');
    }

    // If that fails, try querying by the farmerId field
    const farmers = await queryDocuments<Farmer>(
      'Farmers',
      where('farmerId', '==', farmerId)
    );

    if (farmers.length > 0) {
      console.log('Found farmer by farmerId field:', farmers[0]);
      return farmers[0];
    }

    console.log(`No farmer found with ID: ${farmerId}`);
    return null;
  } catch (error) {
    console.error(`Error fetching farmer ${farmerId}:`, error);
    throw error;
  }
};

/**
 * Get effective pricing and inventory data for a product
 * If product has variants, returns data from the specified variant or default variant
 * Otherwise returns product-level data
 */
export const getProductEffectiveData = async (
  product: Product,
  variantId?: string
): Promise<{
  price: number;
  mrp: number;
  stock: number;
  sku: string;
  variant?: ProductVariant;
}> => {
  // If product doesn't have variants, return product-level data
  if (!product.hasVariants) {
    return {
      price: product.price,
      mrp: product.mrp,
      stock: product.maxQuantity || 0,
      sku: product.barcode
    };
  }

  // Product has variants, fetch variant data
  try {
    const variants = await getProductVariants(product.id);

    if (variants.length === 0) {
      // No variants found, fallback to product data
      return {
        price: product.price,
        mrp: product.mrp,
        stock: product.maxQuantity || 0,
        sku: product.barcode
      };
    }

    // Find the specific variant or default variant
    let targetVariant = variants.find(v => v.id === variantId);
    if (!targetVariant) {
      targetVariant = variants.find(v => v.id === product.defaultVariantID) || variants[0];
    }

    return {
      price: targetVariant.price,
      mrp: targetVariant.mrp,
      stock: targetVariant.stock,
      sku: targetVariant.sku,
      variant: targetVariant
    };
  } catch (error) {
    console.error('Error fetching variant data:', error);
    // Fallback to product data
    return {
      price: product.price,
      mrp: product.mrp,
      stock: product.maxQuantity || 0,
      sku: product.barcode
    };
  }
};

/**
 * Map a Firestore product to a UI-friendly format
 */
export const mapProductForUI = async (product: Product, categories: Category[]): Promise<any> => {
  // Determine product type based on pre-order settings and status
  const type = getProductType(product);

  // Build category hierarchy for better mapping
  const { categoryIdToName, subcategoryIdToParentId } = buildCategoryHierarchy(categories);

  // Handle legacy category fields - check for old category system
  const legacyProduct = product as any;
  let legacyCategoryId = null;

  // Debug: Check if product has category information
  if (!product.categoryIDs && !product.primaryCategoryID && !legacyProduct.categoryID) {
    console.warn(`Product ${product.name} has no category information:`, {
      categoryIDs: product.categoryIDs,
      primaryCategoryID: product.primaryCategoryID,
      categoryID: legacyProduct.categoryID
    });
  }

  // Check for legacy category fields (prioritize categoryID which is the main legacy field)
  if (legacyProduct.categoryID) {
    legacyCategoryId = legacyProduct.categoryID;
  } else if (legacyProduct.categoryId) {
    legacyCategoryId = legacyProduct.categoryId;
  }

  // Get primary category info (new system)
  let primaryCategory = categories.find(cat => cat.id === product.primaryCategoryID);

  // Fallback to legacy category if new system not available
  if (!primaryCategory && legacyCategoryId) {
    primaryCategory = categories.find(cat => cat.id === legacyCategoryId);
  }

  // Get all categories this product belongs to (new system)
  let productCategories = categories.filter(cat =>
    product.categoryIDs?.includes(cat.id)
  );

  // Fallback to legacy category if new system not available
  if (productCategories.length === 0 && legacyCategoryId) {
    const legacyCategory = categories.find(cat => cat.id === legacyCategoryId);
    if (legacyCategory) {
      productCategories = [legacyCategory];
    }
  }

  // Determine the best category to display (prefer subcategory over parent)
  let displayCategory = null;
  let displayCategoryId = null;

  // Strategy 1: Use primary category if available
  if (primaryCategory) {
    displayCategory = primaryCategory.name;
    displayCategoryId = primaryCategory.id;
  }
  // Strategy 2: Use first category from categoryIDs or legacy category
  else if (productCategories.length > 0) {
    // Prefer subcategories (non-parent categories) over parent categories
    const subcategory = productCategories.find(cat => !cat.isParentCategory);
    if (subcategory) {
      displayCategory = subcategory.name;
      displayCategoryId = subcategory.id;
    } else {
      // Use first available category
      displayCategory = productCategories[0].name;
      displayCategoryId = productCategories[0].id;
    }
  }
  // Strategy 3: Fallback to categoryIdToName mapping
  else if (product.categoryIDs && product.categoryIDs.length > 0) {
    const firstCategoryId = product.categoryIDs[0];
    const categoryName = categoryIdToName.get(firstCategoryId);
    if (categoryName) {
      displayCategory = categoryName;
      displayCategoryId = firstCategoryId;
    }
  }
  // Strategy 4: Legacy category fallback
  else if (legacyCategoryId) {
    const categoryName = categoryIdToName.get(legacyCategoryId);
    if (categoryName) {
      displayCategory = categoryName;
      displayCategoryId = legacyCategoryId;
    }
  }
  // Strategy 5: Final fallback
  if (!displayCategory) {
    displayCategory = 'Other';
    displayCategoryId = 'other';
  }

  // Log successful category mapping
  if (displayCategory !== 'Other') {
    console.log(`✓ Mapped ${product.name} to category: ${displayCategory} (${displayCategoryId})`);
  } else {
    console.warn(`⚠ Product ${product.name} mapped to 'Other' category - no valid category found`);
  }

  // Get farmer info if available
  let farmer = undefined;
  if (product.farmerId) {
    try {
      const farmerDoc = await getFarmerById(product.farmerId);

      if (farmerDoc) {
        farmer = {
          id: farmerDoc.id,
          name: farmerDoc.farmerName,
          farmName: farmerDoc.farmName,
          location: farmerDoc.farmLocation,
          experience: farmerDoc.experience,
          philosophy: farmerDoc.philosophy,
          certifications: farmerDoc.certifications,
          tags: farmerDoc.tags
        };
      }
    } catch (err) {
      console.error('Error fetching farmer:', err);
    }
  }

  // Get variants if product has variants
  let variants = [];
  let defaultVariant = null;
  let displayPrice = product.price;
  let displayMrp = product.mrp;
  let displayStock = product.maxQuantity || 10;
  let displaySku = product.barcode;

  if (product.hasVariants) {
    try {
      variants = await getProductVariants(product.id);

      // If variants exist, use variant data for display
      if (variants.length > 0) {
        // Find the default variant or use the first one
        defaultVariant = variants.find(v => v.id === product.defaultVariantID) || variants[0];

        if (defaultVariant) {
          displayPrice = defaultVariant.price;
          displayMrp = defaultVariant.mrp;
          displayStock = defaultVariant.stock;
          displaySku = defaultVariant.sku;
        }
      }
    } catch (err) {
      console.error('Error fetching product variants:', err);
    }
  }

  // Find parent category for subcategory
  const parentCategory = primaryCategory?.parentCategoryID
    ? categories.find(cat => cat.id === primaryCategory.parentCategoryID)
    : undefined;

  // Convert variants to sizeOptions for backward compatibility
  let sizeOptions = undefined;
  if (variants.length > 0) {
    sizeOptions = variants.map(variant => {
      // Create a proper label from all variation values
      let label = '';
      if (variant.variationValues && Object.keys(variant.variationValues).length > 0) {
        // Join all variation values with proper formatting
        const variationPairs = Object.entries(variant.variationValues)
          .map(([key, value]) => `${value}`) // Just use the value, not "key: value"
          .filter(value => value && value.trim() !== ''); // Filter out empty values

        label = variationPairs.join(' ');
      }

      // Fallback to variant ID if no variation values found
      if (!label || label.trim() === '') {
        label = `Variant ${variant.id}`;
      }

      return {
        id: variant.id || '',
        label: label,
        weightRange: variant.variationValues?.Weight || variant.variationValues?.weight || '',
        price: variant.price,
        mrp: variant.mrp, // Add MRP information
        stock: variant.stock || 0 // Add stock information
      };
    });
  }

  // Get harvest and pre-order information
  const harvestInfo = getHarvestInfo(product);
  const preOrderWindow = getPreOrderWindow(product);
  const deliveryInfo = getDeliveryInfo(product);

  // Create UI product
  return {
    ...product,
    category: displayCategory?.toLowerCase() || 'other',
    categoryID: displayCategoryId, // For filtering
    subcategory: primaryCategory?.parentCategoryID ? primaryCategory.id : undefined,
    categories: productCategories, // All categories this product belongs to
    categoryIDs: product.categoryIDs, // Keep original categoryIDs for filtering
    primaryCategoryID: product.primaryCategoryID, // Keep original primaryCategoryID
    type,
    // Use variant data if product has variants, otherwise use product data
    price: displayPrice,
    mrp: displayMrp,
    quantity: displayStock,
    barcode: displaySku,
    farmer,
    variants, // New variant structure
    hasVariants: product.hasVariants || false,
    defaultVariantID: product.defaultVariantID,
    defaultVariant,
    sizeOptions, // Backward compatibility with existing components
    orderProgress: Math.floor(Math.random() * 100), // Mock data for progress
    nameTamil: '', // Add Tamil name if available
    // New harvest and pre-order fields
    isPreOrder: product.isPreOrder || false,
    preOrderStartAt: product.preOrderStartAt,
    preOrderEndAt: product.preOrderEndAt,
    harvestOffsetDays: product.harvestOffsetDays || 0,
    harvestInfo,
    preOrderWindow,
    deliveryInfo,
    harvestDate: harvestInfo.date,
    harvestLabel: harvestInfo.label,
    harvestDayLabel: harvestInfo.dayLabel,
    deliveryDate: deliveryInfo.date,
    deliveryLabel: deliveryInfo.label,
    deliveryDaysFromNow: deliveryInfo.daysFromNow,
    isPreOrderAvailable: preOrderWindow.isActive,
    // New quantity control fields
    incrementalQuantity: product.incrementalQuantity || 1,
    minQuantity: product.minQuantity || 1,
    maxQuantity: product.maxQuantity || 100
  };
};

/**
 * Test function to check if variants are being fetched correctly
 */
export const testVariantFetching = async (productId: string) => {
  console.log(`=== Testing variant fetching for product: ${productId} ===`);

  try {
    // First get the product
    const product = await getProductById(productId);
    if (!product) {
      console.log('Product not found');
      return;
    }

    console.log('Product data:', {
      id: product.id,
      name: product.name,
      hasVariants: product.hasVariants,
      defaultVariantID: product.defaultVariantID
    });

    // If product has variants, fetch them
    if (product.hasVariants) {
      const variants = await getProductVariants(productId);
      console.log(`Found ${variants.length} variants:`, variants);

      // Test getting effective data
      const effectiveData = await getProductEffectiveData(product);
      console.log('Effective data:', effectiveData);
    } else {
      console.log('Product does not have variants');
    }

  } catch (error) {
    console.error('Error in test:', error);
  }

  console.log('=== End test ===');
};

/**
 * Calculate harvest date based on harvestOffsetDays
 */
export const calculateHarvestDate = (harvestOffsetDays: number, baseDate?: Date): Date => {
  const base = baseDate || new Date();
  const harvestDate = new Date(base);
  harvestDate.setDate(harvestDate.getDate() + harvestOffsetDays);
  return harvestDate;
};

/**
 * Get harvest day label based on offset
 */
export const getHarvestDayLabel = (harvestOffsetDays: number): string => {
  switch (harvestOffsetDays) {
    case -1:
      return 'Yesterday';
    case 0:
      return 'Today';
    case 1:
      return 'Tomorrow';
    default:
      return `${harvestOffsetDays > 0 ? '+' : ''}${harvestOffsetDays} days`;
  }
};

/**
 * Check if product is currently available for pre-order
 */
export const isPreOrderAvailable = (product: Product): boolean => {
  if (!product.isPreOrder) {
    return false;
  }

  const now = new Date();

  // If no time window is set, pre-order is always available
  if (!product.preOrderStartAt && !product.preOrderEndAt) {
    return true;
  }

  // Check if current time is within the pre-order window
  const startTime = product.preOrderStartAt?.toDate?.() || new Date(0);
  const endTime = product.preOrderEndAt?.toDate?.() || new Date('2099-12-31');

  return now >= startTime && now <= endTime;
};

/**
 * Get product type based on pre-order and availability
 */
export const getProductType = (product: Product): 'pre-order' | 'in-stock' => {
  // Only return 'pre-order' if isPreOrder is explicitly true AND pre-order is available
  if (product.isPreOrder && isPreOrderAvailable(product)) {
    console.log(`Product ${product.name} is pre-order:`, {
      isPreOrder: product.isPreOrder,
      isPreOrderAvailable: isPreOrderAvailable(product),
      preOrderStartAt: product.preOrderStartAt,
      preOrderEndAt: product.preOrderEndAt
    });
    return 'pre-order';
  }

  // All other products are 'in-stock' (regardless of status)
  console.log(`Product ${product.name} is in-stock:`, {
    isPreOrder: product.isPreOrder || false,
    status: product.status
  });
  return 'in-stock';
};

/**
 * Calculate delivery date based on product settings and day of week
 * Logic:
 * - Sunday orders: Delivery by Tuesday (2 days later)
 * - Monday-Saturday orders: Delivery by Tomorrow (1 day later)
 * - For pre-order products: preOrderEndAt becomes delivery day
 */
export const calculateDeliveryDate = (product: Product, orderDate?: Date): Date => {
  const today = orderDate || new Date();

  // For pre-order products with end date, delivery is on preOrderEndAt
  if (product.isPreOrder && isPreOrderAvailable(product) && product.preOrderEndAt) {
    return product.preOrderEndAt.toDate();
  }

  // For regular products, calculate based on day of week
  const deliveryDate = new Date(today);
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  let daysToAdd = 1; // Default: next day delivery (Monday-Saturday)

  // If order is placed on Sunday, deliver on Tuesday
  if (dayOfWeek === 0) {
    daysToAdd = 2;
  }

  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  return deliveryDate;
};

/**
 * Get delivery information for display
 */
export const getDeliveryInfo = (product: Product, orderDate?: Date): {
  date: Date;
  label: string;
  daysFromNow: number;
} => {
  const today = orderDate || new Date();
  const deliveryDate = calculateDeliveryDate(product, today);
  const daysFromNow = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let label = '';
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // For pre-order products, use generic messaging
  if (product.isPreOrder && isPreOrderAvailable(product) && product.preOrderEndAt) {
    if (daysFromNow === 1) {
      label = 'Delivered Tomorrow';
    } else if (daysFromNow === 2) {
      label = 'Delivered in 2 Days';
    } else {
      label = `Delivered in ${daysFromNow} Days`;
    }
  } else {
    // For regular products, use day-specific messaging
    if (dayOfWeek === 0) { // Sunday
      label = 'Delivery by Tuesday';
    } else { // Monday-Saturday
      label = 'Delivery by Tomorrow';
    }
  }

  return {
    date: deliveryDate,
    label,
    daysFromNow
  };
};

/**
 * Get delivery information for any item type (for cart, orders, etc.)
 * This is a centralized function to ensure consistency across the app
 */
export const getDeliveryInfoForItem = (
  itemType?: 'pre-order' | 'in-stock' | string,
  orderDate?: Date
): {
  date: Date;
  label: string;
  daysFromNow: number;
} => {
  const today = orderDate || new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const deliveryDate = new Date(today);
  let daysToAdd = 1; // Default: next day delivery
  let label = '';

  if (itemType === 'pre-order') {
    // Pre-order items typically take longer
    daysToAdd = 3;
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[targetDate.getDay()];
    label = `Delivered by ${dayName}`;
  } else {
    // Regular items follow the standard logic
    if (dayOfWeek === 0) { // Sunday
      daysToAdd = 2;
      label = 'Delivery by Tuesday';
    } else { // Monday-Saturday
      daysToAdd = 1;
      label = 'Delivery by Tomorrow';
    }
  }

  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
  const daysFromNow = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    date: deliveryDate,
    label,
    daysFromNow
  };
};

/**
 * Get harvest information for display
 * For pre-order products: harvest is day before preOrderEndAt
 * For regular products: use harvestOffsetDays
 */
export const getHarvestInfo = (product: Product): {
  date: Date;
  label: string;
  dayLabel: string;
} => {
  let harvestDate: Date;
  let dayLabel: string;

  // For pre-order products with end date, harvest is day before preOrderEndAt
  if (product.isPreOrder && isPreOrderAvailable(product) && product.preOrderEndAt) {
    harvestDate = new Date(product.preOrderEndAt.toDate());
    harvestDate.setDate(harvestDate.getDate() - 1); // Day before pre-order ends

    const today = new Date();
    const diffDays = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      dayLabel = 'Today';
    } else if (diffDays === 1) {
      dayLabel = 'Tomorrow';
    } else if (diffDays === -1) {
      dayLabel = 'Yesterday';
    } else {
      dayLabel = `in ${diffDays} days`;
    }
  } else {
    // For regular products, use harvestOffsetDays
    harvestDate = calculateHarvestDate(product.harvestOffsetDays || 0);
    dayLabel = getHarvestDayLabel(product.harvestOffsetDays || 0);
  }

  return {
    date: harvestDate,
    label: `Harvest ${dayLabel}`,
    dayLabel
  };
};

/**
 * Get pre-order window information
 */
export const getPreOrderWindow = (product: Product): {
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  status: 'not-started' | 'active' | 'ended' | 'always-available';
} => {
  if (!product.isPreOrder) {
    return { isActive: false, status: 'always-available' };
  }

  const now = new Date();
  const startDate = product.preOrderStartAt?.toDate?.();
  const endDate = product.preOrderEndAt?.toDate?.();

  // No time window set - always available
  if (!startDate && !endDate) {
    return { isActive: true, status: 'always-available' };
  }

  // Check current status
  if (startDate && now < startDate) {
    return { isActive: false, startDate, endDate, status: 'not-started' };
  }

  if (endDate && now > endDate) {
    return { isActive: false, startDate, endDate, status: 'ended' };
  }

  return { isActive: true, startDate, endDate, status: 'active' };
};

/**
 * Test Firebase connection and category fetching
 */
export const testFirebaseConnection = async () => {
  console.log('=== Testing Firebase Connection ===');

  try {
    // Test basic connection
    console.log('Testing basic Firestore connection...');
    const testCollection = collection(db, 'Categories');
    console.log('Collection reference created successfully');

    // Test fetching categories
    console.log('Testing category fetching...');
    const categories = await getAllCategories();
    console.log('Categories fetched successfully:', categories.length);

    // Test fetching products
    console.log('Testing product fetching...');
    const products = await getAllProducts();
    console.log('Products fetched successfully:', products.length);

    console.log('=== All tests passed ===');
    return { success: true, categories: categories.length, products: products.length };
  } catch (error) {
    console.error('=== Firebase connection test failed ===');
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};
