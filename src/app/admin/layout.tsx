"use client";

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
    // Adaptado: Usa bg-background y text-foreground del sistema
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground md:flex-row font-sans">
      
      {/* --- SIDEBAR DESKTOP --- */}
      {/* Adaptado: bg-sidebar, border-sidebar-border */}
      <aside className="hidden w-72 flex-col border-r border-sidebar-border bg-sidebar md:flex inset-y-0 fixed z-10 h-full transition-colors duration-300">
        
        {/* Logo Area */}
        <div className="flex h-16 items-center px-6 border-b border-sidebar-border/50">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-sidebar-foreground">
            <div className="bg-primary p-1.5 rounded-lg shadow-sm">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg">Cjhirashi <span className="text-primary">Admin</span></span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-6 px-4 space-y-2">
          <p className="text-xs font-bold text-muted-foreground px-3 mb-2 uppercase tracking-wider">Plataforma</p>
          
          {/* Item Activo */}
          <NavItem 
            href="/admin" 
            icon={<LayoutDashboard className="h-4 w-4" />} 
            label="Dashboard" 
            active 
          />
          
          {/* Items Inactivos */}
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
          
          <div className="my-6 border-t border-sidebar-border/50" />
          
          <p className="text-xs font-bold text-muted-foreground px-3 mb-2 uppercase tracking-wider">Sistema</p>
          <NavItem 
            href="/admin/settings" 
            icon={<Settings className="h-4 w-4" />} 
            label="Configuración" 
          />
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer group">
                <Avatar className="h-9 w-9 border border-sidebar-border">
                    <AvatarImage src="/placeholder.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-sidebar-foreground group-hover:text-primary transition-colors">Admin</span>
                    <span className="text-xs text-muted-foreground">admin@cjhirashi.app</span>
                </div>
                <LogOut className="ml-auto h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
            </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex flex-col md:ml-72 transition-all duration-300 ease-in-out min-h-screen bg-background">
        
        {/* Header Flotante / Transparente */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md px-6 border-b border-border/40">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            {/* Mobile Nav Content */}
            <SheetContent side="left" className="w-72 bg-sidebar border-sidebar-border text-sidebar-foreground p-0">
               <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                  <div className="flex items-center gap-2 font-bold">
                    <div className="bg-primary p-1.5 rounded-lg">
                        <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span>Cjhirashi App</span>
                  </div>
               </div>
               <nav className="flex-1 overflow-auto py-6 px-4 space-y-2">
                  <NavItem href="/admin" icon={<LayoutDashboard className="h-4 w-4"/>} label="Dashboard" active />
                  <NavItem href="/admin/users" icon={<Users className="h-4 w-4"/>} label="Usuarios" />
                  <NavItem href="/admin/agents" icon={<Bot className="h-4 w-4"/>} label="Agentes IA" />
               </nav>
            </SheetContent>
          </Sheet>

          {/* Search Bar */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Buscar en el sistema..." 
                  className="pl-9 w-full md:w-64 bg-muted/30 border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-full h-9 transition-all focus:w-72"
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

// NavItem Component Adaptado
function NavItem({ href, icon, label, active = false }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link href={href} className="block">
            <div 
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    active 
                    ? 'bg-primary/10 text-primary hover:bg-primary/15' // Activo: Fondo del color primario muy suave
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent' // Inactivo: Hover sutil
                }`}
            >
                {icon}
                {label}
            </div>
        </Link>
    )
}