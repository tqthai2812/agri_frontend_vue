import createApiClient from "./api.service";

class ArtisanService {
  constructor(baseURL = "/api/artisan") {
    this.api = createApiClient(baseURL);
  }

  async getAll() {
    return [
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
    ];
  }
}
export default new ArtisanService();
