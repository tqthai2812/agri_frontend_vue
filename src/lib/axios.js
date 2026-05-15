import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000", // URL mặc định của Laravel
  withCredentials: true, // Bắt buộc để Laravel nhận diện Session/Cookie
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

export default axiosClient;
