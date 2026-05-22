import { defineStore } from "pinia";
import { ref } from "vue";

export const useAppStore = defineStore("app", () => {
  // ==========================================
  // 1. STATE (Định nghĩa bằng ref)
  // ==========================================
  const darkMode = ref(localStorage.getItem("darkMode") === "true");
  const sidebarCollapsed = ref(false);
  const mobileSidebarOpen = ref(false);
  const isMobile = ref(window.innerWidth < 1024);
  const currentPage = ref("dashboard");
  const showAddProduct = ref(false);
  const settingsTab = ref("profile");

  // Mock data giữ nguyên cấu trúc mảng của bạn
  const products = ref([
    {
      id: 1,
      name: "Kemeja Karawo Premium",
      sku: "KMJ-001",
      category: "Kemeja",
      price: 450000,
      stock: 24,
      status: "Aktif",
      color: "#fc1919",
    },
    {
      id: 2,
      name: "Selendang Motif Padi",
      sku: "SLD-001",
      category: "Selendang",
      price: 280000,
      stock: 18,
      status: "Aktif",
      color: "#28A745",
    },
    {
      id: 3,
      name: "Blouse Karawo Elegan",
      sku: "BLS-001",
      category: "Blouse",
      price: 380000,
      stock: 12,
      status: "Aktif",
      color: "#17A2B8",
    },
    {
      id: 4,
      name: "Tas Tangan Karawo",
      sku: "TAS-001",
      category: "Tas",
      price: 320000,
      stock: 8,
      status: "Aktif",
      color: "#FFC107",
    },
    {
      id: 5,
      name: "Sarung Karawo Tradisional",
      sku: "SRG-001",
      category: "Sarung",
      price: 420000,
      stock: 3,
      status: "Aktif",
      color: "#6C757D",
    },
    {
      id: 6,
      name: "Kemeja Anak Karawo",
      sku: "KMJ-002",
      category: "Kemeja",
      price: 250000,
      stock: 0,
      status: "Non-aktif",
      color: "#495057",
    },
    {
      id: 7,
      name: "Kerudung Sulam Karawo",
      sku: "KRD-001",
      category: "Aksesori",
      price: 180000,
      stock: 32,
      status: "Aktif",
      color: "#fc1919",
    },
    {
      id: 8,
      name: "Sepatu Motif Karawo",
      sku: "SPT-001",
      category: "Aksesori",
      price: 650000,
      stock: 6,
      status: "Aktif",
      color: "#17A2B8",
    },
    {
      id: 9,
      name: "Dompet Karawo Mini",
      sku: "DMP-001",
      category: "Tas",
      price: 120000,
      stock: 45,
      status: "Aktif",
      color: "#28A745",
    },
    {
      id: 10,
      name: "Blouse Casual Karawo",
      sku: "BLS-002",
      category: "Blouse",
      price: 310000,
      stock: 2,
      status: "Non-aktif",
      color: "#FFC107",
    },
  ]);

  const artisans = ref([
    {
      id: 1,
      name: "Ibu Fatimah",
      initials: "IF",
      color: "#fc1919",
      group: "Kelompok A",
      address: "Kota Gorontalo",
      phone: "081234567891",
      joined: "Jan 2020",
      products: 34,
      status: "Aktif",
    },
    {
      id: 2,
      name: "Ibu Siti Rahma",
      initials: "SR",
      color: "#28A745",
      group: "Kelompok B",
      address: "Bone Bolango",
      phone: "081234567892",
      joined: "Mar 2020",
      products: 28,
      status: "Aktif",
    },
    {
      id: 3,
      name: "Ibu Nur Hakim",
      initials: "NH",
      color: "#17A2B8",
      group: "Kelompok A",
      address: "Kota Gorontalo",
      phone: "081234567893",
      joined: "Jun 2020",
      products: 22,
      status: "Aktif",
    },
    {
      id: 4,
      name: "Ibu Hasna",
      initials: "HN",
      color: "#FFC107",
      group: "Kelompok C",
      address: "Gorontalo Utara",
      phone: "081234567894",
      joined: "Sep 2020",
      products: 19,
      status: "Cuti",
    },
    {
      id: 5,
      name: "Ibu Yanti",
      initials: "YT",
      color: "#6C757D",
      group: "Kelompok B",
      address: "Bone Bolango",
      phone: "081234567895",
      joined: "Dec 2020",
      products: 15,
      status: "Aktif",
    },
    {
      id: 6,
      name: "Ibu Mariati",
      initials: "MT",
      color: "#fc1919",
      group: "Kelompok C",
      address: "Gorontalo Utara",
      phone: "081234567896",
      joined: "Feb 2021",
      products: 12,
      status: "Non-aktif",
    },
    {
      id: 7,
      name: "Ibu Dian Sari",
      initials: "DS",
      color: "#28A745",
      group: "Kelompok A",
      address: "Kota Gorontalo",
      phone: "081234567897",
      joined: "Apr 2021",
      products: 27,
      status: "Aktif",
    },
    {
      id: 8,
      name: "Ibu Rini Harun",
      initials: "RH",
      color: "#17A2B8",
      group: "Kelompok D",
      address: "Pohuwato",
      phone: "081234567898",
      joined: "Jul 2021",
      products: 9,
      status: "Cuti",
    },
  ]);

  const orders = ref([
    {
      id: 1,
      invoice: "#INV-056",
      date: "15 Jan 2024",
      customer: "Ahmad Budi",
      city: "Jakarta",
      total: 900000,
      payment: "Transfer Bank",
      status: "Baru",
    },
    {
      id: 2,
      invoice: "#INV-055",
      date: "14 Jan 2024",
      customer: "Sari Dewi",
      city: "Surabaya",
      total: 560000,
      payment: "QRIS",
      status: "Diproses",
    },
    {
      id: 3,
      invoice: "#INV-054",
      date: "14 Jan 2024",
      customer: "Hendra Wijaya",
      city: "Bandung",
      total: 1250000,
      payment: "Transfer Bank",
      status: "Dikirim",
    },
    {
      id: 4,
      invoice: "#INV-053",
      date: "13 Jan 2024",
      customer: "Rina Mahendra",
      city: "Gorontalo",
      total: 420000,
      payment: "COD",
      status: "Selesai",
    },
    {
      id: 5,
      invoice: "#INV-052",
      date: "13 Jan 2024",
      customer: "Budi Santoso",
      city: "Medan",
      total: 780000,
      payment: "QRIS",
      status: "Selesai",
    },
    {
      id: 6,
      invoice: "#INV-051",
      date: "12 Jan 2024",
      customer: "Dewi Rahayu",
      city: "Makassar",
      total: 340000,
      payment: "Transfer Bank",
      status: "Dibatalkan",
    },
    {
      id: 7,
      invoice: "#INV-050",
      date: "12 Jan 2024",
      customer: "Rudi Hermawan",
      city: "Yogyakarta",
      total: 650000,
      payment: "QRIS",
      status: "Baru",
    },
    {
      id: 8,
      invoice: "#INV-049",
      date: "11 Jan 2024",
      customer: "Lina Susanti",
      city: "Semarang",
      total: 1100000,
      payment: "Transfer Bank",
      status: "Diproses",
    },
  ]);

  const inventory = ref([
    {
      id: 1,
      name: "Benang Sutra Merah",
      category: "Benang",
      stock: 15,
      unit: "Gulungan",
      minStock: 50,
      status: "Menipis",
    },
    {
      id: 2,
      name: "Benang Emas No.8",
      category: "Benang",
      stock: 30,
      unit: "Gulungan",
      minStock: 100,
      status: "Menipis",
    },
    {
      id: 3,
      name: "Kain Putih Halus",
      category: "Kain",
      stock: 2,
      unit: "Meter",
      minStock: 20,
      status: "Menipis",
    },
    {
      id: 4,
      name: "Benang Sutra Biru",
      category: "Benang",
      stock: 120,
      unit: "Gulungan",
      minStock: 50,
      status: "Aman",
    },
    {
      id: 5,
      name: "Kain Sutra Kuning",
      category: "Kain",
      stock: 0,
      unit: "Meter",
      minStock: 10,
      status: "Habis",
    },
    {
      id: 6,
      name: "Jarum Sulam No.12",
      category: "Aksesoris",
      stock: 200,
      unit: "Pcs",
      minStock: 50,
      status: "Aman",
    },
    {
      id: 7,
      name: "Benang Perak No.12",
      category: "Benang",
      stock: 25,
      unit: "Gulungan",
      minStock: 80,
      status: "Menipis",
    },
    {
      id: 8,
      name: "Kain Satin Putih",
      category: "Kain",
      stock: 45,
      unit: "Meter",
      minStock: 20,
      status: "Aman",
    },
  ]);

  const articles = ref([
    {
      id: 1,
      title: "Karawo: Warisan Budaya Gorontalo yang Mendunia",
      excerpt: "Sulaman karawo kini semakin dikenal...",
      category: "Karawo",
      date: "15 Jan 2024",
      views: 1240,
      status: "Published",
    },
    {
      id: 2,
      title: "Teknik Dasar Sulam Karawo untuk Pemula",
      excerpt: "Panduan lengkap memulai sulam karawo...",
      category: "Tutorial",
      date: "12 Jan 2024",
      views: 892,
      status: "Published",
    },
    {
      id: 3,
      title: "Koleksi Terbaru EVDesign 2024",
      excerpt: "Temukan inspirasi fashion terkini...",
      category: "Berita",
      date: "10 Jan 2024",
      views: 654,
      status: "Published",
    },
    {
      id: 4,
      title: "Perajin EVDesign Tampil di Jakarta Fashion Week",
      excerpt: "Kebanggaan Gorontalo tampil di panggung...",
      category: "Berita",
      date: "05 Jan 2024",
      views: 2341,
      status: "Published",
    },
    {
      id: 5,
      title: "Motif-motif Karawo dan Maknanya",
      excerpt: "Setiap motif memiliki filosofi mendalam...",
      category: "Karawo",
      date: "02 Jan 2024",
      views: 445,
      status: "Draft",
    },
    {
      id: 6,
      title: "Cara Merawat Kain Karawo agar Tetap Awet",
      excerpt: "Tips perawatan kain sulam...",
      category: "Tutorial",
      date: "30 Des 2023",
      views: 321,
      status: "Draft",
    },
  ]);

  const categories = ref([
    { id: 1, name: "Kemeja", count: 32, icon: "solar:t-shirt-bold-duotone" },
    { id: 2, name: "Blouse", count: 24, icon: "solar:t-shirt-2-bold-duotone" },
    { id: 3, name: "Selendang", count: 18, icon: "solar:layers-bold-duotone" },
    { id: 4, name: "Tas", count: 22, icon: "solar:bag-2-bold-duotone" },
    {
      id: 5,
      name: "Sarung",
      count: 15,
      icon: "solar:layers-minimalistic-bold-duotone",
    },
    { id: 6, name: "Aksesori", count: 13, icon: "solar:star-bold-duotone" },
  ]);

  // ==========================================
  // 2. ACTIONS (Định nghĩa bằng hàm function)
  // ==========================================
  function toggleDarkMode() {
    darkMode.value = !darkMode.value;
    localStorage.setItem("darkMode", darkMode.value);
    document.documentElement.classList.toggle("dark", darkMode.value);
  }

  function toggleSidebar() {
    if (isMobile.value) {
      mobileSidebarOpen.value = !mobileSidebarOpen.value;
    } else {
      sidebarCollapsed.value = !sidebarCollapsed.value;
    }
  }

  function setCurrentPage(page) {
    currentPage.value = page;
    if (isMobile.value) {
      mobileSidebarOpen.value = false;
    }
  }

  function handleResize() {
    const wasMobile = isMobile.value;
    isMobile.value = window.innerWidth < 1024;

    // Nếu chuyển từ mobile sang desktop, đóng mobile sidebar
    if (wasMobile && !isMobile.value) {
      mobileSidebarOpen.value = false;
    }
  }

  function init() {
    // Lắng nghe sự kiện resize
    window.addEventListener("resize", handleResize);

    // Khởi tạo trạng thái dark mode lên giao diện HTML
    if (darkMode.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function cleanup() {
    window.removeEventListener("resize", handleResize);
  }

  // ==========================================
  // 3. RETURN (Bắt buộc phải trả về để bên ngoài xài)
  // ==========================================
  return {
    // Return State
    darkMode,
    sidebarCollapsed,
    mobileSidebarOpen,
    isMobile,
    currentPage,
    products,
    artisans,
    orders,
    inventory,
    articles,
    categories,
    showAddProduct,
    settingsTab,

    // Return Actions
    toggleDarkMode,
    toggleSidebar,
    setCurrentPage,
    handleResize,
    init,
    cleanup,
  };
});
