import { createFileRoute } from '@tanstack/react-router'
import app from '../../server-api.ts'

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: async ({ request }) => app.fetch(request),
      POST: async ({ request }) => app.fetch(request),
      PUT: async ({ request }) => app.fetch(request),
      DELETE: async ({ request }) => app.fetch(request),
      PATCH: async ({ request }) => app.fetch(request),
    },
  },
})
