"use client";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowUpRight,
  Zap,
  Cpu,
  Bot,
  Database,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// --- Mock Data para Gráficos ---
const tokenTrendData = [
  { name: 'Lun', tokens: 12400 },
  { name: 'Mar', tokens: 18300 },
  { name: 'Mie', tokens: 15000 },
  { name: 'Jue', tokens: 22000 },
  { name: 'Vie', tokens: 27800 }, // Pico
  { name: 'Sab', tokens: 18900 },
  { name: 'Dom', tokens: 13000 },
];

const modelUsageData = [
  { name: 'GPT-4o', usage: 45 },
  { name: 'Claude 3.5', usage: 30 },
  { name: 'DALL-E 3', usage: 15 },
  { name: 'Whisper', usage: 10 },
];

// Mock Data: Historial
const aiActivityLog = [
  { user: "Alice Smith", action: "Generar Imagen", model: "DALL-E 3", tokens: "N/A", status: "Completed", time: "Hace 2 min" },
  { user: "Bob Jones", action: "Análisis RAG", model: "GPT-4o", tokens: "1,240", status: "Processing", time: "Hace 5 min" },
  { user: "Charlie D.", action: "Resumen PDF", model: "Claude 3.5", tokens: "45,000", status: "Completed", time: "Hace 12 min" },
  { user: "David K.", action: "Code Refactor", model: "Llama 3", tokens: "890", status: "Failed", time: "Hace 30 min" },
];

// Mock Data: Agentes
const activeAgents = [
  { name: "Project Manager Bot", status: "online", task: "Organizando backlog", load: 12 },
  { name: "Research Assistant", status: "processing", task: "Indexando papers", load: 78 },
  { name: "Code Reviewer", status: "online", task: "Esperando commits", load: 0 },
  { name: "Image Generator", status: "offline", task: "Mantenimiento", load: 0 },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full font-sans">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Comando</h1>
             <p className="text-muted-foreground mt-1">Monitoreo en tiempo real de tus recursos de IA.</p>
         </div>
         <div className="flex gap-3">
            <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
                <Activity className="w-4 h-4 mr-2" /> Logs del Sistema
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                <Zap className="w-4 h-4 mr-2" /> Nueva Tarea
            </Button>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          title="Tokens Consumidos" 
          value="2.4M" 
          trend="+12% esta semana" 
          icon={<Cpu className="h-4 w-4 text-primary" />} 
        />
        <KpiCard 
          title="Agentes Activos" 
          value="8/10" 
          trend="Alta disponibilidad" 
          icon={<Bot className="h-4 w-4 text-secondary" />} 
        />
        <KpiCard 
          title="Base de Conocimiento" 
          value="4.2 GB" 
          trend="+150 MB nuevos datos" 
          icon={<Database className="h-4 w-4 text-green-500" />} 
        />
        <KpiCard 
          title="Latencia API" 
          value="240ms" 
          trend="Estable" 
          icon={<Activity className="h-4 w-4 text-orange-500" />} 
        />
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gráfico Principal: Tendencia de Tokens (4 columnas) */}
        <Card className="lg:col-span-4 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Tendencia de Consumo</CardTitle>
            <CardDescription className="text-muted-foreground">Uso de tokens en los últimos 7 días.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tokenTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value / 1000}k`} 
                  />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="var(--primary)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTokens)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Secundario: Distribución por Modelo (3 columnas) */}
        <Card className="lg:col-span-3 bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Uso por Modelo</CardTitle>
            <CardDescription className="text-muted-foreground">Distribución de carga de trabajo (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80} 
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Bar dataKey="usage" fill="var(--secondary)" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Tables & Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Tabla de Actividad */}
        <Card className="lg:col-span-2 bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="grid gap-1">
              <CardTitle className="text-lg font-medium text-foreground">Historial Reciente</CardTitle>
            </div>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              Ver todo <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground pl-6">Usuario</TableHead>
                  <TableHead className="text-muted-foreground">Modelo</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground text-right pr-6">Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiActivityLog.map((log, i) => (
                  <TableRow key={i} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                                {log.user.substring(0,2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="text-sm text-foreground">{log.user}</div>
                            <div className="text-xs text-muted-foreground">{log.action}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="text-[10px] border-border text-muted-foreground font-normal">
                            {log.model}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6 text-sm text-muted-foreground font-mono">
                      {log.tokens}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Estado de Agentes */}
        <Card className="bg-card border-border shadow-sm h-fit">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium text-foreground">Agentes</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                En vivo
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 pt-4">
            {activeAgents.map((agent, i) => (
              <div className="flex flex-col gap-2" key={i}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{agent.name}</span>
                    <Badge variant="outline" className={`text-[10px] border-0 ${
                        agent.status === 'online' ? 'bg-green-500/10 text-green-600' : 
                        agent.status === 'processing' ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'
                    }`}>
                        {agent.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Progress value={agent.load} className="h-1.5 bg-muted" />
                    <span className="text-[10px] text-muted-foreground w-8 text-right">{agent.load}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Componentes Auxiliares ---

function KpiCard({ title, value, trend, icon }: any) {
  return (
    <Card className="bg-card border-border shadow-sm hover:border-primary/50 transition-all duration-200 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
        <div className="p-2 rounded-md bg-muted/50 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
            <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
            {trend}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Completed') {
    return <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> Completado
    </div>
  }
  if (status === 'Processing') {
    return <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Procesando
    </div>
  }
  return <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
      <AlertCircle className="w-3.5 h-3.5" /> Error
  </div>
}