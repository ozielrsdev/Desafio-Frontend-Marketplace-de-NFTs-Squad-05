import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'public', 'playwright-report', 'test-results', '.agents', '.claude'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Componentes, hooks e Axios não podem depender dos mocks (README §6).
    files: ['src/contexts/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['@/mocks', '@/mocks/*'] }] },
  },
  {
    // Regra de dependência (AGENTS.md §3): domain é TS puro.
    files: ['src/contexts/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-*', 'axios', '@tanstack/*', 'socket.io-client', '@/mocks', '@/mocks/*'] },
      ],
    },
  },
)
