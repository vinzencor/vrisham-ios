import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts, getAllCategories, mapProductForUI } from '../firebase/products';
import { Product as FirestoreProduct, Category as FirestoreCategory } from '../firebase/schema';

export function PopularStaples() {
  const navigate = useNavigate();
  const [staples, setStaples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real staples products
  useEffect(() => {
    const fetchStaplesProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching staples products for Popular Staples...');

        // Fetch all products and categories
        const [firestoreProducts, firestoreCategories] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ]);

        console.log('Total products fetched:', firestoreProducts.length);

        // Find staples category ID
        const staplesCategory = firestoreCategories.find(cat =>
          cat.name.toLowerCase().includes('staples') ||
          cat.name.toLowerCase().includes('grains') ||
          cat.name.toLowerCase().includes('pulses') ||
          cat.name.toLowerCase().includes('spices')
        );

        console.log('Staples category found:', staplesCategory);

        // Filter for staples products (already filtered for active products by getAllProducts)
        const staplesProducts = firestoreProducts.filter(product => {
          const isInStock = !product.isPreOrder; // Non pre-order items are in-stock

          // Check if product belongs to staples category
          const belongsToStaples = staplesCategory ?
            (product.categoryIDs && product.categoryIDs.includes(staplesCategory.categoryID)) ||
            product.categoryID === staplesCategory.categoryID
            : false;

          return isInStock && belongsToStaples;
        });

        console.log('Staples products found:', staplesProducts.length);

        // Map to UI format
        const mappedProducts = await Promise.all(
          staplesProducts.map(product => mapProductForUI(product, firestoreCategories))
        );

        // Take only first 6 products for display
        const limitedProducts = mappedProducts.slice(0, 6);

        console.log('Mapped staples products for UI:', limitedProducts.length);
        setStaples(limitedProducts);
      } catch (err) {
        console.error('Error fetching staples products:', err);
        setError('Failed to load staples');

        // Fallback to empty array instead of hardcoded data
        setStaples([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaplesProducts();
  }, []);

  // Don't render if no staples and not loading
  if (!loading && staples.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-3xl font-bold text-gray-800 mb-4">
            Popular Staples
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Certified organic staples, ready to ship immediately
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-gray-600">Loading staples...</span>
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

        {/* Products Grid */}
        {!loading && !error && staples.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {staples.map((staple, index) => (
                <motion.div
                  key={staple.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/product/${staple.id}`)}
                  className="cursor-pointer"
                >
                  <ProductCard {...staple} />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => navigate('/categories?category=staples')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors"
              >
                <Package className="w-5 h-5" />
                View All Staples
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}