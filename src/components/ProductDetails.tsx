import React, { useState, useEffect } from 'react';
import { Minus, Plus, ChevronDown, MapPin, Clock, ArrowLeft, Leaf, Shield, Truck, CircleDollarSign, ShoppingCart, Check, Calendar, Star, Award, Plane as Plant, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById, getFarmerById, mapProductForUI, getAllCategories } from '../firebase/products';
import { Product as FirestoreProduct, Farmer as FirestoreFarmer } from '../firebase/schema';
import { useCart } from '../contexts/CartContext';
import { formatQuantityDisplay, addQuantities, subtractQuantities, formatPrice, safeMultiply, ensureSafeNumber } from '../utils/numberUtils';
import { PriceDisplay } from './ui/PriceDisplay';

interface SizeOption {
  id: string;
  label: string;
  weightRange: string;
  price: number;
  mrp?: number; // Add MRP field
  stock: number; // Add stock field
}

// UI Product interface that extends the Firestore Product with UI-specific fields
interface UIProduct extends Partial<FirestoreProduct> {
  id: string;
  name: string;
  nameTamil?: string;
  image: string;
  price: number;
  quantity: number;
  unit: string;
  harvestDate?: string;
  deliveryDate?: string;
  description: string;
  nutritionInfo: string[];
  sizeOptions?: SizeOption[];
  storageInfo?: string;
  type: 'pre-order' | 'in-stock';
  orderProgress: number;
  // New variant-related fields
  hasVariants?: boolean;
  variants?: any[];
  defaultVariant?: any;
  defaultVariantID?: string;
  farmer?: {
    id: string;
    name: string;
    farmName: string;
    location: string;
    experience: string;
    philosophy: string;
    certifications: string[];
    tags: string[];
  };
}

