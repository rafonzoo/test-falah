import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const interSans = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Joicè | Easiest way to team up',
  description: 'Join or create a room to chat and video call with your team.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${interSans.variable} antialiased`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          value={{
            light: 'light',
            dark: 'dark',
          }}
        >
          <div className='h-screen'>{children}</div>
        </ThemeProvider>
      </body>
    </html>
  )
}
