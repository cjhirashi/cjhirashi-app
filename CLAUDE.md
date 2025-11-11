# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15+ application using the App Router with Supabase authentication and shadcn/ui components. The project follows modern React patterns with TypeScript and uses cookie-based authentication via Supabase SSR.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

The development server runs on http://localhost:3000 by default.

## Environment Setup

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable/anon key

These can be found in your Supabase project's API settings. The app checks for these variables using `hasEnvVars` from `lib/utils.ts:9`.

## Architecture

### Supabase Client Patterns

The application uses three different Supabase client initialization patterns depending on the context:

1. **Server Components & Route Handlers**: `lib/supabase/server.ts`
   - Creates a new client on each request (required for Fluid compute)
   - Uses Next.js cookies API for session management
   - Never store in global variables

2. **Client Components**: `lib/supabase/client.ts`
   - Browser-only client using `createBrowserClient`
   - Used in forms and interactive components

3. **Middleware**: `lib/supabase/middleware.ts`
   - Handles session refresh across all routes
   - Protects routes by redirecting unauthenticated users to `/auth/login`
   - CRITICAL: Always return the `supabaseResponse` object to maintain session cookies

### Authentication Flow

- Login/signup forms are client components that use the browser client
- After authentication, users are redirected to `/protected`
- Email confirmation handled via `/auth/confirm/route.ts` which processes OTP tokens
- Middleware at `middleware.ts:1` runs on all routes except static assets and matches the pattern at `middleware.ts:9`
- Protected routes check authentication via `supabase.auth.getClaims()` - this must be called to prevent random logouts

### Route Structure

- `/` - Public home page with tutorial steps
- `/auth/login` - Login page
- `/auth/sign-up` - Registration page
- `/auth/forgot-password` - Password reset flow
- `/auth/confirm` - Email confirmation callback (route handler)
- `/protected` - Example authenticated page that checks user session at `app/protected/page.tsx:8`

### Component Organization

- `components/` - Top-level application components (forms, buttons, navigation)
- `components/ui/` - shadcn/ui primitives (button, input, card, etc.)
- `components/tutorial/` - Tutorial-specific components for the starter template

Components follow shadcn/ui conventions:
- Configured in `components.json` with "new-york" style
- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/components/ui`
- Uses Lucide React for icons
- Styled with Tailwind CSS using the `cn()` utility from `lib/utils.ts:4`

### Styling

- Tailwind CSS with "new-york" shadcn/ui theme
- Dark mode support via `next-themes` with system preference detection
- Global styles in `app/globals.css`
- Neutral base color with CSS variables enabled
- Geist Sans font family from Google Fonts

## Key Implementation Details

### Middleware Session Management

The middleware at `lib/supabase/middleware.ts:5` performs critical session management:
- Always call `supabase.auth.getClaims()` immediately after creating the client
- Do NOT run code between `createServerClient` and `getClaims()`
- Must return the unmodified `supabaseResponse` with cookies intact
- If creating a new response, copy cookies using `myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())`

### Client-Side Forms

Authentication forms (login, signup, password reset) follow this pattern:
- Use `"use client"` directive
- Import browser client from `@/lib/supabase/client`
- Manage loading and error states locally
- Handle navigation with `useRouter` from `next/navigation`
- Display errors inline with the form

### Server Components

Protected server components:
- Import server client from `@/lib/supabase/server`
- Call `await createClient()` to get a new client instance
- Check authentication with `await supabase.auth.getClaims()`
- Redirect to login if no valid session using `redirect()` from `next/navigation`

## TypeScript Configuration

- Strict mode enabled
- Path alias `@/*` maps to project root
- Using `react-jsx` transform
- Target ES2017
- Module resolution: bundler
