import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExecutaAi',
    short_name: 'ExecutaAi',
    description: 'Plataforma de IA All-in-One para criadores de conteúdo, afiliados, dropshippers e closers',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0284c7',
    icons: [
      {
        src: '/img/favicon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/img/favicon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/img/favicon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
} 