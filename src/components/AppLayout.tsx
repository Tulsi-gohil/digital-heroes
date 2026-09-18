'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const publicRoutes = new Set([
  '/',
  '/charities',
  '/subscribe',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/admin-signup',
])

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showShell = pathname === null || publicRoutes.has(pathname)

  return (
    <>
      {showShell && <Navbar />}
      <main className="flex-1">{children}</main>
      {showShell && <Footer />}
    </>
  )
}
