import React from 'react';

interface PriceDisplayProps {
  price: number;
  mrp?: number;
  unit?: string;
  className?: string;
  showUnit?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ 
  price, 
  mrp, 
  unit, 
  className = '', 
  showUnit = true,
  size = 'md'
}: PriceDisplayProps) {
  // Determine if we should show MRP with strikethrough
  const shouldShowMRP = mrp && mrp > price;
  
  // Size-based styling
  const sizeClasses = {
    sm: {
      price: 'text-sm font-semibold',
      mrp: 'text-xs',
      unit: 'text-xs'
    },
    md: {
      price: 'text-base font-bold',
      mrp: 'text-sm',
      unit: 'text-sm'
    },
    lg: {
      price: 'text-lg font-bold',
      mrp: 'text-base',
      unit: 'text-base'
    }
  };

  const styles = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* MRP with strikethrough (only if different from price) */}
      {shouldShowMRP && (
        <span className={`text-gray-500 line-through ${styles.mrp}`}>
          ₹{mrp.toFixed(2)}
        </span>
      )}
      
      {/* Main price */}
      <span className={`text-primary-600 ${styles.price}`}>
        ₹{price.toFixed(2)}
        {showUnit && unit && (
          <span className={`font-normal text-gray-500 ml-1 ${styles.unit}`}>
            /{unit}
          </span>
        )}
      </span>
    </div>
  );
}
