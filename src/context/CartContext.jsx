import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (menu) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menu.id);
      if (existingItem) {
        // Jika sudah ada di keranjang, tambah qty saja
        return prevCart.map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      // Jika menu baru, masukkan dengan qty 1
      return [...prevCart, { ...menu, qty: 1 }];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // Fungsi untuk mengurangi jumlah atau menghapus jika qty = 1
  const decreaseQty = (id) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.harga * item.qty, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
