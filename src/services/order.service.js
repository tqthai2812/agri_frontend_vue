import createApiClient from "./api.service";

class OrderService {
  constructor(baseURL = "/api/orders") {
    this.api = createApiClient(baseURL);
  }

  async getAll() {
    return [
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
    ];
  }
}
export default new OrderService();
