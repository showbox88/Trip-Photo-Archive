import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    watch: {
      ignored: [
        '**/trip_database.json', 
        '**/test-photos/**',
        '**/*.json' // Aggressive: ignore all JSON changes to prevent DB-write reloads
      ]
    }
  }
});
