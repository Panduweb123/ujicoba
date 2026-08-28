import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function KelolaMeja() {
  const [mejas, setMejas] = useState([]);
  const [loading, setLoading] = useState(false);

  // URL utama aplikasi kamu
  const baseUrl = "http://localhost:5173";

  useEffect(() => {
    fetchMejas();
  }, []);

  const fetchMejas = async () => {
    // Mengambil data dan mengurutkannya berdasarkan waktu pembuatan
    const { data } = await supabase
      .from("mejas")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setMejas(data);
  };

  const handleTambahMejaOtomatis = async () => {
    setLoading(true);

    // 1. Mencari angka terakhir dari daftar meja yang ada
    let angkaSelanjutnya = 1;

    if (mejas.length > 0) {
      const kumpulanAngka = mejas.map((meja) => {
        // Mengambil angka dari format MAW-XX
        const potongan = meja.nomor_meja.match(/MAW-(\d+)/);
        return potongan ? parseInt(potongan[1]) : 0;
      });

      // Jika ada angka yang ditemukan, ambil yang paling besar dan tambah 1
      if (kumpulanAngka.length > 0) {
        angkaSelanjutnya = Math.max(...kumpulanAngka) + 1;
      }
    }

    // 2. Format menjadi MAW-01, MAW-02, dst. (tambah angka 0 di depan jika di bawah 10)
    const nomorMejaBaru = `MAW-${String(angkaSelanjutnya).padStart(2, "0")}`;

    // 3. Buat token rahasia untuk QR
    const tokenQr = "mj-" + Math.random().toString(36).substr(2, 5);

    // 4. Simpan otomatis ke Supabase
    const { error } = await supabase
      .from("mejas")
      .insert([{ nomor_meja: nomorMejaBaru, token_qr: tokenQr }]);

    if (!error) {
      fetchMejas();
    } else {
      alert("Gagal menambah meja: " + error.message);
    }

    setLoading(false);
  };

  const hapusMeja = async (id) => {
    if (window.confirm("Hapus meja ini?")) {
      await supabase.from("mejas").delete().eq("id", id);
      fetchMejas();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* AREA ADMIN (Sembunyikan saat dicetak) */}
      <style>{`
        @media print {
          .print-sembunyi { display: none !important; }
          body { background-color: white !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto print-sembunyi">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Meja & QR Code
          </h1>
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md flex gap-2 items-center"
          >
            🖨️ Cetak Semua QR
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">
              Generator Meja Otomatis
            </h2>
            <p className="text-sm text-gray-500">
              Sistem akan membuat nama meja secara berurutan (MAW-01, MAW-02,
              dst).
            </p>
          </div>
          <button
            onClick={handleTambahMejaOtomatis}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
          >
            {loading ? "Membuat..." : "+ Generate 1 Meja Baru"}
          </button>
        </div>
      </div>

      {/* AREA CETAK (Grid QR Code) */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:w-full print:m-0">
        {mejas.map((meja) => {
          const linkPesan = `${baseUrl}/?meja=${meja.id}&token=${meja.token_qr}`;
          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkPesan)}`;

          return (
            <div
              key={meja.id}
              className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center text-center relative print:border-black print:break-inside-avoid shadow-sm"
            >
              <button
                onClick={() => hapusMeja(meja.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold print-sembunyi bg-red-50 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ✕
              </button>

              <h2 className="text-2xl font-black text-gray-800 mb-1">
                {meja.nomor_meja}
              </h2>
              <p className="text-xs text-gray-500 mb-4 print:text-black">
                Scan untuk memesan makanan
              </p>

              <img
                src={qrImageUrl}
                alt={`QR ${meja.nomor_meja}`}
                className="w-40 h-40 mb-4"
              />

              <p className="text-[10px] text-gray-400 font-mono break-all px-2">
                {linkPesan}
              </p>
            </div>
          );
        })}
        {mejas.length === 0 && (
          <div className="col-span-3 text-center text-gray-500 py-10 print-sembunyi">
            Belum ada meja yang di-generate. Klik tombol pembuat meja di atas.
          </div>
        )}
      </div>
    </div>
  );
}
