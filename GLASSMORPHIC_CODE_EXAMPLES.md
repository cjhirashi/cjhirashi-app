# Glassmorphic Design - Code Examples & Patterns

## Patrones Reutilizables

### 1. Card Container Glassmorphic

Para cualquier contenedor principal que necesite el efecto glassmorphic:

```tsx
// Basic card
<div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
  <div className="p-8">
    {/* Content */}
  </div>
</div>

// Card con header
<div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/20 p-6">
    <h2 className="text-2xl font-bold text-cyan-100">Title</h2>
  </div>
  <div className="p-8">
    {/* Content */}
  </div>
</div>

// Card compacta (sin padding máximo)
<div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 backdrop-blur-lg p-4 shadow-lg">
  {/* Content */}
</div>
```

### 2. Input Field Styled

Para todos los inputs de texto:

```tsx
// Email input
<input
  type="email"
  placeholder="you@example.com"
  className="w-full bg-slate-800/50 border border-cyan-500/30 text-cyan-100
    placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-1
    focus:ring-cyan-400/20 rounded-lg px-4 py-2 transition-all duration-200"
/>

// Password input
<input
  type="password"
  placeholder="••••••••"
  className="w-full bg-slate-800/50 border border-cyan-500/30 text-cyan-100
    placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-1
    focus:ring-cyan-400/20 rounded-lg px-4 py-2 transition-all duration-200"
/>

// Textarea
<textarea
  placeholder="Enter your message..."
  className="w-full bg-slate-800/50 border border-cyan-500/30 text-cyan-100
    placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-1
    focus:ring-cyan-400/20 rounded-lg px-4 py-2 transition-all duration-200 resize-none"
/>
```

### 3. Button Styles

```tsx
// Primary button (gradient cyan->blue)
<button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600
  hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-lg
  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
  Action
</button>

// Secondary button (border)
<button className="border border-cyan-500/50 bg-slate-900/50 hover:bg-slate-800/50
  text-cyan-300 hover:text-cyan-200 font-semibold py-2 px-6 rounded-lg
  transition-all duration-200">
  Secondary
</button>

// Danger button (red gradient)
<button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600
  hover:to-orange-600 text-white font-semibold py-2 px-6 rounded-lg
  transition-all duration-200">
  Delete
</button>

// Button with icon
<button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500
  hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 px-6 rounded-lg">
  <IconComponent className="w-4 h-4" />
  Action
</button>

// Button with loading state
<button disabled className="flex items-center justify-center gap-2
  bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-2 px-6 rounded-lg">
  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2
    border-transparent border-t-white border-r-white" />
  Loading...
</button>

// Full width button
<button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600
  hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200">
  Full Width Action
</button>
```

### 4. Title & Heading Styles

```tsx
// Main page title (large with gradient)
<h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r
  from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
  Welcome Back
</h1>

// Section title
<h2 className="text-3xl font-bold text-cyan-100">
  Get Started
</h2>

// Form label
<label className="text-cyan-100 font-medium">
  Email Address
</label>

// Subtitle
<p className="text-cyan-300/60 text-sm">
  Enter your credentials to access your account
</p>

// Error message
<p className="text-sm text-red-300">
  Error: Something went wrong
</p>

// Success message
<p className="text-sm text-green-300">
  Success: Operation completed
</p>
```

### 5. Divider with Gradient

Para separar secciones:

```tsx
// Horizontal divider
<div className="my-6 h-px bg-gradient-to-r from-cyan-500/20 via-cyan-500/5 to-transparent" />

// Divider with text
<div className="my-6 flex items-center gap-3">
  <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
  <span className="text-xs text-cyan-300/50 uppercase tracking-wider">Or</span>
  <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
</div>

// Section divider
<div className="my-12 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
```

### 6. Alert/Message Boxes

```tsx
// Success alert
<div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
  <p className="text-sm text-green-300">
    Success! Your operation completed successfully.
  </p>
</div>

// Error alert
<div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
  <p className="text-sm text-red-300">
    Error! Something went wrong.
  </p>
</div>

// Warning alert
<div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
  <p className="text-sm text-orange-300">
    Warning! Please review this carefully.
  </p>
</div>

// Info alert
<div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
  <p className="text-sm text-cyan-300">
    Info: This is informational content.
  </p>
</div>
```

### 7. Link Styles

```tsx
// Standard link (cyan with underline on hover)
<a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
  Link text
</a>

// Link with icon
<a href="#" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
  <IconComponent className="w-4 h-4" />
  Link with icon
</a>

// Inline link (in paragraph)
<p>
  Some text with <a href="#" className="text-cyan-400 hover:underline">
    inline link
  </a> in it.
</p>

// Navigation link (bold)
<a href="#" className="font-semibold text-cyan-400 hover:text-cyan-300">
  Navigation Link
</a>
```

