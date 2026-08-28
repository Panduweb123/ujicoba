import { useParams } from "react-router-dom";

export default function TiketQR() {
  const { kode } = useParams();
  // Menggunakan API pihak ketiga untuk generate gambar QR secara instan
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${kode}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Pesanan Diterima!
        </h2>
        <p className="text-gray-500 mb-6">
          Tunjukkan QR Code ini kepada kasir untuk melakukan pembayaran.
        </p>

        <div className="p-4 border-2 border-dashed border-gray-300 rounded-xl mb-4">
          <img src={qrImageUrl} alt="QR Code Tagihan" className="w-48 h-48" />
        </div>

        <p className="text-lg font-bold text-gray-800 mb-6">{kode}</p>

        <p className="text-sm text-gray-400">
          Harap jangan tutup halaman ini sebelum pembayaran selesai.
        </p>
      </div>
    </div>
  );
}
