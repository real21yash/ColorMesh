import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'ColorMesh - Simple Color Extraction Tool',
  description: 'Extract, sample, and analyze colors from images with precision. Perfect for designers, developers, and creative professionals. Use our color picker and hex color sampler tool.',
  keywords: ['color picker', 'image color extractor', 'hex color sampler', 'color extraction', 'color analysis', 'design tool', 'color palette generator'],
  authors: [{ name: 'ColorMesh' }],
  creator: 'ColorMesh',
  publisher: 'ColorMesh',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  generator: 'Next.js',
  referrer: 'strict-origin-when-cross-origin',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    url: baseUrl,
    title: 'ColorMesh - AI-Powered Color Extraction Tool',
    description: 'Extract, sample, and analyze colors from images with precision. Perfect for designers and developers.',
    siteName: 'ColorMesh',
    locale: 'en_US',
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ColorMesh - Color Extraction Tool',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@colormesh',
    title: 'ColorMesh - AI-Powered Color Extraction Tool',
    description: 'Extract, sample, and analyze colors from images with precision.',
    images: [`${baseUrl}/og-image.png`],
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
}

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ColorMesh',
  description: 'AI-powered color extraction and analysis tool for designers and developers',
  url: baseUrl,
  applicationCategory: 'DesignApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  image: `${baseUrl}/og-image.png`,
  author: {
    '@type': 'Organization',
    name: 'ColorMesh',
    url: baseUrl,
  },
  potentialAction: {
    '@type': 'Action',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}`,
    },
    description: 'Extract colors from images',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
