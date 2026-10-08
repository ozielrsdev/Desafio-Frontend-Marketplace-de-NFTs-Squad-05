import axios from 'axios'

/** Instância única de Axios. Interceptors só para auth/erros normalizados (a cargo do Identity). */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})
