import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function LaporanPenjualan() {
  const [pesanans, setPesanans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiwayatPesanan();
  }, []);

  const fetchRiwayatPesanan = async () => {
    const { data, error } = await supabase
      .from("pesanans")
      .select("*")
      .order("created_at", { ascending: false }); // Urutkan dari yang paling baru

    if (!error && data) {
      setPesanans(data);
    }
    setLoading(false);
  };

  // Menghitung statistik menggunakan JavaScript
  const pendapatanKotor = pesanans
    .filter((p) => p.status_bayar === "Lunas")
    .reduce((total, p) => total + p.total_harga, 0);

  const pesananSelesai = pesanans.filter(
    (p) => p.status_bayar === "Lunas",
  ).length;
  const pesananPending = pesanans.filter(
    (p) => p.status_bayar === "Pending",
  ).length;

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(angka);
  const formatDate = (tanggal) =>
    new Date(tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (loading) return <div className="p-8 text-center">Memuat Laporan...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Dasbor Penjualan
        </h1>

        {/* Area Kartu Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-500 font-semibold mb-1">
              Total Pendapatan (Lunas)
            </p>
            <p className="text-3xl font-black text-gray-800">
              {formatRupiah(pendapatanKotor)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 font-semibold mb-1">
              Pesanan Berhasil
            </p>
            <p className="text-3xl font-black text-gray-800">
              {pesananSelesai}{" "}
              <span className="text-sm font-normal text-gray-500">
                transaksi
              </span>
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <p className="text-sm text-gray-500 font-semibold mb-1">
              Pesanan Belum Dibayar
            </p>
            <p className="text-3xl font-black text-gray-800">
              {pesananPending}{" "}
              <span className="text-sm font-normal text-gray-500">antrean</span>
            </p>
          </div>
        </div>

        {/* Area Tabel Riwayat */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">
              Riwayat Transaksi Keseluruhan
            </h2>
            <button
              onClick={fetchRiwayatPesanan}
              className="text-sm text-blue-600 hover:underline"
            >
              ↻ Segarkan Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 border-b">Waktu Pesan</th>
                  <th className="p-4 border-b">Kode Pesanan</th>
                  <th className="p-4 border-b">Meja</th>
                  <th className="p-4 border-b">Total Belanja</th>
                  <th className="p-4 border-b">Metode</th>
                  <th className="p-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {pesanans.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 border-b border-gray-50"
                  >
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      {order.kode_pesanan}
                    </td>
                    <td className="p-4 text-gray-600">Meja {order.meja_id}</td>
                    <td className="p-4 font-bold text-gray-800">
                      {formatRupiah(order.total_harga)}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {order.metode_bayar}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${order.status_bayar === "Lunas" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {order.status_bayar}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pesanans.length === 0 && (
              <p className="text-center text-gray-500 p-8">
                Belum ada transaksi sama sekali.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
