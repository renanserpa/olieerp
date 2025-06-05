import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/auth-context'
import { ProvidersWrapper } from '@/contexts/providers-wrapper'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Olie ERP',
  description: 'Sistema de gestão empresarial para Olie Ateliê',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ProvidersWrapper>
            {children}
            <Toaster />
          </ProvidersWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
