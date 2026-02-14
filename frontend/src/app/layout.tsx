import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://credi-red.vercel.app'),
  title: 'CrediRed - Gestión de Ventas y Créditos',
  description:
    'Controla tus ventas a crédito y fiado. Registra quién te debe, cuánto y cuándo vence. Maneja tu red de vendedores por niveles. Funciona en dólares, pesos colombianos y bolívares.',
  keywords: [
    'ventas a crédito',
    'fiado',
    'cobros',
    'red de ventas',
    'catálogo',
    'gestión de créditos',
    'Venezuela',
    'Colombia',
  ],
  openGraph: {
    title: 'CrediRed - Gestión de Ventas y Créditos',
    description:
      'Controla tus ventas a crédito y fiado. Registra quién te debe, cuánto y cuándo vence.',
    url: 'https://credi-red.vercel.app',
    siteName: 'CrediRed',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'CrediRed - Gestión de Ventas y Créditos',
      },
    ],
    locale: 'es_LA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CrediRed - Gestión de Ventas y Créditos',
    description:
      'Controla tus ventas a crédito y fiado. Registra quién te debe, cuánto y cuándo vence.',
    images: ['/api/og'],
  },
  icons: {
    icon: '/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
