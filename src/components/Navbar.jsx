import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // SEMBUNYIKAN NAVBAR JIKA:
  // 1. Tidak ada role (Berarti dia Pelanggan)
  // 2. Berada di halaman utama pelanggan, keranjang, tiket, atau halaman login
  if (
    !role ||
    location.pathname === "/" ||
    location.pathname === "/keranjang" ||
    location.pathname.startsWith("/tiket") ||
    location.pathname === "/login"
  ) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("role"); // Hapus sesi login
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md print:hidden sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          {/* Tampilkan menu ini HANYA jika login sebagai KASIR */}
          {role === "kasir" && (
            <Link
              to="/kasir"
              className="px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              💻 Dasbor Kasir
            </Link>
          )}

          {/* Tampilkan menu ini HANYA jika login sebagai ADMIN */}
          {role === "admin" && (
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1.5 border border-gray-700">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider px-2 hidden sm:block">
                Admin:
              </span>
              <Link
                to="/admin/menu"
                className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                🍔 Menu
              </Link>
              <Link
                to="/admin/meja"
                className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                🪑 Meja
              </Link>
              <Link
                to="/admin/laporan"
                className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                📈 Laporan
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-bold transition-colors"
        >
          Keluar
        </button>
      </div>
    </nav>
  );
}
