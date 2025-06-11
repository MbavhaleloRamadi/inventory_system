import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost/api/",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  },
});

export default api;
