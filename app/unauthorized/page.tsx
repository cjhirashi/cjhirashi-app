/**
 * Unauthorized access page
 * Shown when users try to access pages they don't have permission for
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">403</h1>
        <h2 className="mb-4 text-2xl font-semibold">Acceso No Autorizado</h2>
        <p className="mb-8 text-muted-foreground">
          No tienes permisos para acceder a esta página. Si crees que esto es un error,
          contacta con el administrador del sistema.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Volver al Inicio</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">Ir al Panel Admin</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
