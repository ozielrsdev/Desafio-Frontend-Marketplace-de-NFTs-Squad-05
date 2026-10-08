import type { MockControl } from '../../src/mocks/control'

/** Tipagem da API de controle do mock (`window.__mocks`) dentro de page.evaluate. */
declare global {
  interface Window {
    __mocks?: MockControl
  }
}

export {}
