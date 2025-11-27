"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  Bot, 
  Settings, 
  Activity, 
  Power, 
  PauseCircle, 
  PlayCircle,
  MoreVertical,
  Cpu,
  Clock,
  Database, // Para RAG
  FolderKanban // Para Project Management
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Mock Data: Agentes (ACTUALIZADO) ---
const agents = [
  {
    id: "AGT-001",
    name: "Project Manager Bot",
    description: "Coordina tareas, asigna prioridades y actualiza el roadmap del equipo de ingeniería automáticamente.",
    model: "GPT-4o",
    status: "working",
    load: 65,
    uptime: "99.9%",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=PM",
    capabilities: ["Planning", "Jira", "Email"],
    hasRAG: true, // NUEVA PROPIEDAD
    ragScope: "Global/Local", // NUEVA PROPIEDAD
    managesProjects: true, // NUEVA PROPIEDAD
  },
  {
    id: "AGT-002",
    name: "Research Assistant",
    description: "Busca papers, resume documentos y genera reportes RAG.",
    model: "Claude 3.5 Sonnet",
    status: "idle",
    load: 12,
    uptime: "98.5%",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Research",
    capabilities: ["Web Search", "PDF Analysis"],
    hasRAG: true,
    ragScope: "Global",
    managesProjects: false,
  },
  {
    id: "AGT-003",
    name: "Code Reviewer & Quality Assurance Bot", 
    description: "Analiza PRs en busca de bugs y sugiere optimizaciones de rendimiento y eficiencia en el código.",
    model: "Llama 3 70B",
    status: "maintenance",
    load: 0,
    uptime: "95.0%",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Code",
    capabilities: ["GitHub", "Python", "TypeScript"],
    hasRAG: false,
    ragScope: "None",
    managesProjects: false,
  },
  {
    id: "AGT-004",
    name: "Creative Director",
    description: "Genera assets visuales y copys para campañas.",
    model: "DALL-E 3",
    status: "working",
    load: 89,
    uptime: "99.1%",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Creative",
    capabilities: ["Image Gen", "Marketing Copy"],
    hasRAG: false,
    ragScope: "None",
    managesProjects: false,
  },
  {
    id: "AGT-005",
    name: "Data Analyst",
    description: "Procesa CSVs masivos y genera visualizaciones de datos complejos.",
    model: "Code Interpreter",
    status: "training",
    load: 45,
    uptime: "N/A",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Data",
    capabilities: ["Python", "Pandas", "Charts"],
    hasRAG: true,
    ragScope: "Local",
    managesProjects: true,
  }
];

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agentes IA</h1>
          <p className="text-muted-foreground mt-1">
            Configura, entrena y monitorea tu flota de asistentes virtuales.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Crear Agente
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center w-full max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            placeholder="Buscar agente por nombre o modelo..."
            className="pl-10 bg-card border-border focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Agents Grid - Forzamos 2 columnas en MD y LG/XL para maximizar el ancho */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"> 
        {filteredAgents.map((agent) => (
            <Card key={agent.id} className="bg-card border-border shadow-sm hover:border-primary/40 transition-all duration-200 flex flex-col overflow-hidden">
                <CardHeader className="pb-4 space-y-3">
                    
                    {/* FILA 1: Avatar y Nombre (Identidad) */}
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Avatar */}
                        <Avatar className="h-14 w-14 border border-border bg-muted/30 flex-shrink-0">
                            <AvatarImage src={agent.avatar} />
                            <AvatarFallback><Bot className="w-7 h-7 text-muted-foreground" /></AvatarFallback>
                        </Avatar>
                        {/* Título Principal */}
                        <CardTitle className="text-lg font-bold text-foreground w-full break-words leading-snug min-w-0 flex-1"> 
                            {agent.name}
                        </CardTitle>
                    </div>
                    
                    {/* FILA 2: Metadata (Badges) y Acciones (Botón 3 Puntos) - USAMOS JUSTIFY-BETWEEN */}
                    <div className="flex justify-between items-center w-full pt-1">
                        
                        {/* Badges de Modelo y Estado */}
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <Badge variant="secondary" className="text-[10px] font-normal h-5 bg-muted text-muted-foreground hover:bg-muted whitespace-nowrap max-w-full truncate">
                                {agent.model}
                            </Badge>
                            <AgentStatusBadge status={agent.status} />
                            
                            {/* NUEVOS INDICADORES DE CAPACIDAD */}
                            {agent.managesProjects && (
                                <Badge variant="secondary" className="text-[10px] font-medium h-5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 whitespace-nowrap">
                                    <FolderKanban className="w-3 h-3 mr-1" /> Proyectos
                                </Badge>
                            )}
                            {agent.hasRAG && (
                                <RAGIndicator scope={agent.ragScope} />
                            )}
                        </div>
                        
                        {/* Menú de Acciones (Aislado y pegado a la derecha por justify-between) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-border bg-popover text-popover-foreground">
                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <Settings className="w-4 h-4 mr-2" /> Configuración
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Activity className="w-4 h-4 mr-2" /> Ver Logs
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                    <Power className="w-4 h-4 mr-2" /> Apagar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* FILA 3: Descripción */}
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2 break-words w-full pt-3">
                        {agent.description}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-4 flex-1">
                    <div className="space-y-4">
                        {/* Load Metric */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Carga de Sistema</span>
                                <span>{agent.load}%</span>
                            </div>
                            <Progress value={agent.load} className="h-1.5 bg-muted" indicatorClassName={
                                agent.load > 80 ? "bg-orange-500" : "bg-primary"
                            } />
                        </div>

                        {/* Capabilities Chips */}
                        <div className="flex flex-wrap gap-2">
                            {agent.capabilities.map(cap => (
                                <span key={cap} className="text-[10px] px-2 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/50 whitespace-nowrap max-w-full truncate">
                                    {cap}
                                </span>
                            ))}
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Uptime: <span className="text-foreground font-medium">{agent.uptime}</span></span>
                    </div>
                    <div className="flex gap-2">
                        {agent.status === 'working' ? (
                            <Button size="sm" variant="outline" className="h-8 px-3 border-border text-muted-foreground hover:text-foreground">
                                <PauseCircle className="w-3.5 h-3.5 mr-1.5" /> Pausar
                            </Button>
                        ) : (
                            <Button size="sm" variant="outline" className="h-8 px-3 border-border text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/30">
                                <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Iniciar
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        ))}
        
        {/* Add New Card */}
        <button className="group flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-8 hover:border-primary/50 hover:bg-accent/5 transition-all duration-200 h-full min-h-[280px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <div className="text-center">
                <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Desplegar Nuevo Agente</h3>
                <p className="mt-1 text-xs text-muted-foreground">Desde plantilla o custom</p>
            </div>
        </button>
      </div>
    </div>
  );
}

