/**
 * Client-side test page for authorization hooks
 */

import { ClientAuthTest } from './client-auth-test'

export default function ClientAuthTestPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Test de Autorización (Cliente)</h1>
      <ClientAuthTest />
    </div>
  )
}