### 8. Layout Backgrounds

```tsx
// Page background
<div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
  {/* Grid SVG */}
  <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center
    [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

  {/* Animated blobs */}
  <div className="fixed top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full
    mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
  <div className="fixed top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full
    mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
  <div className="fixed -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full
    mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

  {/* Content */}
  <div className="relative z-10">
    {/* ... */}
  </div>
</div>

// Navbar background
<nav className="backdrop-blur-sm bg-slate-900/30 border-b border-cyan-500/20">
  {/* ... */}
</nav>
```

### 9. Grid/Flex Layouts

```tsx
// Form grid (2 columns on desktop)
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Form fields */}
</div>

// Card grid (3 columns on desktop)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Flex buttons (responsive)
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <button>...</button>
  <button>...</button>
</div>

// Flex with space-between
<div className="flex items-center justify-between">
  <span>Label</span>
  <span>Value</span>
</div>
```

### 10. Form Complete Example

```tsx
<div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
  <div className="p-8">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500
        bg-clip-text text-transparent mb-2">
        Form Title
      </h1>
      <p className="text-cyan-300/60 text-sm">
        Form description
      </p>
    </div>

    {/* Form */}
    <form className="space-y-6">
      {/* Field 1 */}
      <div className="space-y-2">
        <label className="text-cyan-100 font-medium">
          Field Label
        </label>
        <input
          type="text"
          placeholder="Placeholder..."
          className="w-full bg-slate-800/50 border border-cyan-500/30 text-cyan-100
            placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-1
            focus:ring-cyan-400/20 rounded-lg px-4 py-2"
        />
      </div>

      {/* Field 2 */}
      <div className="space-y-2">
        <label className="text-cyan-100 font-medium">
          Another Field
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full bg-slate-800/50 border border-cyan-500/30 text-cyan-100
            placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-1
            focus:ring-cyan-400/20 rounded-lg px-4 py-2"
        />
      </div>

      {/* Error message (conditional) */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500
          hover:from-cyan-600 hover:to-blue-600 text-white font-semibold
          py-2 rounded-lg transition-all duration-200 disabled:opacity-50"
      >
        {isLoading ? 'Loading...' : 'Submit'}
      </button>
    </form>

    {/* Divider */}
    <div className="my-6 flex items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
      <span className="text-xs text-cyan-300/50">Or</span>
      <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
    </div>

    {/* Footer link */}
    <p className="text-center text-sm text-cyan-300/70">
      Alternative action? <a href="#" className="text-cyan-400 hover:text-cyan-300 font-semibold">
        Click here
      </a>
    </p>
  </div>
</div>
```

## Tailwind Config Additions

Si necesitas agregar animaciones personalizadas a `tailwind.config.ts`:

```ts
module.exports = {
  theme: {
    extend: {
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": {
            transform: "translate(0, 0) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
        },
      },
      transitionDuration: {
        "200": "200ms",
      },
    },
  },
}
```

También agrega a tu CSS global o al archivo de Tailwind:

```css
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
```

## Copy-Paste Ready Components

### Complete Login Card
```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function GlassmorphicLoginCard() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Your login logic here
      console.log('Login attempt:', { email, password })
      // If error: setError('Invalid credentials')
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-cyan-300/60 text-sm">
              Enter your credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-cyan-100">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-cyan-100">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-cyan-500/30 text-cyan-100"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            <span className="text-xs text-cyan-300/50">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
          </div>

          <p className="text-center text-sm text-cyan-300/70">
            Don't have account? <Link href="/auth/sign-up" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
```

## Customization Guide

Para ajustar colores sin perder el estilo:

```tsx
// Cambiar tema de cyan a purple:
// border-cyan-500/20 → border-purple-500/20
// bg-slate-900/50 → bg-slate-900/50 (mantener)
// text-cyan-100 → text-purple-100
// from-cyan-400 to-blue-500 → from-purple-400 to-pink-500
// bg-slate-800/50 → bg-slate-800/50 (mantener)
// border-cyan-500/30 → border-purple-500/30
// focus:border-cyan-400 → focus:border-purple-400
// text-cyan-300/60 → text-purple-300/60

// Cambiar a tema oscuro más oscuro:
// bg-slate-900/50 → bg-slate-950/60
// bg-slate-800/50 → bg-slate-900/50
// border-cyan-500/20 → border-cyan-500/30 (más visible)
```

---

**Tip**: Puedes copiar y pegar cualquiera de estos patrones directamente en tu proyecto. Todos están probados y funcionan con la configuración actual de Tailwind CSS.
