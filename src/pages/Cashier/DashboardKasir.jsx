import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../supabaseClient";

export default function DashboardKasir() {
  const [antrean, setAntrean] = useState([]);
  const [pesananDapur, setPesananDapur] = useState([]); // STATE BARU: Untuk pesanan yang sudah lunas
  const [pesananAktif, setPesananAktif] = useState(null);
  const [isMemproses, setIsMemproses] = useState(false);

  // 1. Ambil Data Antrean & Setup Real-time Supabase
  useEffect(() => {
    fetchAntrean();
    fetchDapur(); // Panggil data dapur saat halaman dimuat

    const channel = supabase
      .channel("notif-kasir")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pesanans" }, // Ubah ke "*" agar mendeteksi pembayaran lunas juga
        () => {
          fetchAntrean();
          fetchDapur();
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAntrean = async () => {
    const { data } = await supabase
      .from("pesanans")
      .select("*, mejas(nama_meja)")
      .eq("status_bayar", "Pending")
      .order("created_at", { ascending: false });
    if (data) setAntrean(data);
  };

  // FUNGSI BARU: Ambil pesanan Lunas beserta relasi ke tabel detail_pesanans dan menus
  const fetchDapur = async () => {
    const { data, error } = await supabase
      .from("pesanans")
      .select(
        `
        *,
        mejas(nama_meja),
        detail_pesanans (
          jumlah,
          menus (nama_menu, harga)
        )
      `,
      )
      .eq("status_bayar", "Lunas")
      .order("created_at", { ascending: false })
      .limit(15); // Batasi 15 pesanan terakhir agar tidak kepenuhan

    if (error) console.error("Error Dapur:", error.message);
    if (data) setPesananDapur(data);
  };

  // 2. Setup Pemindai QR Code
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, () => {});

    async function onScanSuccess(decodedText) {
      scanner.pause(); // Hentikan kamera sementara agar tidak scan berulang

      const { data, error } = await supabase
        .from("pesanans")
        .select("*, mejas(nama_meja)")
        .eq("kode_pesanan", decodedText)
        .single();

      if (data && data.status_bayar === "Pending") {
        setPesananAktif(data);
      } else if (data && data.status_bayar === "Lunas") {
        alert("Pesanan ini sudah lunas!");
        scanner.resume();
      } else {
        alert("Pesanan tidak ditemukan!");
        scanner.resume();
      }
    }

    // Cleanup kamera saat halaman ditutup
    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Gagal mematikan kamera", error));
    };
  }, []);

  // 3. Proses Pembayaran Lunas
  const handleLunas = async () => {
    setIsMemproses(true);
    const { error } = await supabase
      .from("pesanans")
      .update({ status_bayar: "Lunas" })
      .eq("id", pesananAktif.id);

    if (!error) {
      alert("Pembayaran Berhasil! Struk siap dicetak.");
      setPesananAktif(null);
      // Halaman di-reload untuk mereset kamera dengan bersih
      window.location.reload();
    }
    setIsMemproses(false);
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(angka);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      {/* KOLOM 1: Daftar Antrean (Belum Bayar) */}
      <div className="w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-gray-800 text-white font-bold">
          Menunggu Pembayaran
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {antrean.length === 0 ? (
            <p className="text-gray-500 text-center mt-10 text-sm">
              Belum ada antrean.
            </p>
          ) : (
            antrean.map((order) => (
              <div
                key={order.id}
                className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded shadow-sm text-sm"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800">
                    {order.kode_pesanan}
                  </span>
                  <span className="text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-bold">
                    {order.mejas?.nama_meja || `Meja ${order.meja_id}`}
                  </span>
                </div>
                <div className="font-bold text-orange-600">
                  {formatRupiah(order.total_harga)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* KOLOM 2: Monitor Dapur (Sudah Lunas, Siap Masak) */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col shadow-xl z-10">
        <div className="p-4 bg-emerald-600 text-white font-bold flex justify-between items-center">
          <span>Siap Masak & Antar</span>
          <span className="bg-emerald-800 text-xs px-2 py-1 rounded">
            LUNAS
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {pesananDapur.length === 0 ? (
            <p className="text-gray-500 text-center mt-10 text-sm">
              Belum ada pesanan yang siap dimasak.
            </p>
          ) : (
            pesananDapur.map((order) => (
              <div
                key={order.id}
                className="bg-white border-2 border-emerald-500 rounded-lg p-3 shadow-sm"
              >
                <div className="flex justify-between border-b border-gray-100 pb-2 mb-2">
                  <span className="font-black text-gray-800">
                    {order.kode_pesanan}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-black">
                    {order.mejas?.nama_meja || `Meja ${order.meja_id}`}
                  </span>
                </div>

                {/* Daftar Item Makanan */}
                <ul className="text-sm space-y-1.5 mb-3">
                  {order.detail_pesanans?.map((detail, idx) => (
                    <li
                      key={idx}
                      className="flex justify-between text-gray-700"
                    >
                      <span className="font-semibold">
                        <span className="text-emerald-600">
                          {detail.jumlah}x
                        </span>{" "}
                        {detail.menus?.nama_menu}
                      </span>
                      <span className="text-gray-500">
                        {formatRupiah(
                          (detail.menus?.harga || 0) * detail.jumlah,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="text-right font-black text-emerald-700 border-t border-gray-100 pt-2 text-sm">
                  Total: {formatRupiah(order.total_harga)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* KOLOM 3: Area Pemindai & Pembayaran (Scanner) */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-gray-100">
        {!pesananAktif ? (
          <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow-lg text-center">
            <h2 className="text-lg font-bold mb-4 text-gray-800">
              Sorot QR Code Pelanggan
            </h2>
            <div
              id="reader"
              className="w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
            ></div>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-2xl text-center border-t-8 border-green-500 transform transition-all">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {pesananAktif.kode_pesanan}
            </h2>
            <p className="text-gray-500 mb-6 font-semibold">
              {pesananAktif.mejas?.nama_meja ||
                `Meja Nomor ${pesananAktif.meja_id}`}
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Total Tagihan Tunai</p>
              <p className="text-4xl font-black text-orange-600">
                {formatRupiah(pesananAktif.total_harga)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-1/3 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleLunas}
                disabled={isMemproses}
                className="w-2/3 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-200"
              >
                {isMemproses ? "Memproses..." : "TERIMA UANG"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
