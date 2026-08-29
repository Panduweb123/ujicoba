import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function Keranjang() {
  const { cart, addToCart, decreaseQty, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [namaPelanggan, setNamaPelanggan] = useState("");

  // STATE BARU: Untuk memunculkan popup QRIS
  const [showQRIS, setShowQRIS] = useState(false);

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);

  // FUNGSI CHECKOUT GABUNGAN (Bisa Tunai, Bisa QRIS)
  const prosesCheckout = async (metode) => {
    if (!namaPelanggan.trim()) {
      alert("Halo! Tolong isi nama Anda terlebih dahulu sebelum membayar ya.");
      setShowQRIS(false); // Tutup QRIS jika nama belum diisi
      return;
    }

    setIsProcessing(true);
    try {
      const mejaIdTerdeteksi = localStorage.getItem("meja_id_aktif");

      if (!mejaIdTerdeteksi) {
        throw new Error(
          "Meja tidak terdeteksi! Silakan scan ulang QR Code di meja Anda.",
        );
      }

      const kodePesanan = "ORD-" + Math.floor(100000 + Math.random() * 900000);

      // Simpan ke database dengan metode pembayaran yang dipilih (Tunai / QRIS)
      const { data: pesanan, error: pesananError } = await supabase
        .from("pesanans")
        .insert([
          {
            kode_pesanan: kodePesanan,
            meja_id: parseInt(mejaIdTerdeteksi),
            nama_pelanggan: namaPelanggan,
            total_harga: totalPrice,
            metode_bayar: metode, // <--- Otomatis mendeteksi QRIS atau Tunai
            status_bayar: "Pending",
          },
        ])
        .select()
        .single();

      if (pesananError) throw pesananError;

      // Hapus data ini jika tidak punya tabel detail_pesanans.
      // Tapi jika punya, biarkan saja.
      const detailItems = cart.map((item) => ({
        pesanan_id: pesanan.id,
        menu_id: item.id,
        jumlah: item.qty,
        catatan: "-",
      }));

      const { error: detailError } = await supabase
        .from("detail_pesanans")
        .insert(detailItems);

      if (detailError) throw detailError;

      clearCart();
      // Opsional: localStorage.removeItem("meja_id_aktif"); (Bisa dihapus atau dibiarkan)
      navigate(`/tiket/${kodePesanan}`);
    } catch (error) {
      alert("Gagal memproses pesanan: " + error.message);
    } finally {
      setIsProcessing(false);
      setShowQRIS(false); // Tutup popup QRIS setelah selesai
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 relative z-0">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
          🛒
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Keranjangmu Kosong
        </h2>
        <p className="text-gray-500 mb-8 text-center">
          Kamu belum memilih hidangan apapun. Yuk lihat-lihat menu dulu!
        </p>
        <Link
          to="/"
          className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/30 active:scale-95"
        >
          Lihat Katalog Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-slate-50 min-h-screen pb-[320px]">
      {/* POPUP MODAL QRIS */}
      {showQRIS && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-gray-800">Scan QRIS</h3>
            <p className="text-gray-500 text-sm mb-4">
              Total tagihan:{" "}
              <strong className="text-orange-600">
                {formatRupiah(totalPrice)}
              </strong>
            </p>

            <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100 flex justify-center">
              {/* NANTI GANTI LINK GAMBAR INI DENGAN SCREENSHOT BARCODE QRIS TOKOMU */}
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg"
                alt="QRIS Toko"
                className="w-48 h-48 object-contain mix-blend-multiply opacity-80"
              />
            </div>

            <button
              onClick={() => prosesCheckout("QRIS")}
              disabled={isProcessing}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mb-3 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
            >
              {isProcessing ? "Memproses..." : "✅ Saya Sudah Bayar"}
            </button>
            <button
              onClick={() => setShowQRIS(false)}
              disabled={isProcessing}
              className="w-full bg-gray-100 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* HEADER KERANJANG */}
      <div className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors font-bold text-xl"
        >
          ←
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">
          Keranjang Pesanan
        </h1>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              {item.foto ? (
                <img
                  src={item.foto}
                  alt={item.nama_menu}
                  className="w-16 h-16 object-cover rounded-xl border border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400">
                  No Pic
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {item.nama_menu}
                </h3>
                <p className="text-orange-500 font-bold">
                  {formatRupiah(item.harga)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3 bg-gray-50 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => decreaseQty(item.id)}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-lg font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
              >
                -
              </button>
              <span className="font-bold w-6 sm:w-8 text-center text-gray-900">
                {item.qty}
              </span>
              <button
                onClick={() => addToCart(item)}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-900 rounded-lg shadow-sm text-lg font-bold text-white hover:bg-gray-800 active:scale-95 transition-all"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-3xl mx-auto bg-white p-6 border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl z-40">
        {/* INPUT NAMA PELANGGAN */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Pesanan Atas Nama:
          </label>
          <input
            type="text"
            placeholder="Contoh: Budi"
            value={namaPelanggan}
            onChange={(e) => setNamaPelanggan(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        <div className="flex justify-between items-end mb-4">
          <span className="text-gray-500 font-semibold">Total Tagihan:</span>
          <span className="text-3xl font-black text-orange-600">
            {formatRupiah(totalPrice)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => {
              if (!namaPelanggan.trim()) {
                alert("Isi nama dulu ya!");
                return;
              }
              setShowQRIS(true);
            }}
            className="bg-blue-50 text-blue-700 border-2 border-blue-600 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 hover:text-white transition-colors flex justify-center items-center gap-2"
          >
            📱 Bayar QRIS
          </button>

          <button
            onClick={() => prosesCheckout("Tunai")}
            disabled={isProcessing}
            className="bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isProcessing && !showQRIS ? "Memproses..." : "💵 Bayar Tunai"}
          </button>
        </div>
      </div>
    </div>
  );
}
