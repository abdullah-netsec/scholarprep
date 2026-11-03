import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const hasPrivateBank = (file) => fs.existsSync(path.resolve(process.cwd(), 'src/data', file));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      ...(hasPrivateBank('quantQuestions.js') ? [] : [{
        find: /.*\/data\/quantQuestions\.js$/,
        replacement: path.resolve(process.cwd(), 'src/data/quantQuestions.sample.js')
      }]),
      ...(hasPrivateBank('verbalQuestions.js') ? [] : [{
        find: /.*\/data\/verbalQuestions\.js$/,
        replacement: path.resolve(process.cwd(), 'src/data/verbalQuestions.sample.js')
      }]),
      ...(hasPrivateBank('nov2Leaks.js') ? [] : [{
        find: /.*\/data\/nov2Leaks\.js$/,
        replacement: path.resolve(process.cwd(), 'src/data/nov2Leaks.sample.js')
      }])
    ]
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/react-pdf')) {
            return 'pdfjs';
          }
          if (id.includes('src/data/quantQuestions')) {
            return 'quant-bank';
          }
          if (id.includes('src/data/verbalQuestions')) {
            return 'verbal-bank';
          }
        }
      }
    }
  }
});
