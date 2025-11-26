import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Bot, 
  Menu, 
  ShieldCheck, 
  LogOut,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // FONDO GENERAL: Zinc-950 (Casi negro, estilo Gemini)
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      
      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden w-72 flex-col border-r border-zinc-800 bg-zinc-950 md:flex inset-y-0 fixed z-10 h-full">
        
        {/* Logo Area */}
        <div className="flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-white">
            <div className="bg-blue-600 p-1.5 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">cjhirashi</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-6 px-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500 px-3 mb-2 uppercase tracking-wider">Plataforma</p>
          
          {/* Item Activo (Estilo Gemini: Azul, Píldora) */}
          <NavItem 
            href="/admin" 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            label="Dashboard" 
            active 
          />
          
          {/* Items Inactivos (Gris, Hover sutil) */}
          <NavItem 
            href="/admin/users" 
            icon={<Users className="h-4 w-4" />} 
            label="Usuarios" 
          />
          <NavItem 
            href="/admin/agents" 
            icon={<Bot className="h-4 w-4" />} 
            label="Agentes IA" 
          />
          
          <div className="my-6 border-t border-zinc-800" />
          
          <p className="text-xs font-medium text-zinc-500 px-3 mb-2 uppercase tracking-wider">Sistema</p>
          <NavItem 
            href="/admin/settings" 
            icon={<Settings className="h-4 w-4" />} 
            label="Configuración" 
          />
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer">
                <Avatar className="h-9 w-9 border border-zinc-700">
                    <AvatarImage src="/placeholder.jpg" />
                    <AvatarFallback className="bg-zinc-800 text-zinc-300">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">Admin</span>
                    <span className="text-xs text-zinc-500">admin@cjhirashi.app</span>
                </div>
            </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex flex-col md:ml-72 transition-all duration-300 ease-in-out min-h-screen">
        
        {/* Header Flotante / Transparente */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-zinc-950/80 backdrop-blur-md px-6 border-b border-zinc-800/50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden text-zinc-400">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-zinc-950 border-zinc-800 text-zinc-100">
               {/* Mobile Nav Content Here */}
            </SheetContent>
          </Sheet>

          {/* Search Bar estilo "Spotlight" */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  type="search" 
                  placeholder="Buscar en el sistema..." 
                  className="pl-9 w-full md:w-64 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-blue-600 rounded-full h-9"
                />
            </div>
          </div>
        </header>

        {/* Page Render */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

// NavItem Component (Estilo Gemini)
function NavItem({ href, icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link href={href}>
            <div 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 text-sm font-medium ${
                    active 
                    ? 'bg-blue-600/20 text-blue-200 hover:bg-blue-600/30' // Estilo Activo (Azul transparente)
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' // Estilo Inactivo
                }`}
            >
                {icon}
                {label}
            </div>
        </Link>
    )
}