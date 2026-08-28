import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Cek PIN (Kamu bisa mengganti password ini sesukamu)
    if (pin === "kasir123") {
      localStorage.setItem("role", "kasir");
      navigate("/kasir");
    } else if (pin === "admin123") {
      localStorage.setItem("role", "admin");
      navigate("/admin/menu");
    } else {
      alert("PIN Salah! Akses ditolak.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100"
      >
        <h1 className="text-2xl font-black text-center mb-2 text-gray-800">
          Login Pegawai
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Masukkan PIN rahasia Anda
        </p>

        <input
          type="password"
          placeholder="••••••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full border-2 border-gray-200 p-4 rounded-xl mb-6 text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 active:scale-95"
        >
          Masuk
        </button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-6 text-gray-400 text-sm hover:text-gray-600 underline"
        >
          Kembali ke Layar Pelanggan
        </button>
      </form>
    </div>
  );
}
