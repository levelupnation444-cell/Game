import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      server: {
        preset: process.env.VERCEL ? 'vercel' : 'node',
        noExternal: true, // bundle all npm deps into server.js
      },
    }),
    viteReact(),
  ],
})

export default config
