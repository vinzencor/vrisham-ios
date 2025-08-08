import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import {
  ShoppingBag,
  Plus,
  Minus,
  Clock,
  User,
  Leaf,
  Calendar,
  Truck,
  AlertCircle
} from 'lucide-react';
import { formatQuantityDisplay, addQuantities, subtractQuantities } from '../utils/numberUtils';
import { PriceDisplay } from './ui/PriceDisplay';

interface SizeOption {
  id: string;
  label: string;
  weightRange: string;
  price: number;
  mrp?: number;
  stock: number;
}

interface CompactProductCardProps {
  id: string;
  name: string;
  nameTamil: string;
  image: string;
  price: number;
  mrp?: number;
  quantity: number;
  unit: string;
  type: 'pre-order' | 'in-stock';
  category?: string;
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
  // Urgent Harvest styling
  isUrgentHarvest?: boolean;
}

export function CompactProductCard({
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
  maxQuantity,
  isUrgentHarvest = false
}: CompactProductCardProps) {
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(minQuantity || 1);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(
    sizeOptions ? sizeOptions[0].id : ''
  );

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

    // Add item to cart with initial quantity
    addToCart({
      id,
      name,
      nameTamil,
      image,
      price: currentPrice,
      quantity: 1, // Always start with 1
      unit,
      status: 'pending',
      type: type,
      selectedSize: selectedSizeOption ? {
        id: selectedSizeOption.id,
        label: selectedSizeOption.label,
        weightRange: selectedSizeOption.weightRange,
        price: selectedSizeOption.price
      } : undefined
    });

    // Set local state to match
    setOrderQuantity(1);

    // Trigger animation
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1000);
  };

  const decreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use dynamic increment amount from product data
    const decrementAmount = incrementalQuantity || 1;
    const minAllowed = minQuantity || 1;

    if (orderQuantity - decrementAmount >= minAllowed) {
      const newQuantity = subtractQuantities(orderQuantity, decrementAmount);
      setOrderQuantity(newQuantity);
      updateCartQuantity(id, -decrementAmount);
    } else {
      // Remove from cart if quantity would go below minimum
      setOrderQuantity(0);
      setShowQuickAdd(false);
      updateCartQuantity(id, -orderQuantity);
    }
  };

  const increaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use dynamic increment amount from product data
    const incrementAmount = incrementalQuantity || 1;
    const maxAllowed = maxQuantity || currentStock;

    if (orderQuantity + incrementAmount <= maxAllowed) {
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
    // If stock is undefined, null, or 0, use hardcoded attractive values
    if (!currentStock || currentStock === 0 || isNaN(currentStock)) {
      const attractiveMessages = [
        'Only 5 pieces left!',
        'Limited stock - 8 pieces remaining!',
        'Hurry! 3 pieces available!',
        'Almost sold out - 4 left!',
        'Only 6 pieces remaining!',
        'Limited quantity - 7 available!'
      ];
      // Use a consistent message based on the product ID to avoid changing on re-renders
      const messageIndex = (id?.length || 0) % attractiveMessages.length;
      return attractiveMessages[messageIndex];
    }

    if (currentStock <= 2) return 'Almost Gone!';
    if (currentStock <= 5) return 'Limited Stock!';
    return `${currentStock} ${unit} available`;
  };

  const getDeliveryInfo = () => {
    if (deliveryLabel) {
      return deliveryLabel;
    }

    if (deliveryDaysFromNow !== undefined) {
      if (deliveryDaysFromNow === 0) return 'Delivery Today';
      if (deliveryDaysFromNow === 1) return 'Delivery Tomorrow';
      return `Delivery in ${deliveryDaysFromNow} days`;
    }

    // Default delivery info
    const today = new Date().getDay();
    if (today === 0) { // Sunday
      return 'Delivery by Tuesday';
    } else {
      return 'Delivery by Tomorrow';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-primary/20 rounded-xl shadow-sm overflow-hidden relative group cursor-pointer hover:shadow-primary/10 hover:border-primary/30 transition-all h-full flex flex-col"
      onClick={handleCardClick}
    >
      <div className="relative">
        <img
          src={image}
          alt={name}
          className={`w-full object-cover ${isUrgentHarvest ? 'h-48 md:h-56' : 'h-36'}`}
        />
        <div className={`absolute top-1 right-1 bg-white/90 backdrop-blur-sm rounded-full ${
          isUrgentHarvest ? 'px-2 py-1' : 'px-1 py-0.5'
        }`}>
          <PriceDisplay
            price={currentPrice}
            mrp={currentMRP}
            unit={unit}
            size="sm"
            className="text-primary"
          />
        </div>

        {type === 'pre-order' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span className="text-xs font-medium">{getUrgencyText()}</span>
                </div>
                <span className="text-xs font-medium">{orderProgress}% Booked</span>
              </div>

              <div className="relative h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 bottom-0 ${getUrgencyColor()} transition-all duration-500`}
                  style={{ width: `${orderProgress}%` }}
                />
              </div>

              {(!currentStock || currentStock <= 5) && (
                <div className="flex items-center gap-0.5 text-white/90 text-[9px]">
                  <AlertCircle className="w-2 h-2" />
                  <span>
                    {!currentStock || currentStock === 0 || isNaN(currentStock)
                      ? `Only ${3 + ((id?.length || 0) % 5)} ${unit} left!`
                      : `Only ${currentStock} ${unit} left!`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={`flex-grow flex flex-col justify-between ${isUrgentHarvest ? 'p-3' : 'p-2'}`}>
        <div className="flex-grow">
          <div>
            <h3 className={`font-medium text-gray-800 leading-tight ${isUrgentHarvest ? 'text-base' : 'text-sm'}`}>{name}</h3>
            <p className={`text-gray-600 ${isUrgentHarvest ? 'text-sm' : 'text-xs'}`}>{nameTamil}</p>
          </div>

          {farmer && (
            <div className={`mt-0.5 flex items-center gap-1 text-gray-600 ${isUrgentHarvest ? 'text-xs' : 'text-[9px]'}`}>
              <User className={`${isUrgentHarvest ? 'w-3 h-3' : 'w-2 h-2'}`} />
              <span>{farmer.name}</span>
              <span className="text-primary">•</span>
              <span>{farmer.experience}</span>
            </div>
          )}

          <div className={`${farmer ? 'mt-0.5' : 'mt-0.5'} flex items-center gap-0.5 flex-wrap`}>
          <div className={`bg-green-50 rounded-full font-medium text-green-600 flex items-center gap-0.5 ${
            isUrgentHarvest ? 'px-2 py-1 text-xs' : 'px-1 py-0.5 text-[9px]'
          }`}>
            <Leaf className={`${isUrgentHarvest ? 'w-3 h-3' : 'w-2 h-2'}`} />
            Organic
          </div>
          {type === 'pre-order' && (
            <div className={`bg-orange-50 rounded-full font-medium text-orange-600 flex items-center gap-0.5 ${
              isUrgentHarvest ? 'px-2 py-1 text-xs' : 'px-1 py-0.5 text-[9px]'
            }`}>
              <Clock className={`${isUrgentHarvest ? 'w-3 h-3' : 'w-2 h-2'}`} />
              Pre-order
            </div>
          )}
          {harvestDayLabel && (
            <div className={`bg-blue-50 rounded-full font-medium text-blue-600 flex items-center gap-0.5 ${
              isUrgentHarvest ? 'px-2 py-1 text-xs' : 'px-1 py-0.5 text-[9px]'
            }`}>
              <Calendar className={`${isUrgentHarvest ? 'w-3 h-3' : 'w-2 h-2'}`} />
              {harvestDayLabel === 'Today' ? 'Fresh Today' :
               harvestDayLabel === 'Tomorrow' ? 'Fresh Tomorrow' :
               harvestDayLabel === 'Yesterday' ? 'Harvested Yesterday' :
               `Harvest ${harvestDayLabel}`}
            </div>
          )}
        </div>

        {/* Size options if available - Responsive version */}
        {sizeOptions && (
          <div className={`mt-1 ${isUrgentHarvest ? 'mb-1' : 'mb-0.5'}`}>
            <div className={`font-medium mb-0.5 ${isUrgentHarvest ? 'text-sm' : 'text-xs'}`}>Size:</div>
            <div className="grid grid-cols-3 gap-0.5">
              {sizeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(option.id);
                  }}
                  className={`rounded text-center transition-colors ${
                    isUrgentHarvest ? 'p-1 text-sm' : 'p-0.5 text-xs'
                  } ${
                    selectedSize === option.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  <div className={`font-medium ${isUrgentHarvest ? 'text-sm' : 'text-xs'}`}>{option.label}</div>
                  <div className={`opacity-75 ${isUrgentHarvest ? 'text-xs' : 'text-[9px]'}`}>{option.weightRange}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Delivery Information - Responsive version */}
        <div className={`${sizeOptions ? 'pt-0.5' : 'pt-1'} w-full`}>
          <div className={`w-full rounded font-medium flex items-center justify-center ${
            isUrgentHarvest ? 'px-2 py-1 mb-2 text-sm' : 'px-1.5 py-0.5 mb-1 text-[9px]'
          } ${type === 'in-stock' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
            <Truck className={`mr-1 ${isUrgentHarvest ? 'w-4 h-4' : 'w-2.5 h-2.5'}`} />
            {getDeliveryInfo()}
          </div>

          {/* Add to Cart or Quantity Controls - Responsive version */}
          <div className="w-full">
          {showQuickAdd ? (
            <div className={`flex items-center justify-between bg-primary/10 rounded ${isUrgentHarvest ? 'p-2' : 'p-1'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decreaseQuantity(e);
                }}
                className={`rounded-full bg-white flex items-center justify-center text-primary border border-primary/20 ${
                  isUrgentHarvest ? 'w-8 h-8' : 'w-6 h-6'
                }`}
              >
                <Minus className={`${isUrgentHarvest ? 'w-4 h-4' : 'w-3 h-3'}`} />
              </button>

              <div className="flex flex-col items-center">
                <span className={`font-medium text-primary ${isUrgentHarvest ? 'text-sm' : 'text-xs'}`}>
                  {formatQuantityDisplay(orderQuantity)} {unit}
                </span>
                <span className={`text-primary/80 ${isUrgentHarvest ? 'text-xs' : 'text-[9px]'}`}>
                  ₹{(currentPrice * orderQuantity).toFixed(2)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  increaseQuantity(e);
                }}
                className={`rounded-full bg-white flex items-center justify-center text-primary border border-primary/20 ${
                  isUrgentHarvest ? 'w-8 h-8' : 'w-6 h-6'
                }`}
              >
                <Plus className={`${isUrgentHarvest ? 'w-4 h-4' : 'w-3 h-3'}`} />
              </button>
            </div>
          ) : (
            <motion.button
              onClick={handleAddToCart}
              className={`w-full rounded flex items-center justify-center font-medium transition-colors ${
                isUrgentHarvest ? 'py-2 text-sm' : 'py-1 text-xs'
              } ${
                addedToCart
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
              animate={{
                scale: addedToCart ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="flex items-center">
                <ShoppingBag className={`mr-1 ${isUrgentHarvest ? 'w-4 h-4' : 'w-3 h-3'} ${addedToCart ? 'animate-bounce' : ''}`} />
                {addedToCart ? 'Added!' : 'Add to Cart'}
              </span>
            </motion.button>
          )}
          </div>
        </div>

        {/* Quantity Error Message */}
        {quantityError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-full left-0 right-0 mt-1 bg-red-500 text-white rounded-lg shadow-lg z-10 ${
              isUrgentHarvest ? 'text-sm px-3 py-2' : 'text-xs px-2 py-1'
            }`}
          >
            {quantityError}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
