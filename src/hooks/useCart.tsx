import { useState, useEffect, useCallback } from 'react';
import { 
  CartItem, 
  getCart, 
  addToCart as addItem, 
  updateCartQuantity as updateQty,
  removeFromCart as removeItem,
  clearCart as clear,
  getCartTotal,
  getCartItemCount
} from '@/lib/cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const refreshCart = useCallback(() => {
    setCart(getCart());
  }, []);

  useEffect(() => {
    refreshCart();
    
    const handleCartUpdate = () => refreshCart();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [refreshCart]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    const newCart = addItem(item);
    setCart(newCart);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const newCart = updateQty(productId, quantity);
    setCart(newCart);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    const newCart = removeItem(productId);
    setCart(newCart);
  }, []);

  const clearCart = useCallback(() => {
    clear();
    setCart([]);
  }, []);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    total: getCartTotal(cart),
    itemCount: getCartItemCount(cart),
  };
}
