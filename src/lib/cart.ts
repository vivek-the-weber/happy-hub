export interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
  quantity: number;
  storeId: string;
  storeName: string;
}

const CART_KEY = 'happy2buy_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function addToCart(item: Omit<CartItem, 'quantity'>): CartItem[] {
  const cart = getCart();
  const existingIndex = cart.findIndex(i => i.productId === item.productId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function updateCartQuantity(productId: string, quantity: number): CartItem[] {
  const cart = getCart();
  const index = cart.findIndex(i => i.productId === productId);
  
  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter(i => i.productId !== productId);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdated'));
  return cart;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cartUpdated'));
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
}

export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}
