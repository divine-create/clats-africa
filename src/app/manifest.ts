import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CLATS - Tech Learning for Kids',
    short_name: 'CLATS',
    description: 'Building Tomorrow\'s Tech Minds Today! A fun and interactive platform for kids to learn coding, robotics, and digital skills.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#22d3ee',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo-3.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-3.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
