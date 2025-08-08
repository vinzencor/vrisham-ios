import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from './ProductCard';
import {
  Leaf,
  Clock,
  Carrot,
  Apple,
  Coffee,
  Package,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Search,
  X
} from 'lucide-react';
import {
  getAllProducts,
  getAllCategories,
  getParentCategories,
  getSubcategories,
  mapProductForUI,
  buildCategoryHierarchy,
  getProductsForCategoryWithSubcategories,
  testFirebaseConnection
} from '../firebase/products';
import { Product as FirestoreProduct, Category as FirestoreCategory } from '../firebase/schema';

// Interface for the UI product that combines Firestore data with UI-specific fields
interface Product {
  id: string;
  name: string;
  nameTamil?: string;
  category: string;
  subcategory?: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
  type: 'pre-order' | 'in-stock';
  harvestDate?: string;
  farmer?: {
    name: string;
    experience: string;
  };
  orderProgress?: number;
  sizeOptions?: Array<{
    id: string;
    label: string;
    weightRange: string;
    price: number;
  }>;
  // Firestore specific fields
  barcode?: string;
  branchCode?: string;
  categoryID?: string;
  description?: string;
  incrementalQuantity?: number;
  index?: number;
  keyword?: string[];
  maxQuantity?: number;
  minQuantity?: number;
  mrp?: number;
  nutrition?: string;
  sourcingStory?: string;
  status?: 'active' | 'inActive';
  farmerId?: string;
}

// Default UI categories
// const defaultCategories = [
//   {
//     id: 'all',
//     label: 'All Products',
//     icon: Package,
//     color: 'bg-white border border-primary/20 shadow-sm hover:shadow-primary/10',
//     iconColor: 'text-gray-600',
//     description: 'Browse our complete collection'
//   },
//   {
//     id: 'vegetables',
//     label: 'Vegetables',
//     icon: Carrot,
//     color: 'bg-green-50',
//     iconColor: 'text-green-600',
//     description: 'Farm-fresh organic vegetables'
//   },
//   {
//     id: 'fruits',
//     label: 'Fruits',
//     icon: Apple,
//     color: 'bg-orange-50',
//     iconColor: 'text-orange-600',
//     description: 'Sweet and juicy seasonal fruits'
//   },
//   {
//     id: 'staples',
//     label: 'Staples',
//     icon: Coffee,
//     color: 'bg-amber-50',
//     iconColor: 'text-amber-600',
//     description: 'Essential groceries and spices'
//   }
// ];

// Default subcategories for staples
const defaultStapleSubcategories = [
  { id: 'pulses', label: 'Pulses & Lentils' },
  { id: 'spices', label: 'Spices & Masalas' },
  { id: 'oils', label: 'Oils & Ghee' },
  { id: 'flours', label: 'Flours & Grains' },
  { id: 'dry-fruits', label: 'Dry Fruits & Nuts' }
];

