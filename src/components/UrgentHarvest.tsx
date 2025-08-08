import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CompactProductCard } from './CompactProductCard';
import { getAllProducts, getAllCategories, mapProductForUI } from '../firebase/products';
import { Product as FirestoreProduct, Category as FirestoreCategory } from '../firebase/schema';
import { addDocument } from '../firebase/firestore';



interface HarvestItem {
  id: string;
  name: string;
  nameTamil: string;
  quantity: number;
  unit: string;
  image: string;
  price: number;
  type: 'pre-order';
  farmer: {
    name: string;
    experience: string;
  };
  orderProgress: number;
}

// Helper function to create multiple test pre-order products
const createTestPreOrderProducts = async () => {
  try {
    console.log('Creating test pre-order products...');

    const testProducts = [
      {
        barcode: 'TEST-PREORDER-001',
        branchCode: 'MAIN',
        categoryIDs: ['vegetables'],
        primaryCategoryID: 'vegetables',
        description: 'Fresh organic tomatoes harvested specially for you. Perfect for salads, cooking, and daily use.',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
        incrementalQuantity: 1,
        index: 0,
        keyword: ['tomato', 'vegetable', 'organic', 'fresh'],
        maxQuantity: 100,
        minQuantity: 1,
        mrp: 80,
        name: 'Fresh Organic Tomatoes',
        nutrition: 'Rich in Vitamin C, Lycopene, and antioxidants',
        price: 60,
        sourcingStory: 'Grown by local farmers using traditional organic methods',
        status: 'active',
        unit: 'kg',
        farmerId: null,
        hasVariants: false,
        defaultVariantID: null,
        isPreOrder: true,
        preOrderStartAt: null,
        preOrderEndAt: null,
        harvestOffsetDays: 0
      },
      {
        barcode: 'TEST-PREORDER-002',
        branchCode: 'MAIN',
        categoryIDs: ['vegetables'],
        primaryCategoryID: 'vegetables',
        description: 'Fresh organic spinach leaves, perfect for healthy meals and smoothies.',
        image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
        incrementalQuantity: 1,
        index: 1,
        keyword: ['spinach', 'leafy', 'vegetable', 'organic', 'fresh'],
        maxQuantity: 50,
        minQuantity: 1,
        mrp: 50,
        name: 'Fresh Organic Spinach',
        nutrition: 'Rich in Iron, Vitamin K, and Folate',
        price: 40,
        sourcingStory: 'Grown by certified organic farmers',
        status: 'active',
        unit: 'kg',
        farmerId: null,
        hasVariants: false,
        defaultVariantID: null,
        isPreOrder: true,
        preOrderStartAt: null,
        preOrderEndAt: null,
        harvestOffsetDays: 1
      },
      {
        barcode: 'TEST-PREORDER-003',
        branchCode: 'MAIN',
        categoryIDs: ['vegetables'],
        primaryCategoryID: 'vegetables',
        description: 'Fresh organic carrots, sweet and crunchy. Perfect for cooking and snacking.',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800',
        incrementalQuantity: 1,
        index: 2,
        keyword: ['carrot', 'vegetable', 'organic', 'fresh', 'root'],
        maxQuantity: 75,
        minQuantity: 1,
        mrp: 60,
        name: 'Fresh Organic Carrots',
        nutrition: 'Rich in Beta-carotene and Vitamin A',
        price: 50,
        sourcingStory: 'Grown in nutrient-rich soil by local farmers',
        status: 'active',
        unit: 'kg',
        farmerId: null,
        hasVariants: false,
        defaultVariantID: null,
        isPreOrder: true,
        preOrderStartAt: null,
        preOrderEndAt: null,
        harvestOffsetDays: 0
      }
    ];

    const createdIds = [];
    for (const product of testProducts) {
      try {
        const docId = await addDocument('Products', product);
        console.log(`Test pre-order product created: ${product.name} with ID: ${docId}`);
        createdIds.push(docId);
      } catch (error) {
        console.error(`Error creating product ${product.name}:`, error);
      }
    }

    console.log(`Created ${createdIds.length} test pre-order products`);
    return createdIds;
  } catch (error) {
    console.error('Error creating test pre-order products:', error);
    return [];
  }
};

