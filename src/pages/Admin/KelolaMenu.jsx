import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function KelolaMenu() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  // State untuk form input
  const [namaMenu, setNamaMenu] = useState("");
  const [harga, setHarga] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    const { data, error } = await supabase
      .from("menus")
      .select("*")
      .order("id", { ascending: false });
    if (!error) setMenus(data);
  };

  const handleTambahMenu = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("menus").insert([
      {
        nama_menu: namaMenu,
        harga: parseInt(harga),
        foto: fotoUrl || null,
        status: "Tersedia",
      },
    ]);

    if (error) {
      alert("Gagal menambah menu: " + error.message);
    } else {
      alert("Menu berhasil ditambahkan!");
      setNamaMenu("");
      setHarga("");
      setFotoUrl("");
      fetchMenus(); // Segarkan tabel
    }
    setLoading(false);
  };

  const handleHapusMenu = async (id) => {
    if (window.confirm("Yakin ingin menghapus menu ini?")) {
      await supabase.from("menus").delete().eq("id", id);
      fetchMenus();
    }
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(angka);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto flex gap-8">
        {/* Sisi Kiri: Form Tambah Menu */}
        <div className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Tambah Menu Baru
          </h2>
          <form onSubmit={handleTambahMenu} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Menu
              </label>
              <input
                type="text"
                required
                value={namaMenu}
                onChange={(e) => setNamaMenu(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="Contoh: Nasi Goreng Spesial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga (Rp)
              </label>
              <input
                type="number"
                required
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="Contoh: 25000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Foto (Opsional)
              </label>
              <input
                type="text"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-blue-500"
                placeholder="https://link-gambar.com/foto.jpg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Menu"}
            </button>
          </form>
        </div>

        {/* Sisi Kanan: Tabel Daftar Menu */}
        <div className="w-2/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Daftar Menu Tersedia
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm">
                  <th className="p-3 border-b">Foto</th>
                  <th className="p-3 border-b">Nama Menu</th>
                  <th className="p-3 border-b">Harga</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr
                    key={menu.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <td className="p-3">
                      {menu.foto ? (
                        <img
                          src={menu.foto}
                          alt="menu"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          No Pic
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">
                      {menu.nama_menu}
                    </td>
                    <td className="p-3 text-orange-600 font-bold">
                      {formatRupiah(menu.harga)}
                    </td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {menu.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleHapusMenu(menu.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {menus.length === 0 && (
              <p className="text-center text-gray-500 mt-4">
                Belum ada data menu.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
