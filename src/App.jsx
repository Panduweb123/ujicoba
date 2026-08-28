import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import KatalogMenu from "./pages/Customer/KatalogMenu";
import Keranjang from "./pages/Customer/Keranjang";
import TiketQR from "./pages/Customer/TiketQR";
import DashboardKasir from "./pages/Cashier/DashboardKasir";
import KelolaMenu from "./pages/Admin/KelolaMenu";
import KelolaMeja from "./pages/Admin/KelolaMeja";
import LaporanPenjualan from "./pages/Admin/LaporanPenjualan";

// KOMPONEN GEMBOK: Akan menendang user ke halaman Login jika belum masuk
const ProtectedRoute = ({ children, allowedRole }) => {
  const role = localStorage.getItem("role");
  if (role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <CartProvider>
        <Navbar />

        <Routes>
          {/* Rute Pelanggan (Bebas Diakses) */}
          <Route path="/" element={<KatalogMenu />} />
          <Route path="/keranjang" element={<Keranjang />} />
          <Route path="/tiket/:kode" element={<TiketQR />} />
          <Route path="/login" element={<Login />} />

          {/* Rute Khusus Kasir (Terkunci) */}
          <Route
            path="/kasir"
            element={
              <ProtectedRoute allowedRole="kasir">
                <DashboardKasir />
              </ProtectedRoute>
            }
          />

          {/* Rute Khusus Admin (Terkunci) */}
          <Route
            path="/admin/menu"
            element={
              <ProtectedRoute allowedRole="admin">
                <KelolaMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/meja"
            element={
              <ProtectedRoute allowedRole="admin">
                <KelolaMeja />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/laporan"
            element={
              <ProtectedRoute allowedRole="admin">
                <LaporanPenjualan />
              </ProtectedRoute>
            }
          />
        </Routes>
      </CartProvider>
    </Router>
  );
}

export default App;
