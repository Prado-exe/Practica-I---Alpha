import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // ✅ Asegúrate de que esta ruta coincida exactamente con tu carpeta actual
    setupFiles: ['./tests/vitest.setup.js'], 
    globals: true,
    // ✅ Mantiene los mocks limpios entre cada test automáticamente
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    // ✅ Evita el warning de esbuild forzando la compatibilidad con Vitest 3
    deps: {
      optimizer: {
        web: {
          enabled: true,
        },
      },
    },
    // ✅ Opcional: Excluye los tests de Playwright para que Vitest no intente ejecutarlos
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  },
})