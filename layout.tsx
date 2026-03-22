import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ColorMesh',
  description: 'Extract and sample colors from images with a customizable grid overlay',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/new-icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/new-icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/new-icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/new-apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
