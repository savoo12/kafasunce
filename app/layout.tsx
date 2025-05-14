import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Belgrade Venues & Weather',
  description: 'Find the best cafes and pubs in Belgrade with real-time weather information',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50`}>
        <Script 
          src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
          strategy="beforeInteractive"
        />
        <Script 
          id="search-js" 
          defer 
          src="https://api.mapbox.com/search-js/v1.0.0/web.js"
          strategy="beforeInteractive"
          onLoad={() => window.dispatchEvent(new Event('mapbox-search-loaded'))}
        />
        {children}
      </body>
    </html>
  )
}