export function UrgentHarvest() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real pre-order products
  useEffect(() => {
    const fetchPreOrderProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching pre-order products for Urgent Harvest...');

        // Fetch all products and categories
        const [firestoreProducts, firestoreCategories] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ]);

        console.log('Total products fetched:', firestoreProducts.length);

        // Log ALL products to see their structure and identify pre-order products
        console.log('=== ALL PRODUCTS ANALYSIS ===');
        firestoreProducts.forEach((product, index) => {
          console.log(`Product ${index + 1}: ${product.name}`, {
            id: product.id,
            status: product.status,
            isPreOrder: product.isPreOrder,
            hasIsPreOrderField: 'isPreOrder' in product,
            allFields: Object.keys(product)
          });
        });

        // Check for products that might have isPreOrder field with different values
        const productsWithPreOrderField = firestoreProducts.filter(p => 'isPreOrder' in p);
        console.log('Products with isPreOrder field:', productsWithPreOrderField.length);

        const preOrderTrue = firestoreProducts.filter(p => p.isPreOrder === true);
        const preOrderFalse = firestoreProducts.filter(p => p.isPreOrder === false);
        const preOrderUndefined = firestoreProducts.filter(p => p.isPreOrder === undefined);

        console.log('Pre-order analysis:', {
          'isPreOrder === true': preOrderTrue.length,
          'isPreOrder === false': preOrderFalse.length,
          'isPreOrder === undefined': preOrderUndefined.length
        });

        // Try different filtering approaches to find pre-order products
        console.log('=== TRYING DIFFERENT FILTERING APPROACHES ===');

        // Approach 1: Strict filtering (isPreOrder === true AND status === 'active')
        const strictPreOrderProducts = firestoreProducts.filter(product => {
          return product.isPreOrder === true && product.status === 'active';
        });
        console.log('Approach 1 - Strict filtering:', strictPreOrderProducts.length);

        // Approach 2: Relaxed status filtering (isPreOrder === true, any status)
        const relaxedStatusProducts = firestoreProducts.filter(product => {
          return product.isPreOrder === true;
        });
        console.log('Approach 2 - Relaxed status:', relaxedStatusProducts.length);

        // Approach 3: Check for string values of isPreOrder
        const stringPreOrderProducts = firestoreProducts.filter(product => {
          return product.isPreOrder === 'true' || product.isPreOrder === true;
        });
        console.log('Approach 3 - String or boolean true:', stringPreOrderProducts.length);

        // Approach 4: Check for any truthy isPreOrder value
        const truthyPreOrderProducts = firestoreProducts.filter(product => {
          return !!product.isPreOrder;
        });
        console.log('Approach 4 - Any truthy isPreOrder:', truthyPreOrderProducts.length);

        // Log details of products that have any form of pre-order indication
        console.log('=== PRODUCTS WITH PRE-ORDER INDICATIONS ===');
        firestoreProducts.forEach(product => {
          if (product.isPreOrder || product.isPreOrder === 'true' || product.isPreOrder === true) {
            console.log(`Pre-order candidate: ${product.name}`, {
              id: product.id,
              status: product.status,
              isPreOrder: product.isPreOrder,
              isPreOrderType: typeof product.isPreOrder,
              isPreOrderValue: JSON.stringify(product.isPreOrder)
            });
          }
        });

        // Use the approach that finds the most products
        let preOrderProducts = strictPreOrderProducts;
        if (relaxedStatusProducts.length > strictPreOrderProducts.length) {
          console.log('Using relaxed status filtering as it found more products');
          preOrderProducts = relaxedStatusProducts;
        }
        if (stringPreOrderProducts.length > preOrderProducts.length) {
          console.log('Using string/boolean filtering as it found more products');
          preOrderProducts = stringPreOrderProducts;
        }
        if (truthyPreOrderProducts.length > preOrderProducts.length) {
          console.log('Using truthy filtering as it found more products');
          preOrderProducts = truthyPreOrderProducts;
        }

        console.log('=== FINAL PRE-ORDER PRODUCTS ===');
        console.log('Pre-order products found:', preOrderProducts.length);
        preOrderProducts.forEach((product, index) => {
          console.log(`Pre-order ${index + 1}: ${product.name} (ID: ${product.id})`);
        });

        // If no pre-order products found, let's try to show any active products for testing
        if (preOrderProducts.length === 0) {
          console.log('No pre-order products found, checking all active products...');
          const activeProducts = firestoreProducts.filter(product => product.status === 'active');
          console.log('Active products found:', activeProducts.length);

          // Option 1: Create test pre-order products (disabled since you have existing pre-order products)
          // console.log('Creating test pre-order products for demonstration...');
          // await createTestPreOrderProducts();

          // Option 2: Show first 6 active products as fallback
          if (activeProducts.length > 0) {
            console.log('Using active products as fallback for UrgentHarvest');
            const mappedProducts = await Promise.all(
              activeProducts.slice(0, 6).map(product => mapProductForUI(product, firestoreCategories))
            );
            setItems(mappedProducts);
            return;
          }
        }

        // Map to UI format
        const mappedProducts = await Promise.all(
          preOrderProducts.map(product => mapProductForUI(product, firestoreCategories))
        );

        // Take only first 6 products for the carousel
        const limitedProducts = mappedProducts.slice(0, 6);

        console.log('Mapped pre-order products for UI:', limitedProducts.length);
        setItems(limitedProducts);
      } catch (err) {
        console.error('Error fetching pre-order products:', err);
        setError('Failed to load harvest items');

        // Fallback to empty array instead of hardcoded data
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPreOrderProducts();
  }, []);



  // Don't render if no items and not loading
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pt-12 pb-8 bg-white urgent-harvest-container">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-800 mb-2">
              Urgent Harvest
            </h2>
            <p className="text-secondary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pre-order while slots last!
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-gray-600">Loading harvest items...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid - Larger cards for Urgent Harvest */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
            {items.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <CompactProductCard {...item} isUrgentHarvest={true} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}