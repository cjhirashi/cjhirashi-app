"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Search,
  Plus,
  Filter,
  Download,
  Trash2,
  Edit,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";

// --- Mock Data ---
const users = [
  {
    id: "USR-001",
    name: "Alice Johnson",
    email: "alice@cjhirashi.app",
    role: "Admin",
    status: "Active",
    lastActive: "Hace 2 min",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: "USR-002",
    name: "Bob Smith",
    email: "bob@dev.io",
    role: "Editor",
    status: "Offline",
    lastActive: "Hace 1 día",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: "USR-003",
    name: "Charlie Davis",
    email: "charlie@design.co",
    role: "Viewer",
    status: "Active",
    lastActive: "Hace 1 hora",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
  {
    id: "USR-004",
    name: "Diana Prince",
    email: "diana@agency.com",
    role: "Editor",
    status: "Suspended",
    lastActive: "Hace 1 semana",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
  },
  {
    id: "USR-005",
    name: "Evan Wright",
    email: "evan@tech.net",
    role: "Viewer",
    status: "Active",
    lastActive: "Hace 5 min",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evan",
  },
];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrado simple
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el acceso y los roles de los miembros del equipo.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            className="pl-10 bg-background border-border focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-10 border-border text-muted-foreground">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
          <span className="text-sm text-muted-foreground hidden sm:block">
            Mostrando <strong>{filteredUsers.length}</strong> usuarios
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/30">
              <TableHead className="w-[300px] pl-6 text-muted-foreground">Usuario</TableHead>
              <TableHead className="text-muted-foreground">Rol</TableHead>
              <TableHead className="text-muted-foreground">Estado</TableHead>
              <TableHead className="text-muted-foreground">Última Actividad</TableHead>
              <TableHead className="text-right pr-6 text-muted-foreground">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="border-border hover:bg-muted/20 transition-colors group">
                {/* Columna Usuario */}
                <TableCell className="pl-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Columna Rol */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {user.role === "Admin" && <Shield className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-sm text-foreground">{user.role}</span>
                  </div>
                </TableCell>

                {/* Columna Estado */}
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>

                {/* Columna Actividad */}
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastActive}
                </TableCell>

                {/* Columna Acciones */}
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-border bg-popover text-popover-foreground">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" /> Editar Detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" /> Cambiar Rol
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar Usuario
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Empty State si no hay resultados */}
        {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-3">
                    <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No se encontraron usuarios</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                    Intenta ajustar los términos de búsqueda o los filtros aplicados.
                </p>
            </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
            Página 1 de 5
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground" disabled>
                Anterior
            </Button>
            <Button variant="outline" size="sm" className="border-border text-foreground hover:border-primary hover:text-primary">
                Siguiente
            </Button>
        </div>
      </div>

    </div>
  );
}

// --- Componente Auxiliar: Badges de Estado ---
function StatusBadge({ status }: { status: string }) {
  const styles = {
    Active: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    Offline: "bg-muted text-muted-foreground border-border",
    Suspended: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  };

  const icons = {
    Active: <UserCheck className="w-3 h-3 mr-1" />,
    Offline: <div className="w-2 h-2 rounded-full bg-muted-foreground/50 mr-1.5" />,
    Suspended: <UserX className="w-3 h-3 mr-1" />,
  };

  const currentStyle = styles[status as keyof typeof styles] || styles.Offline;
  const currentIcon = icons[status as keyof typeof icons] || icons.Offline;

  return (
    <Badge variant="outline" className={`font-normal border ${currentStyle} px-2 py-0.5`}>
      {currentIcon}
      {status === "Active" ? "Activo" : status === "Offline" ? "Desconectado" : "Suspendido"}
    </Badge>
  );
}