export function Categories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allFirestoreCategories, setAllFirestoreCategories] = useState<FirestoreCategory[]>([]); // Store all categories for filtering
  const [stapleSubcategories, setStapleSubcategories] = useState<Array<{id: string, label: string}>>([]);
  const [currentSubcategories, setCurrentSubcategories] = useState<Array<{id: string, label: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map homepage category IDs to database category names
  const homepageCategoryMappings = {
    'vegetables': 'Vegetable',
    'fruits': 'Fresh Fruits',
    'staples': 'Organic Staples'
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(12);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);



  // Fetch categories and products from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch categories and products...');

        // Test Firebase connection first
        const testResult = await testFirebaseConnection();
        console.log('Firebase connection test result:', testResult);

        if (!testResult.success) {
          setError(`Firebase connection failed: ${testResult.error}`);
          setLoading(false);
          return;
        }

        // Fetch all categories first
        const firestoreCategories = await getAllCategories();
        console.log('Fetched categories:', firestoreCategories);

        if (firestoreCategories.length === 0) {
          console.warn('No categories found in Firestore!');
          setError('No categories found. Please check your database.');
          setLoading(false);
          return;
        }

        // Store all categories for filtering logic
        setAllFirestoreCategories(firestoreCategories);

        // Build category hierarchy
        const { mainCategories, subcategories } = buildCategoryHierarchy(firestoreCategories);
        console.log('Built hierarchy:', {
          mainCategories: mainCategories.length,
          subcategories: subcategories.length,
          mainCategoryNames: mainCategories.map(cat => cat.name),
          subcategoryNames: subcategories.map(cat => `${cat.name} (parent: ${cat.parentCategoryID})`)
        });

        // Map ONLY main/parent categories to UI categories (not subcategories)
        const categoryMap = new Map();

        // Add "All" category first
        categoryMap.set('all', {
          id: 'all',
          label: 'All Products',
          icon: Package,
          color: 'bg-white border border-primary/20 shadow-sm hover:shadow-primary/10',
          iconColor: 'text-gray-600',
          description: 'All Products'
        });

        // Only add main/parent categories to the UI
        mainCategories.forEach(cat => {
          // Determine icon based on category name
          let icon = Package;
          let color = 'bg-white border border-primary/20 shadow-sm hover:shadow-primary/10';
          let iconColor = 'text-gray-600';

          if (cat.name.toLowerCase().includes('vegetable')) {
            icon = Carrot;
            color = 'bg-green-50';
            iconColor = 'text-green-600';
          } else if (cat.name.toLowerCase().includes('fruit')) {
            icon = Apple;
            color = 'bg-orange-50';
            iconColor = 'text-orange-600';
          } else if (cat.name.toLowerCase().includes('staple') ||
                    cat.name.toLowerCase().includes('grocery')) {
            icon = Coffee;
            color = 'bg-amber-50';
            iconColor = 'text-amber-600';
          }

          categoryMap.set(cat.id, {
            id: cat.id,
            label: cat.name,
            icon,
            color,
            iconColor,
            description: cat.name,
            isParentCategory: true, // Mark as parent category
            subcategories: subcategories.filter(sub => sub.parentCategoryID === cat.id) // Store subcategories
          });
        });

        // Update categories state with only main categories
        setCategories([...categoryMap.values()]);
        console.log('Set main categories only:', [...categoryMap.values()].map(cat => cat.label));

        // Fetch subcategories for staples
        const staplesCategory = mainCategories.find(cat =>
          cat.name.toLowerCase().includes('staple')
        );

        if (staplesCategory) {
          const stapleSubcats = subcategories.filter(sub => sub.parentCategoryID === staplesCategory.id);
          console.log('Found staple subcategories:', stapleSubcats);

          if (stapleSubcats.length > 0) {
            setStapleSubcategories([
              { id: 'all', label: 'All Staples' },
              ...stapleSubcats.map(subcat => ({
                id: subcat.id,
                label: subcat.name
              }))
            ]);
          }
        }

        // Fetch all products
        console.log('Fetching products...');
        const firestoreProducts = await getAllProducts();
        console.log('Fetched products:', firestoreProducts.length);

        if (firestoreProducts.length === 0) {
          console.warn('No products found in Firestore!');
          setAllProducts([]);
          setLoading(false);
          return;
        }

        // Map Firestore products to UI products
        console.log('Mapping products to UI format...');
        const mappedProducts = await Promise.all(
          firestoreProducts.map(product => mapProductForUI(product, firestoreCategories))
        );

        console.log('Mapped products:', mappedProducts.length);
        setAllProducts(mappedProducts as Product[]);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load products. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize search query from URL params
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  // Handle categoryFilter parameter from homepage navigation
  useEffect(() => {
    const categoryFilterParam = searchParams.get('categoryFilter');
    if (categoryFilterParam && allFirestoreCategories.length > 0) {
      console.log('Processing categoryFilter from homepage:', categoryFilterParam);

      // Map homepage category ID to database category name
      const targetCategoryName = homepageCategoryMappings[categoryFilterParam];
      if (targetCategoryName) {
        console.log('Looking for database category:', targetCategoryName);

        // Find the matching category in the database
        const matchingCategory = allFirestoreCategories.find(cat =>
          cat.name.toLowerCase().includes(targetCategoryName.toLowerCase()) ||
          targetCategoryName.toLowerCase().includes(cat.name.toLowerCase())
        );

        if (matchingCategory) {
          console.log('Found matching category:', matchingCategory);
          setActiveCategory(matchingCategory.id);
          setActiveSubcategory('all');
          setCurrentPage(1);
          updateSubcategories(matchingCategory.id);

          // Update URL to use the actual category ID instead of the filter
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('categoryFilter');
            newParams.set('category', matchingCategory.id);
            return newParams;
          });
        } else {
          console.warn('No matching category found for:', targetCategoryName);
        }
      }
    }
  }, [searchParams, allFirestoreCategories, homepageCategoryMappings]);

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery && searchQuery.trim()) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('search', searchQuery.trim());
        newParams.delete('page'); // Reset to page 1
        return newParams;
      });
    } else {
      // If search is empty, remove search param
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('search');
        return newParams;
      });
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('search');
      return newParams;
    });
  };

  // Filter products based on search params and active category/subcategory
  useEffect(() => {
    const search = searchParams.get('search')?.toLowerCase();
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const pageParam = searchParams.get('page');

    const category = categoryParam || activeCategory;
    const subcategory = subcategoryParam || activeSubcategory;
    const page = pageParam ? parseInt(pageParam) : 1;

    if (categoryParam && category !== activeCategory) {
      setActiveCategory(category);
    }

    if (subcategoryParam && subcategory !== activeSubcategory) {
      setActiveSubcategory(subcategory);
    }

    if (page !== currentPage) {
      setCurrentPage(page);
    }

    // Filter products based on search, category, and subcategory
    const filtered = allProducts.filter(product => {
      // Safely check for search matches with null/undefined checks
      const matchesSearch = !search || (
        // Check if product.name exists and includes the search term
        (product.name && product.name.toLowerCase().includes(search)) ||
        // Check if product.nameTamil exists and includes the search term
        (product.nameTamil && product.nameTamil.toLowerCase().includes(search)) ||
        // Check if product.keyword exists, is an array, and any keyword includes the search term
        (product.keyword && Array.isArray(product.keyword) &&
          product.keyword.some(k => k && typeof k === 'string' && k.toLowerCase().includes(search)))
      );

      // For category matching - since we only show main categories, we need to check if product belongs to main category or any of its subcategories
      const matchesCategory = category === 'all' || (() => {
        // Get the selected main category data
        const selectedMainCategory = categories.find(cat => cat.id === category);

        if (!selectedMainCategory) {
          return false;
        }

        // Since we're only showing main categories, we need to check:
        // 1. If product directly belongs to this main category
        // 2. If product belongs to any subcategory under this main category

        // Get all subcategories under this main category from the full category list
        const allSubcategoriesUnderMain = allFirestoreCategories.filter(cat =>
          cat.parentCategoryID === category
        );

        // Create a list of all category IDs to check (main category + all its subcategories)
        const categoryIdsToCheck = [category, ...allSubcategoriesUnderMain.map(sub => sub.id)];

        console.log(`Filtering for main category "${selectedMainCategory.label}" (${category}):`, {
          subcategories: allSubcategoriesUnderMain.map(sub => ({ id: sub.id, name: sub.name })),
          categoryIdsToCheck
        });

        // Check if product belongs to main category or any subcategory (new system)
        if (product.categoryIDs && Array.isArray(product.categoryIDs)) {
          const matches = product.categoryIDs.some(catId => categoryIdsToCheck.includes(catId));
          if (matches) {
            console.log(`✓ Product ${product.name} matches main category ${selectedMainCategory.label} (new system)`);
            return true;
          }
        }

        // Check if product belongs to main category or any subcategory (legacy system)
        const legacyMatches = categoryIdsToCheck.some(catId =>
          product.primaryCategoryID === catId ||
          product.categoryID === catId ||
          (product as any).categoryId === catId
        );

        if (legacyMatches) {
          console.log(`✓ Product ${product.name} matches main category ${selectedMainCategory.label} (legacy system)`);
          return true;
        }

        // Category name matching (case insensitive) - check against main category and subcategory names
        if (product.category && typeof product.category === 'string') {
          const productCategoryLower = product.category.toLowerCase();

          // Check main category name
          if (selectedMainCategory.label && productCategoryLower === selectedMainCategory.label.toLowerCase()) {
            console.log(`✓ Product ${product.name} matches main category ${selectedMainCategory.label} (name match)`);
            return true;
          }

          // Check subcategory names
          const subcategoryNameMatch = allSubcategoriesUnderMain.some(subcat =>
            subcat.name && productCategoryLower === subcat.name.toLowerCase()
          );

          if (subcategoryNameMatch) {
            console.log(`✓ Product ${product.name} matches subcategory under ${selectedMainCategory.label} (name match)`);
            return true;
          }
        }

        return false;
      })();

      // For subcategory matching, check if the product's subcategory matches
      const matchesSubcategory = subcategory === 'all' || (() => {
        // If a specific subcategory is selected, check if product belongs to it
        if (product.categoryIDs && Array.isArray(product.categoryIDs)) {
          return product.categoryIDs.includes(subcategory);
        }

        // Legacy support - check various subcategory fields
        return product.subcategory === subcategory ||
               product.categoryID === subcategory ||
               product.primaryCategoryID === subcategory;
      })();

      return matchesSearch && matchesCategory && matchesSubcategory;
    });

    setFilteredProducts(filtered);

    // Reset to page 1 when filters change
    if (categoryParam || subcategoryParam || search) {
      setCurrentPage(1);
    }
  }, [searchParams, activeCategory, activeSubcategory, allProducts, allFirestoreCategories]);

  // Handle pagination
  useEffect(() => {
    // Calculate pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

    setPaginatedProducts(currentProducts);

    // Update URL with current page
    if (currentPage > 1) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', currentPage.toString());
        return newParams;
      });
    } else {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('page');
        return newParams;
      });
    }
  }, [currentPage, productsPerPage, filteredProducts, setSearchParams]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // State for screen size
  const [isMobile, setIsMobile] = useState(false);

  // Update screen size state
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update subcategories when active category or categories data changes
  useEffect(() => {
    updateSubcategories(activeCategory);
  }, [activeCategory, allFirestoreCategories, categories]);



  // Update subcategories when active category changes
  const updateSubcategories = (categoryId: string) => {
    if (categoryId === 'all') {
      setCurrentSubcategories([]);
      return;
    }

    // Find the selected category
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (!selectedCategory) {
      setCurrentSubcategories([]);
      return;
    }

    // Get subcategories for this main category from Firestore data
    const subcategoriesForCategory = allFirestoreCategories.filter(cat =>
      cat.parentCategoryID === categoryId
    );

    console.log(`Updating subcategories for category "${selectedCategory.label}" (${categoryId}):`, {
      foundSubcategories: subcategoriesForCategory.length,
      subcategoryNames: subcategoriesForCategory.map(sub => sub.name)
    });

    if (subcategoriesForCategory.length > 0) {
      const subcategoryOptions = [
        { id: 'all', label: `All ${selectedCategory.label}` },
        ...subcategoriesForCategory.map(subcat => ({
          id: subcat.id,
          label: subcat.name
        }))
      ];
      setCurrentSubcategories(subcategoryOptions);
      console.log('Set subcategory options:', subcategoryOptions);
    } else {
      setCurrentSubcategories([]);
      console.log('No subcategories found, cleared subcategory options');
    }
  };

  return (
    <div>
      {/* Category Tabs with Horizontal Scroll */}
      <div className="px-4 mb-4 mt-8">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-full">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setActiveCategory(category.id);
                  setActiveSubcategory('all');
                  setCurrentPage(1);
                  updateSubcategories(category.id);

                  // Update URL parameters to reflect the category change
                  setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('category', category.id);
                    newParams.delete('subcategory'); // Reset subcategory when changing main category
                    newParams.delete('page'); // Reset to page 1
                    return newParams;
                  });
                }}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg border-2 border-primary transform scale-105'
                    : 'bg-white border border-primary/20 text-gray-600 hover:bg-primary/5 hover:border-primary/40 shadow-sm'
                }`}
                disabled={loading}
                whileHover={{ scale: activeCategory === category.id ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <category.icon className={`w-5 h-5 ${
                  activeCategory === category.id ? 'text-white' : 'text-primary'
                }`} />
                <span className={`font-medium whitespace-nowrap ${
                  activeCategory === category.id ? 'font-semibold' : ''
                }`}>
                  {category.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        {/* Search Results Indicator */}
        {searchParams.get('search') && (
          <div className="mb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <p className="text-blue-700">
                    Search results for: <span className="font-medium">"{searchParams.get('search')}"</span>
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-blue-600 mt-1 ml-7">
                Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          </div>
        )}

        {/* Category Type Banner */}
        <div className="mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 rounded-xl p-4 shadow-md border border-primary/20"
          >
            <div className="flex items-start gap-3">
              {(() => {
                const selectedCategory = categories.find(cat => cat.id === activeCategory);
                const categoryName = selectedCategory?.label || 'Products';

                if (activeCategory === 'all') {
                  return (
                    <>
                      <Package className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-gray-600">
                        Browse our complete collection of fresh, organic products from local farms.
                      </p>
                    </>
                  );
                } else if (categoryName.toLowerCase().includes('staple') || categoryName.toLowerCase().includes('grocery')) {
                  return (
                    <>
                      <Leaf className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-gray-600">
                        All {categoryName.toLowerCase()} are organic certified and ready to ship immediately.
                      </p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <p className="text-sm text-gray-600">
                        Fresh {categoryName.toLowerCase()} harvested after confirmation. Limited slots available daily.
                      </p>
                    </>
                  );
                }
              })()}
            </div>
          </motion.div>
        </div>

        {/* Subcategories for Selected Category */}
        {currentSubcategories.length > 0 && (
          <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-full">
              {currentSubcategories.map((subcategory, index) => (
                <motion.button
                  key={subcategory.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setActiveSubcategory(subcategory.id);
                    setCurrentPage(1);

                    // Update URL parameters to reflect the subcategory change
                    setSearchParams(prev => {
                      const newParams = new URLSearchParams(prev);
                      newParams.set('subcategory', subcategory.id);
                      newParams.delete('page'); // Reset to page 1
                      return newParams;
                    });
                  }}
                  className={`flex-shrink-0 px-6 py-3 rounded-xl transition-all duration-200 ${
                    activeSubcategory === subcategory.id
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg border-2 border-primary transform scale-105'
                      : 'bg-white border border-primary/20 text-gray-600 hover:bg-primary/5 hover:border-primary/40 shadow-sm'
                  }`}
                  disabled={loading}
                  whileHover={{ scale: activeSubcategory === subcategory.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={`font-medium whitespace-nowrap ${
                    activeSubcategory === subcategory.id ? 'font-semibold' : ''
                  }`}>
                    {subcategory.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
            <p className="font-medium">{error}</p>
            <button
              className="mt-2 text-sm underline"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-fr">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredProducts.length > productsPerPage && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-primary hover:bg-primary/10 border border-gray-100'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(7, Math.ceil(filteredProducts.length / productsPerPage)) }).map((_, index) => {
                    // Calculate page number to display
                    let pageNum = currentPage;
                    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

                    if (totalPages <= 7) {
                      // If 7 or fewer pages, show all page numbers
                      pageNum = index + 1;
                    } else if (currentPage <= 4) {
                      // If near the start, show pages 1-7
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 3) {
                      // If near the end, show last 7 pages
                      pageNum = totalPages - 6 + index;
                    } else {
                      // Otherwise show current page and 3 pages on each side
                      pageNum = currentPage - 3 + index;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-primary/10 border border-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    currentPage === Math.ceil(filteredProducts.length / productsPerPage)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-primary hover:bg-primary/10 border border-gray-100'
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-8">
            {searchParams.get('search') ? (
              <div className="flex flex-col items-center">
                <Search className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium mb-2">No products found for "{searchParams.get('search')}"</p>
                <p className="text-gray-500 mb-4">Try a different search term or browse by category</p>
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <p className="text-gray-600">No products found in this category</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}