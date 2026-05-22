import createApiClient from "./api.service";

class ProductService {
  constructor(baseURL = "/api/products") {
    this.api = createApiClient(baseURL);
  }

  async getAll() {
    // Sau này thay bằng: return (await axios.get('/products')).data;
    return [
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
    ];
  }

  async getCategories() {
    return [
      { id: 1, name: "Kemeja", count: 32, icon: "solar:t-shirt-bold-duotone" },
      {
        id: 2,
        name: "Blouse",
        count: 24,
        icon: "solar:t-shirt-2-bold-duotone",
      },
      {
        id: 3,
        name: "Selendang",
        count: 18,
        icon: "solar:layers-bold-duotone",
      },
      { id: 4, name: "Tas", count: 22, icon: "solar:bag-2-bold-duotone" },
      {
        id: 5,
        name: "Sarung",
        count: 15,
        icon: "solar:layers-minimalistic-bold-duotone",
      },
      { id: 6, name: "Aksesori", count: 13, icon: "solar:star-bold-duotone" },
    ];
  }
}
export default new ProductService();
