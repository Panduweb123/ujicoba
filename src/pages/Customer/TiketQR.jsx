import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";

export default function TiketQR() {
  const { kode } = useParams();
  const [pesanan, setPesanan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailPesanan();

    // DENGARKAN PERUBAHAN REAL-TIME DARI KASIR
    const channel = supabase
      .channel(`status-pesanan-${kode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pesanans",
          filter: `kode_pesanan=eq.${kode}`,
        },
        (payload) => {
          // Jika kasir mengubah status jadi Lunas, update state secara langsung
          setPesanan(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kode]);

  const fetchDetailPesanan = async () => {
    try {
      const { data, error } = await supabase
        .from("pesanans")
        .select("*")
        .eq("kode_pesanan", kode)
        .single();

      if (error) throw error;
      setPesanan(data);
    } catch (err) {
      console.error("Gagal memuat tiket:", err.message);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold">Memuat Tiket Pesanan...</p>
      </div>
    );
  }

  if (!pesanan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-xl font-bold text-red-600 mb-2">
          Tiket Tidak Ditemukan
        </h2>
        <p className="text-gray-500 mb-4">Pastikan kode pesanan sudah benar.</p>
        <Link
          to="/"
          className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold"
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  const isLunas = pesanan.status_bayar === "Lunas";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-6 text-center">
        {/* Indikator Status Pembayaran */}
        <div
          className={`py-3 px-4 rounded-2xl mb-6 font-bold flex items-center justify-center gap-2 ${
            isLunas
              ? "bg-green-100 text-green-700 border-2 border-green-500"
              : "bg-amber-100 text-amber-800 border-2 border-amber-400"
          }`}
        >
          <span className="text-xl">{isLunas ? "✅" : "⏳"}</span>
          <span>
            {isLunas
              ? "PEMBAYARAN BERHASIL (LUNAS)"
              : "MENUNGGU PEMBAYARAN KASIR"}
          </span>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-1">
          {pesanan.kode_pesanan}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Tunjukkan QR code ini ke kasir jika diperlukan
        </p>

        {/* Kotak QR Code */}
        <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-6">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${pesanan.kode_pesanan}`}
            alt="QR Code Pesanan"
            className="w-44 h-44 object-contain rounded-lg shadow-sm mb-3"
          />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Atas Nama: {pesanan.nama_pelanggan || "Pelanggan"}
          </span>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Metode Bayar:</span>
            <span className="font-bold text-gray-800">
              {pesanan.metode_bayar}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Tagihan:</span>
            <span className="font-black text-orange-600 text-base">
              {formatRupiah(pesanan.total_harga)}
            </span>
          </div>
        </div>

        {isLunas ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Pesananmu sedang disiapkan oleh dapur. Selamat menikmati!
            </p>
            <Link
              to="/"
              className="block w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition shadow-lg"
            >
              Pesan Lagi / Selesai
            </Link>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            Halaman ini akan otomatis berubah status begitu kasir memproses
            pembayaranmu.
          </p>
        )}
      </div>
    </div>
  );
}
