/**
 * Destino de retorno após login (docs/specs/identity.md): somente caminhos internos,
 * evitando open redirect. Rotas de autenticação não são destinos válidos.
 */
export const DEFAULT_RETURN_TO = '/'
const AUTH_PATHS = ['/login', '/cadastro']

export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return DEFAULT_RETURN_TO
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return DEFAULT_RETURN_TO
  if ([...value].some((char) => char.charCodeAt(0) < 0x20)) return DEFAULT_RETURN_TO
  let url: URL
  try {
    url = new URL(value, 'https://app.invalid')
  } catch {
    return DEFAULT_RETURN_TO
  }
  if (url.origin !== 'https://app.invalid') return DEFAULT_RETURN_TO
  if (AUTH_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(`${path}/`))) return DEFAULT_RETURN_TO
  return `${url.pathname}${url.search}${url.hash}`
}
