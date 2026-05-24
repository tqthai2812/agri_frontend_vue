import axios from "axios";

const commonConfig = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
};

export default function createApiClient(baseURL = "") {
  return axios.create({
    baseURL,
    ...commonConfig,
  });
}
