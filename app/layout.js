import './globals.css'
import { AuthProvider } from '@/lib/auth/context'

export const metadata = {
  title: 'DocForge AI — AI-Powered Documentation Generator',
  description: 'Transform any GitHub repository into beautiful, comprehensive documentation instantly with DeepSeek AI.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
