// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    ['@nuxtjs/tailwindcss', { cssPath: '~/assets/styles/main.css' }],
    ['@nuxtjs/color-mode', {
      classSuffix: '',
      preference: 'system',
      fallback: 'light',
      storageKey: 'misel-color-mode',
    }],
    '@pinia/nuxt',
  ],

    devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  // NOTE: the Nuxt dev server above listens on 3000, and the NestJS backend's
  // own default port is also 3000 — run the backend on a different port
  // (e.g. PORT=3001) or override NUXT_PUBLIC_API_BASE to match.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://192.168.3.67:3001',
    },
  },

  vite: {
    server: {
      allowedHosts: [
        "https://elude-dice-flatbed.ngrok-free.dev"
      ],
    },
  },

  app: {
    head: {
      title: 'Misel Dashboard',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})

