import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RBAC Auth Service',
  description: 'Servicio de autenticación y autorización RBAC para aplicaciones externas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}