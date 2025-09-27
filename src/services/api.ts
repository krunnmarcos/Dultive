import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.6:5000/api';

if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('EXPO_PUBLIC_API_URL não definido. Usando endereço local padrão para a API.');
}

const api = axios.create({
  baseURL,
});

export default api;
