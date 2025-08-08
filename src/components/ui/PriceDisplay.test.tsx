import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriceDisplay } from './PriceDisplay';

describe('PriceDisplay', () => {
  test('displays only price when MRP is not provided', () => {
    render(<PriceDisplay price={100} unit="kg" />);
    
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getByText('/kg')).toBeInTheDocument();
    expect(screen.queryByText('line-through')).not.toBeInTheDocument();
  });

  test('displays only price when MRP equals price', () => {
    render(<PriceDisplay price={100} mrp={100} unit="kg" />);
    
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getByText('/kg')).toBeInTheDocument();
    expect(screen.queryByText('line-through')).not.toBeInTheDocument();
  });

  test('displays both MRP and price when MRP is higher than price', () => {
    render(<PriceDisplay price={80} mrp={100} unit="kg" />);
    
    expect(screen.getByText('₹80.00')).toBeInTheDocument();
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getByText('/kg')).toBeInTheDocument();
  });

  test('does not display MRP when MRP is lower than price', () => {
    render(<PriceDisplay price={100} mrp={80} unit="kg" />);
    
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getByText('/kg')).toBeInTheDocument();
    expect(screen.queryByText('₹80.00')).not.toBeInTheDocument();
  });

  test('hides unit when showUnit is false', () => {
    render(<PriceDisplay price={100} unit="kg" showUnit={false} />);
    
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.queryByText('/kg')).not.toBeInTheDocument();
  });

  test('applies correct size classes', () => {
    const { container } = render(<PriceDisplay price={100} size="lg" />);
    
    expect(container.querySelector('.text-lg')).toBeInTheDocument();
  });
});
