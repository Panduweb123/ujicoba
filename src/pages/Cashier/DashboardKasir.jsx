import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../../supabaseClient";

export default function DashboardKasir() {
  const [antrean, setAntrean] = useState([]);
  const [pesananAktif, setPesananAktif] = useState(null);
  const [isMemproses, setIsMemproses] = useState(false); // 1. Ambil Data Antrean & Setup Real-time Supabase

  useEffect(() => {
    fetchAntrean();

    const channel = supabase
      .channel("notif-kasir")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pesanans" },
        (payload) => {
          // Tambahkan pesanan baru ke antrean teratas
          setAntrean((prev) => [payload.new, ...prev]);
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAntrean = async () => {
    const { data } = await supabase
      .from("pesanans")
      .select("*")
      .eq("status_bayar", "Pending")
      .order("created_at", { ascending: false });
    if (data) setAntrean(data);
  }; // 2. Setup Pemindai QR Code

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
        .select("*")
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
    } // Cleanup kamera saat halaman ditutup

    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Gagal mematikan kamera", error));
    };
  }, []); // 3. Proses Pembayaran Lunas

  const handleLunas = async () => {
    setIsMemproses(true);
    const { error } = await supabase
      .from("pesanans")
      .update({ status_bayar: "Lunas" })
      .eq("id", pesananAktif.id);

    if (!error) {
      alert("Pembayaran Berhasil! Struk siap dicetak.");
      setPesananAktif(null);
      fetchAntrean(); // Segarkan antrean di sebelah kiri
      // Refresh halaman untuk mereset kamera dengan bersih

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
    <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sisi Kiri: Daftar Antrean */}     {" "}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
               {" "}
        <div className="p-4 bg-gray-800 text-white font-bold text-lg">
                    Pesanan Masuk (Belum Bayar)        {" "}
        </div>
               {" "}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                   {" "}
          {antrean.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">
                            Belum ada antrean.            {" "}
            </p>
          ) : (
            antrean.map((order) => (
              <div
                key={order.id}
                className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded shadow-sm"
              >
                               {" "}
                <div className="flex justify-between items-center mb-1">
                                   {" "}
                  <span className="font-bold text-gray-800">
                                        {order.kode_pesanan}               
                     {" "}
                  </span>
                                   {" "}
                  <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                                        Meja {order.meja_id}               
                     {" "}
                  </span>
                                 {" "}
                </div>
                               {" "}
                <div className="font-bold text-orange-600">
                                    {formatRupiah(order.total_harga)}           
                     {" "}
                </div>
                             {" "}
              </div>
            ))
          )}
                 {" "}
        </div>
             {" "}
      </div>
            {/* Sisi Kanan: Area Pemindai & Pembayaran */}     {" "}
      <div className="w-2/3 p-6 flex flex-col items-center justify-center">
               {" "}
        {!pesananAktif ? (
          <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg text-center">
                       {" "}
            <h2 className="text-xl font-bold mb-4 text-gray-800">
                            Sorot QR Code Pelanggan            {" "}
            </h2>
                       {" "}
            <div
              id="reader"
              className="w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300"
            ></div>
                     {" "}
          </div>
        ) : (
          <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl text-center border-t-8 border-green-500">
                       {" "}
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {pesananAktif.kode_pesanan}           {" "}
            </h2>
                       {" "}
            <p className="text-gray-500 mb-6">
                            Meja Nomor {pesananAktif.meja_id}           {" "}
            </p>
                       {" "}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                           {" "}
              <p className="text-sm text-gray-500 mb-1">Total Tagihan Tunai</p> 
                         {" "}
              <p className="text-4xl font-black text-orange-600">
                                {formatRupiah(pesananAktif.total_harga)}       
                     {" "}
              </p>
                         {" "}
            </div>
                       {" "}
            <div className="flex gap-4">
                           {" "}
              <button
                onClick={() => window.location.reload()}
                className="w-1/3 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-300"
              >
                                Batal              {" "}
              </button>
                           {" "}
              <button
                onClick={handleLunas}
                disabled={isMemproses}
                className="w-2/3 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50"
              >
                               {" "}
                {isMemproses ? "Memproses..." : "TERIMA UANG & LUNAS"}         
                   {" "}
              </button>
                         {" "}
            </div>
                     {" "}
          </div>
        )}
             {" "}
      </div>
         {" "}
    </div>
  );
}