export function ProductDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart, items, updateQuantity: updateCartQuantity, isInCart: checkIsInCart, getItemQuantity } = useCart();

  // State for product data
  const [product, setProduct] = useState<UIProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showFarmerInfo, setShowFarmerInfo] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // Fetch product data from Firestore
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch product data and categories in parallel
        const [productData, categories] = await Promise.all([
          getProductById(id),
          getAllCategories()
        ]);

        if (!productData) {
          setError('Product not found');
          setLoading(false);
          return;
        }

        // Use the updated mapProductForUI function that handles variants
        const uiProduct = await mapProductForUI(productData, categories);

        // Add additional UI-specific fields that the old function provided
        const enhancedUIProduct = {
          ...uiProduct,
          // Parse nutrition info from string to array
          nutritionInfo: productData.nutrition ?
            productData.nutrition.split('\n').filter(item => item.trim().length > 0) :
            ['No nutrition information available'],
          // Use real harvest and delivery dates from database
          harvestDate: uiProduct.harvestLabel || 'Harvest Today',
          deliveryDate: uiProduct.deliveryLabel || 'Delivered Tomorrow',
          // Add default storage info if not available
          storageInfo: 'Store in a cool, dry place away from direct sunlight.'
        };

        // Set product data
        setProduct(enhancedUIProduct);

        // Initialize selected size if product has size options (variants)
        if (enhancedUIProduct.sizeOptions && enhancedUIProduct.sizeOptions.length > 0) {
          setSelectedSize(enhancedUIProduct.sizeOptions[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product. Please try again.');
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Sync cart state and quantity
  useEffect(() => {
    if (product) {
      const itemInCart = checkIsInCart(product.id);
      setIsInCart(itemInCart);

      if (itemInCart) {
        const cartQuantity = getItemQuantity(product.id);
        if (cartQuantity > 0) {
          setOrderQuantity(cartQuantity);
        }
      }
    }
  }, [product, items, checkIsInCart, getItemQuantity]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Loading product details...</p>
      </div>
    );
  }

  // Show error state
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {error || 'Product not found'}
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find the product you're looking for.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentPrice = ensureSafeNumber(
    product.sizeOptions
      ? product.sizeOptions.find(option => option.id === selectedSize)?.price || product.price
      : product.price
  );

  // Get current MRP based on selected variant
  const currentMRP = ensureSafeNumber(
    product.sizeOptions
      ? product.sizeOptions.find(option => option.id === selectedSize)?.mrp || product.mrp
      : product.mrp
  );

  // Get current stock based on selected variant
  const currentStock = ensureSafeNumber(
    product.sizeOptions
      ? product.sizeOptions.find(option => option.id === selectedSize)?.stock || product.quantity
      : product.quantity
  );

  const decreaseQuantity = () => {
    // Use dynamic increment amount from product data
    const decrementAmount = ensureSafeNumber(product?.incrementalQuantity, 1);
    const minAllowed = ensureSafeNumber(product?.minQuantity, 1);

    if (orderQuantity - decrementAmount >= minAllowed) {
      const newQuantity = subtractQuantities(orderQuantity, decrementAmount);
      setOrderQuantity(newQuantity);
      if (isInCart) {
        updateCartQuantity(product!.id, -decrementAmount);
      }
    }
  };

  const increaseQuantity = () => {
    // Use dynamic increment amount from product data
    const incrementAmount = ensureSafeNumber(product?.incrementalQuantity, 1);
    const maxAllowed = ensureSafeNumber(product?.maxQuantity, currentStock);

    if (orderQuantity + incrementAmount <= maxAllowed) {
      const newQuantity = addQuantities(orderQuantity, incrementAmount);
      setOrderQuantity(newQuantity);
      if (isInCart) {
        updateCartQuantity(product!.id, incrementAmount);
      }
      setQuantityError(null); // Clear any error
    } else {
      // Show error message
      setQuantityError(`Maximum quantity is ${formatQuantityDisplay(maxAllowed)} ${product?.unit || 'units'}`);
      setTimeout(() => setQuantityError(null), 3000);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Get the selected size option if available
    const selectedSizeOption = product.sizeOptions?.find(option => option.id === selectedSize);

    // Add item to cart
    addToCart({
      id: product.id,
      name: product.name,
      nameTamil: product.nameTamil || '',
      image: product.image,
      price: currentPrice,
      quantity: orderQuantity,
      unit: product.unit,
      status: 'pending',
      type: product.type,
      selectedSize: selectedSizeOption ? {
        id: selectedSizeOption.id,
        label: selectedSizeOption.label,
        weightRange: selectedSizeOption.weightRange,
        price: selectedSizeOption.price
      } : undefined
    });

    // Update cart state
    setIsInCart(true);

    // Show success notification
    setShowAddedToCart(true);
    setTimeout(() => {
      setShowAddedToCart(false);
    }, 2000);
  };

  const viewCart = () => {
    navigate('/cart');
  };

  const getUrgencyColor = () => {
    if (currentStock <= 2) return 'bg-red-500';
    if (currentStock <= 5) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getUrgencyText = () => {
    // If stock is undefined, null, or 0, use hardcoded attractive values
    if (!currentStock || currentStock === 0) {
      const attractiveMessages = [
        'Only 7 pieces left!',
        'Limited stock - 9 pieces remaining!',
        'Hurry! 4 pieces available!',
        'Almost sold out - 6 left!',
        'Only 8 pieces remaining!',
        'Limited quantity - 5 available!'
      ];
      // Use a consistent message based on the product ID to avoid changing on re-renders
      const messageIndex = (product.id?.length || 0) % attractiveMessages.length;
      return attractiveMessages[messageIndex];
    }

    if (currentStock <= 2) return 'Almost Gone!';
    if (currentStock <= 5) return 'Limited Stock!';
    return `${currentStock} ${product.unit} available`;
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:flex md:pb-0">
      {/* Back Button Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-800 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              <span className="font-medium">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  // Reload the page to refresh data
                  window.location.reload();
                }}
                className="relative p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors group"
                aria-label="Refresh product data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
                <span className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Refresh Data
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={viewCart}
                className="relative p-3 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors group"
              >
                <ShoppingCart className="w-6 h-6 text-primary" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
                <span className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  View Cart
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Image Section */}
      <div className="md:w-1/2 md:sticky md:top-0 md:h-screen pt-16">
        <div className="relative h-64 md:h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 md:p-6"
          >
            <h1 className="text-white font-display text-2xl md:text-3xl font-bold">{product.name}</h1>
            <p className="text-white/90">{product.nameTamil}</p>
          </motion.div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="md:w-1/2 md:min-h-screen">
        <div className="p-4 md:p-6 space-y-6">
          {/* Product Status with Progress Bar */}
          <div className="bg-white border border-primary/20 rounded-xl p-6 shadow-sm hover:shadow-primary/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">{getUrgencyText()}</span>
                {product.type === 'pre-order' && (
                  <div className="px-2 py-1 bg-orange-50 rounded-full text-xs font-medium text-orange-600 ml-2">
                    Pre-order
                  </div>
                )}
              </div>
              <PriceDisplay
                price={currentPrice}
                mrp={currentMRP}
                unit={product.unit}
                size="lg"
                className="text-xl font-semibold"
              />
            </div>

            {product.type === 'pre-order' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-600">{product.harvestDate}</span>
                  </div>
                  <span className="font-medium">{product.orderProgress}% Booked</span>
                </div>

                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 bottom-0 ${getUrgencyColor()} transition-all duration-500`}
                    style={{ width: `${product.orderProgress}%` }}
                  />
                </div>

                {(!currentStock || currentStock <= 5) && (
                  <div className="flex items-center gap-1.5 text-secondary text-sm bg-secondary/10 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {!currentStock || currentStock === 0
                        ? `Only ${5 + ((product.id?.length || 0) % 4)} ${product.unit} left to pre-order!`
                        : `Only ${currentStock} ${product.unit} left to pre-order!`
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-md hover:shadow-primary/20 transition-all">
            <h3 className="font-medium mb-3 md:text-lg text-gray-800">Description</h3>
            <p className="text-gray-600 md:text-lg">{product.description}</p>
          </div>

          {/* Size Options for Watermelon */}
          {product.sizeOptions && (
            <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-md hover:shadow-primary/20 transition-all">
              <h3 className="font-medium mb-3 md:text-lg">Choose Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {product.sizeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedSize(option.id)}
                    className={`p-3 md:p-4 rounded-xl text-center transition-colors ${
                      selectedSize === option.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    <div className="font-medium md:text-lg">{option.label}</div>
                    <div className="text-sm md:text-base">{option.weightRange}</div>
                    <div className="mt-1">
                      <PriceDisplay
                        price={option.price}
                        mrp={option.mrp}
                        size="md"
                        showUnit={false}
                        className={selectedSize === option.id ? 'text-white' : 'text-gray-600'}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="bg-white border border-primary/30 rounded-xl p-6 shadow-md hover:shadow-primary/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium md:text-lg">Select Quantity</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={decreaseQuantity}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="font-medium md:text-lg">{formatQuantityDisplay(orderQuantity)} {product.unit}</span>
                <button
                  onClick={increaseQuantity}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-right text-gray-600 md:text-lg">
              Total: {formatPrice(safeMultiply(currentPrice, orderQuantity))}
            </div>

            {/* Quantity Error Message */}
            {quantityError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 bg-red-500 text-white text-sm px-3 py-2 rounded-lg"
              >
                {quantityError}
              </motion.div>
            )}
          </div>

          {/* Enhanced Delivery Info */}
          <div className="bg-white border border-primary/30 rounded-xl overflow-hidden shadow-md hover:shadow-primary/20 transition-all">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-lg">Harvest & Delivery Schedule</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Plant className="w-5 h-5" />
                    <span className="font-medium">Harvest Day</span>
                  </div>
                  <p className="text-green-800">{product.harvestDate}</p>
                  <p className="text-sm text-green-600 mt-1">Fresh from our organic farms</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">Delivery Day</span>
                  </div>
                  <p className="text-blue-800">{product.deliveryDate}</p>
                  <p className="text-sm text-blue-600 mt-1">Straight to your doorstep</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Farm Location</h3>
                  <p className="text-gray-600">Where your food grows</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200"
                    alt="Farm location"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {product.farmer?.farmName || 'Organic Valley Farms'}
                    </h4>
                    <p className="text-gray-600">
                      {product.farmer?.location || 'Local Organic Farm'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                      <Award className="w-4 h-4" />
                      <span>
                        {product.farmer?.certifications?.length ?
                          product.farmer.certifications[0] :
                          'Certified Organic Farm'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Farmer Info - Only show if farmer data is available */}
          {product.farmer && (
            <div className="bg-white border border-primary/30 rounded-xl shadow-md hover:shadow-primary/20 transition-all overflow-hidden">
              <button
                className="w-full p-6 flex items-center justify-between border-b border-gray-100"
                onClick={() => setShowFarmerInfo(!showFarmerInfo)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-lg">Meet Your Farmer</h3>
                    <p className="text-gray-600">Learn about who grows your food</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${showFarmerInfo ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showFarmerInfo && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-4">
                      <div className="flex items-start gap-4 mb-6">
                        <img
                          src="https://images.unsplash.com/photo-1622030411594-c282a63aa1bc?auto=format&fit=crop&q=80&w=400"
                          alt={product.farmer.name}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-lg text-gray-800">{product.farmer.name}</h4>
                          <p className="text-primary font-medium">{product.farmer.farmName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="px-3 py-1 bg-green-50 rounded-full text-sm text-green-700">
                              {product.farmer.experience}
                            </div>
                            {product.farmer.certifications && product.farmer.certifications.map((cert, index) => (
                              <div key={index} className="px-3 py-1 bg-blue-50 rounded-full text-sm text-blue-700">
                                {cert}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h5 className="font-medium mb-2">Farming Philosophy</h5>
                          <p className="text-gray-600">
                            "{product.farmer.philosophy || "I believe in sustainable farming practices that not only produce the best quality food but also protect our environment for future generations."}"
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {product.farmer.tags && product.farmer.tags.slice(0, 2).map((tag, index) => (
                            <div key={index} className="bg-primary/5 rounded-xl p-4 text-center">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                {index === 0 ? (
                                  <Plant className="w-5 h-5 text-primary" />
                                ) : (
                                  <Award className="w-5 h-5 text-primary" />
                                )}
                              </div>
                              <h5 className="font-medium mb-1">{tag}</h5>
                              <p className="text-sm text-gray-600">
                                {index === 0 ? 'Farming practice' : 'Quality standard'}
                              </p>
                            </div>
                          ))}

                          {(!product.farmer.tags || product.farmer.tags.length < 2) && (
                            <>
                              <div className="bg-primary/5 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Plant className="w-5 h-5 text-primary" />
                                </div>
                                <h5 className="font-medium mb-1">100% Organic</h5>
                                <p className="text-sm text-gray-600">No chemical pesticides</p>
                              </div>
                              <div className="bg-primary/5 rounded-xl p-4 text-center">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Award className="w-5 h-5 text-primary" />
                                </div>
                                <h5 className="font-medium mb-1">Certified</h5>
                                <p className="text-sm text-gray-600">Quality assured</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-primary/30 rounded-xl p-3 md:p-4 text-center shadow-md hover:shadow-primary/20 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm md:text-base text-gray-600">100% Organic</p>
            </div>
            <div className="bg-white border border-primary/30 rounded-xl p-3 md:p-4 text-center shadow-md hover:shadow-primary/20 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm md:text-base text-gray-600">Quality Assured</p>
            </div>
            <div className="bg-white border border-primary/20 rounded-xl p-3 md:p-4 text-center shadow-sm hover:shadow-primary/10 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm md:text-base text-gray-600">Fast Delivery</p>
            </div>
            <div className="bg-white border border-primary/20 rounded-xl p-3 md:p-4 text-center shadow-sm hover:shadow-primary/10 transition-all">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CircleDollarSign className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm md:text-base text-gray-600">Best Price</p>
            </div>
          </div>

          {/* Nutrition Info */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              className="w-full p-4 md:p-6 flex items-center justify-between"
              onClick={() => setShowNutrition(!showNutrition)}
            >
              <span className="font-medium md:text-lg">Nutrition Information</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${showNutrition ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showNutrition && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 md:p-6 pt-0">
                    <ul className="space-y-2">
                      {product.nutritionInfo.map((info, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600 md:text-lg">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          {info}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Storage Info */}
          {product.storageInfo && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                className="w-full p-4 md:p-6 flex items-center justify-between"
                onClick={() => setShowStorage(!showStorage)}
              >
                <span className="font-medium md:text-lg">Storage Instructions</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${showStorage ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showStorage && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-6 pt-0">
                      <p className="text-gray-600 md:text-lg">{product.storageInfo}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden">
        {isInCart ? (
          <div className="flex items-center gap-3">
            <button
              onClick={viewCart}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              View Cart ({items.length})
            </button>
            <div className="bg-white border border-primary/30 rounded-xl p-2 flex items-center gap-2">
              <span className="text-primary font-medium text-sm">
                {orderQuantity} {product.unit}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart • {formatPrice(safeMultiply(currentPrice, orderQuantity))}
          </button>
        )}
      </div>

      {/* Desktop Add to Cart */}
      <div className="hidden md:block md:fixed md:bottom-6 md:right-6 md:w-[calc(50%-2rem)]">
        {isInCart ? (
          <div className="flex items-center gap-3">
            <button
              onClick={viewCart}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              View Cart ({items.length})
            </button>
            <div className="bg-white border border-primary/30 rounded-xl p-3 flex items-center gap-2">
              <span className="text-primary font-medium">
                {orderQuantity} {product.unit}
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart • {formatPrice(safeMultiply(currentPrice, orderQuantity))}
          </button>
        )}
      </div>

      {/* Added to Cart Notification */}
      <AnimatePresence>
        {showAddedToCart && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 bg-green-500 text-white p-4 rounded-xl shadow-lg md:w-auto md:left-auto md:right-6"
          >
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span>Added {orderQuantity} {product?.unit} to cart!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}