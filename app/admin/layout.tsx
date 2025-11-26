'use client'

import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/admin/sidebar'
import { MobileSidebar } from '@/components/admin/mobile-sidebar'
import { Header } from '@/components/admin/header'
import { useUser } from '@/lib/auth/client'
import { useState, useEffect } from 'react'

/**
 * Admin Layout Client Component
 * Protects all routes under /admin with role-based access control
 *
 * NOTE: Server-side protection happens via:
 * 1. middleware.ts - protectAdminRoutes checks user role before layout loads
 * 2. requireModerator() - called in middleware for initial protection
 *
 * Client-side protection here provides additional safeguard during
 * client navigation and handles permission-based UI visibility.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, error } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  // Check authorization after loading is complete
  useEffect(() => {
    if (!loading) {
      setHasCheckedAuth(true)

      // If not authorized, redirect
      if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        router.replace('/unauthorized')
      }
    }
  }, [loading, user, router])

  // If user is still loading, show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  // If there was an error fetching user, show error state
  if (error && !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold mb-2">Error al cargar sesión</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Hubo un problema al verificar tu sesión. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Recargar Página
          </button>
        </div>
      </div>
    )
  }

  // Wait for auth check to complete before rendering layout
  if (!hasCheckedAuth) {
    return null
  }

  // If not authorized after check, don't render (will redirect)
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile Sidebar - Sheet/Drawer */}
      <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with breadcrumbs and user menu */}
        <Header
          showMenuButton
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
