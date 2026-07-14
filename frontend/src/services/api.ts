import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3333",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Erro na chamada à API:", error?.message ?? error);
    return Promise.reject(error);
  }
);
