import axios from 'axios'
import { normalizeError } from './errors'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

// Interceptor só normaliza erros: sem regra de negócio e sem respostas fictícias (ficam no MSW).
http.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(normalizeError(err)),
)
