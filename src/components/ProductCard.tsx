import React, { useState, useEffect } from 'react';
import { Clock, Minus, Plus, ShoppingBag, Leaf, CircleDollarSign, X, User, AlertCircle, Truck, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { formatQuantityDisplay, addQuantities, subtractQuantities } from '../utils/numberUtils';
import { PriceDisplay } from './ui/PriceDisplay';

interface SizeOption {
  id: string;
  label: string;
  weightRange: string;
  price: number;
  mrp?: number; // Add MRP field
  stock: number; // Add stock field
}

interface ProductCardProps {
  id: string;
  name: string;
  nameTamil: string;
  image: string;
  price: number;
  mrp?: number; // Add MRP field
  quantity: number;
  unit: string;
  type: 'pre-order' | 'in-stock';
  category?: string; // Add category field
  farmer?: {
    name: string;
    experience: string;
  };
  orderProgress?: number;
  sizeOptions?: SizeOption[];
  // New harvest and pre-order fields
  isPreOrder?: boolean;
  harvestDate?: Date;
  harvestLabel?: string;
  harvestDayLabel?: string;
  deliveryLabel?: string;
  deliveryDaysFromNow?: number;
  isPreOrderAvailable?: boolean;
  preOrderWindow?: {
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    status: string;
  };
  // New quantity control fields
  incrementalQuantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export function ProductCard({
  id,
  name,
  nameTamil,
  image,
  price,
  mrp,
  quantity,
  unit,
  type,
  category,
  farmer,
  orderProgress,
  sizeOptions,
  isPreOrder,
  harvestDate,
  harvestLabel,
  harvestDayLabel,
  deliveryLabel,
  deliveryDaysFromNow,
  isPreOrderAvailable,
  preOrderWindow,
  incrementalQuantity,
  minQuantity,
  maxQuantity
}: ProductCardProps) {
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(minQuantity || 1);
  const [selectedSize, setSelectedSize] = useState<string>(
    sizeOptions ? sizeOptions[0].id : ''
  );
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const currentPrice = sizeOptions
    ? sizeOptions.find(option => option.id === selectedSize)?.price || price
    : price;

  // Get current MRP based on selected variant
  const currentMRP = sizeOptions
    ? sizeOptions.find(option => option.id === selectedSize)?.mrp || mrp
    : mrp;

  // Get current stock based on selected variant
  const currentStock = sizeOptions
    ? sizeOptions.find(option => option.id === selectedSize)?.stock || quantity
    : quantity;

  // Get cart functions from context
  const { addToCart, updateQuantity: updateCartQuantity, isInCart: checkIsInCart, getItemQuantity } = useCart();

  // Check if item is in cart
  const itemInCart = checkIsInCart(id);

  // Initialize quantity from cart if item exists
  useEffect(() => {
    if (itemInCart) {
      const cartQuantity = getItemQuantity(id);
      if (cartQuantity > 0) {
        setOrderQuantity(cartQuantity);
        setShowQuickAdd(true);
      }
    }
  }, [id, itemInCart, getItemQuantity]);

  // State for add to cart animation
  const [addedToCart, setAddedToCart] = useState(false);

  // Add to cart when "Add to Cart" button is clicked
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Get the selected size option if available
    const selectedSizeOption = sizeOptions?.find(option => option.id === selectedSize);

    // Add item to cart with minimum quantity
    const initialQuantity = minQuantity || 1;
    addToCart({
      id,
      name,
      nameTamil,
      image,
      price: currentPrice,
      quantity: initialQuantity,
      unit,
      status: 'pending',
      type: type,
      selectedSize: selectedSizeOption ? {
        id: selectedSizeOption.id,
        label: selectedSizeOption.label,
        weightRange: selectedSizeOption.weightRange,
        price: selectedSizeOption.price
      } : undefined,
      // Include quantity control fields
      incrementalQuantity,
      minQuantity,
      maxQuantity
    });

    // Set local state to match
    setOrderQuantity(initialQuantity);

    // Trigger animation
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1000);
  };

  const decreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use dynamic increment amount from product data
    const decrementAmount = incrementalQuantity || 1;

    if (orderQuantity > decrementAmount) {
      // Just decrease the quantity with proper precision handling
      const newQuantity = subtractQuantities(orderQuantity, decrementAmount);
      setOrderQuantity(newQuantity);
      updateCartQuantity(id, -decrementAmount);
    } else {
      // Remove from cart if quantity becomes 0
      setOrderQuantity(0);
      setShowQuickAdd(false); // Hide quantity controls
      updateCartQuantity(id, -orderQuantity); // This will remove the item
    }
  };

  const increaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use dynamic increment amount from product data
    const incrementAmount = incrementalQuantity || 1;
    const maxAllowed = maxQuantity || currentStock;

    if (orderQuantity + incrementAmount <= maxAllowed) {
      // Increase the quantity with proper precision handling
      const newQuantity = addQuantities(orderQuantity, incrementAmount);
      setOrderQuantity(newQuantity);
      updateCartQuantity(id, incrementAmount);
      setQuantityError(null); // Clear any error
    } else {
      // Show error message
      setQuantityError(`Maximum quantity is ${maxAllowed} ${unit}`);
      setTimeout(() => setQuantityError(null), 3000);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  const getUrgencyColor = () => {
    if (currentStock <= 2) return 'bg-red-500';
    if (currentStock <= 5) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getUrgencyText = () => {
    if (currentStock <= 2) return 'Almost Gone!';
    if (currentStock <= 5) return 'Limited Stock!';
    return `${currentStock} ${unit} available`;
  };

  // Get delivery information from database or fallback to calculation
  const getDeliveryInfo = () => {
    // Use delivery information from database if available
    if (deliveryLabel) {
      return deliveryLabel;
    }

    // Fallback to local calculation using centralized logic
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Check if product is pre-order
    const isPreOrderProduct = isPreOrder || type === 'pre-order';

    if (isPreOrderProduct) {
      // Pre-order items take longer
      return "Delivered in 3 Days";
    } else {
      // Regular items follow day-of-week logic
      if (dayOfWeek === 0) { // Sunday
        return "Delivery by Tuesday";
      } else { // Monday-Saturday
        return "Delivery by Tomorrow";
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-primary/20 rounded-2xl shadow-sm overflow-hidden relative group cursor-pointer hover:shadow-primary/10 hover:border-primary/30 transition-all h-full flex flex-col"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-36 object-cover"
        />
        <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <PriceDisplay
            price={currentPrice}
            mrp={currentMRP}
            unit={unit}
            size="sm"
            className="text-primary"
          />
        </div>

        {type === 'pre-order' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-medium">{getUrgencyText()}</span>
                </div>
                <span className="text-xs font-medium">{orderProgress}% Booked</span>
              </div>

              <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 bottom-0 ${getUrgencyColor()} transition-all duration-500`}
                  style={{ width: `${orderProgress}%` }}
                />
              </div>

              {currentStock <= 5 && (
                <div className="flex items-center gap-0.5 text-white/90 text-[10px]">
                  <AlertCircle className="w-2.5 h-2.5" />
                  <span>Only {currentStock} {unit} left!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 flex-grow flex flex-col">
        <div>
          <h3 className="font-medium text-gray-800 leading-snug text-sm">{name}</h3>
          <p className="text-gray-600 text-xs">{nameTamil}</p>
        </div>

        {farmer && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-600">
            <User className="w-2.5 h-2.5" />
            <span>{farmer.name}</span>
            <span className="text-primary">•</span>
            <span>{farmer.experience}</span>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <div className="px-1.5 py-0.5 bg-green-50 rounded-full text-[10px] font-medium text-green-600 flex items-center gap-0.5">
            <Leaf className="w-2.5 h-2.5" />
            Organic
          </div>
          {type === 'pre-order' && (
            <div className="px-1.5 py-0.5 bg-orange-50 rounded-full text-[10px] font-medium text-orange-600 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              Pre-order
            </div>
          )}
          {harvestDayLabel && (
            <div className="px-1.5 py-0.5 bg-blue-50 rounded-full text-[10px] font-medium text-blue-600 flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {harvestDayLabel === 'Today' ? 'Fresh Today' :
                harvestDayLabel === 'Tomorrow' ? 'Fresh Tomorrow' :
                  harvestDayLabel === 'Yesterday' ? 'Harvested Yesterday' :
                    `Harvest ${harvestDayLabel}`}
            </div>
          )}
        </div>

        {/* Size options if available - Only render when variants exist */}
        {sizeOptions && (
          <div className="mt-2 mb-2">
            <div className="text-xs font-medium mb-1.5">Size:</div>
            <div className="grid grid-cols-3 gap-1">
              {sizeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(option.id);
                  }}
                  className={`p-1 rounded-lg text-center transition-colors text-xs ${selectedSize === option.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600'
                    }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs opacity-75">{option.weightRange}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Information - Positioned just above Add to Cart */}
        <div className="mt-auto pt-2 w-full">
          <div className={`w-full px-2 py-1 mb-2 ${type === 'in-stock' ? 'bg-blue-50' : 'bg-amber-50'} rounded-lg font-medium ${type === 'in-stock' ? 'text-blue-600' : 'text-amber-600'} flex items-center justify-center whitespace-nowrap text-[10px] sm:text-[10px] xs:text-[9px]`}>
            <Truck className="w-3 h-3 mr-1" />
            {getDeliveryInfo()}
          </div>


          {/* Add to Cart or Quantity Controls */}
          <div className="w-full">
            {showQuickAdd ? (
              <div className="flex items-center justify-between bg-primary/10 rounded-lg p-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    decreaseQuantity(e);
                  }}
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-primary border border-primary/20"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium text-primary">{formatQuantityDisplay(orderQuantity)} {unit}</span>
                  <span className="text-xs text-primary/80">₹{(currentPrice * orderQuantity).toFixed(2)}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    increaseQuantity(e);
                  }}
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-primary border border-primary/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <motion.button
                onClick={handleAddToCart}
                className={`w-full py-1.5 rounded-lg flex items-center justify-center text-xs font-medium ${addedToCart
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
                  } transition-colors`}
                animate={{
                  scale: addedToCart ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="flex items-center text-sm sm:text-base">
                  <ShoppingBag className={`w-3.5 h-3.5 mr-1 ${addedToCart ? 'animate-bounce' : ''}`} />
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </span>

              </motion.button>
            )}
          </div>

          {/* Quantity Error Message */}
          {quantityError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded-lg shadow-lg z-10"
            >
              {quantityError}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}