// --- Componente Auxiliar: Badges de Estado Agente ---
function AgentStatusBadge({ status }: { status: string }) {
    const styles = {
        working: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        idle: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        maintenance: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        training: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 animate-pulse",
    };

    const labels = {
        working: "Trabajando",
        idle: "En Espera",
        maintenance: "Mantenimiento",
        training: "Entrenando"
    };

    const currentStyle = styles[status as keyof typeof styles] || styles.idle;
    const label = labels[status as keyof typeof labels] || status;

    return (
        <Badge variant="outline" className={`text-[10px] font-medium border px-2 py-0 whitespace-nowrap ${currentStyle}`}>
            {label}
        </Badge>
    );
}

// --- NUEVO Componente Auxiliar: Indicador RAG ---
function RAGIndicator({ scope }: { scope: string }) {
    const isGlobalLocal = scope === "Global/Local";
    const isGlobal = scope === "Global";
    const isLocal = scope === "Local";

    const label = isGlobalLocal ? "Global + Local" : isGlobal ? "Global Corpus" : "Local Documents";
    const tooltip = isGlobalLocal ? "Acceso al conocimiento general y documentos locales." : 
                    isGlobal ? "Acceso solo al corpus central de la organización." : 
                    "Acceso solo a los documentos adjuntos al Agente.";

    const style = isGlobalLocal ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" : 
                  isGlobal ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" : 
                  "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    
    return (
        <Badge variant="outline" className={`text-[10px] font-medium border px-2 py-0 whitespace-nowrap ${style}`}>
            <Database className="w-3 h-3 mr-1" />
            {label}
        </Badge>
    );
}