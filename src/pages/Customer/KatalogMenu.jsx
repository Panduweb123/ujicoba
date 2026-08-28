import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useCart } from "../../context/CartContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function KatalogMenu() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [namaMeja, setNamaMeja] = useState(""); // Menyimpan nama meja seperti MAW-01

  const { addToCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Alat untuk membaca URL

  useEffect(() => {
    fetchMenus();
    deteksiMejaQR(); // Jalankan fungsi deteksi meja saat halaman dimuat
  }, []);

  const deteksiMejaQR = async () => {
    // Menangkap angka dari URL (misal: localhost:5173/?meja=2)
    const mejaIdParam = searchParams.get("meja");

    if (mejaIdParam) {
      // Jika dari hasil scan QR, simpan ID mejanya ke memori browser
      localStorage.setItem("meja_id_aktif", mejaIdParam);

      // Ambil nama meja (MAW-XX) dari database Supabase
      const { data } = await supabase
        .from("mejas")
        .select("nomor_meja")
        .eq("id", mejaIdParam)
        .single();
      if (data) {
        setNamaMeja(data.nomor_meja);
        localStorage.setItem("nama_meja_aktif", data.nomor_meja);
      }
    } else {
      // Jika pelanggan hanya refresh halaman (tanpa scan QR ulang), ambil dari memori
      const savedNama = localStorage.getItem("nama_meja_aktif");
      if (savedNama) setNamaMeja(savedNama);
    }
  };

  const fetchMenus = async () => {
    try {
      const { data, error } = await supabase
        .from("menus")
        .select("*")
        .eq("status", "Tersedia");
      if (error) throw error;
      setMenus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 animate-pulse">
        Memuat hidangan spesial...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto bg-slate-50 min-h-screen pb-32">
      {/* Header Aplikasi dengan Indikator Meja */}
      <div className="bg-white/80 backdrop-blur-md p-5 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Katalog Menu
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Pilih hidangan favoritmu hari ini
          </p>
        </div>

        {/* Akan muncul jika pelanggan men-scan QR code */}
        {namaMeja ? (
          <div className="bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">
              Meja Anda
            </p>
            <p className="text-xl font-black text-orange-700">{namaMeja}</p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg text-center">
            <p className="text-xs text-red-500 font-bold">
              ⚠️ Scan QR Meja Dulu
            </p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col"
          >
            <div className="h-48 sm:h-56 bg-gray-100 w-full overflow-hidden relative">
              {menu.foto ? (
                <img
                  src={menu.foto}
                  alt={menu.nama_menu}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex justify-center items-center text-gray-400">
                  Piring Kosong
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                Tersedia
              </div>
            </div>

            <div className="p-5 flex flex-col flex-grow justify-between bg-white">
              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 group-hover:text-orange-600 transition-colors">
                  {menu.nama_menu}
                </h3>
                <p className="text-orange-500 font-extrabold text-xl">
                  {formatRupiah(menu.harga)}
                </p>
              </div>

              <button
                onClick={() => {
                  if (!namaMeja)
                    alert(
                      "Silakan Scan QR Code yang ada di meja terlebih dahulu sebelum memesan!",
                    );
                  else addToCart(menu);
                }}
                className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-orange-600 active:scale-95 transition-all shadow-md hover:shadow-orange-500/30"
              >
                + Masukkan Keranjang
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4 z-50">
          <button
            onClick={() => navigate("/keranjang")}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center font-bold transition-all active:scale-95 ring-4 ring-orange-600/20"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white text-orange-600 px-3 py-1.5 rounded-lg text-sm">
                {totalItems} Item
              </span>
              <span className="text-lg">{formatRupiah(totalPrice)}</span>
            </div>
            <span className="flex items-center gap-2">
              Checkout <span className="text-xl">➔</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
