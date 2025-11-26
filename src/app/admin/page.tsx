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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowUpRight,
  Zap,
  DollarSign,
  Users,
  Activity,
  Server
} from "lucide-react";

// Mock Data
const recentTransactions = [
  { user: "Alice Smith", email: "alice@inc.com", amount: "$250.00", status: "Success", date: "Hoy, 10:23 AM" },
  { user: "Bob Jones", email: "bob@dev.io", amount: "$50.00", status: "Processing", date: "Ayer, 4:00 PM" },
  { user: "Charlie D.", email: "charlie@web.com", amount: "$150.00", status: "Success", date: "Lun, 12 Mar" },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8 max-w-[1600px] mx-auto">
      
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
             <p className="text-zinc-400 mt-1">Visión general del rendimiento de cjhirashi-app.</p>
         </div>
         <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 shadow-lg shadow-blue-900/20">
            <Zap className="w-4 h-4 mr-2" /> Generar Reporte
         </Button>
      </div>

      {/* KPI Cards: Dark Surfaces */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DarkKpiCard 
          title="Ingreso Mensual" 
          value="$45,231" 
          trend="+20.1%" 
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />} 
        />
        <DarkKpiCard 
          title="Usuarios Activos" 
          value="+2,350" 
          trend="+180 nuevos" 
          icon={<Users className="h-4 w-4 text-blue-400" />} 
        />
        <DarkKpiCard 
          title="Tokens (IA)" 
          value="12.4M" 
          trend="+19% uso" 
          icon={<Activity className="h-4 w-4 text-purple-400" />} 
        />
        <DarkKpiCard 
          title="Estado Servidor" 
          value="99.9%" 
          trend="Operativo" 
          icon={<Server className="h-4 w-4 text-amber-400" />} 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Tabla Principal (2/3 ancho) */}
        <Card className="lg:col-span-2 bg-zinc-900/50 border-zinc-800 text-zinc-100 shadow-none">
          <CardHeader className="flex flex-row items-center border-b border-zinc-800/50 pb-4">
            <div className="grid gap-1">
              <CardTitle className="text-lg font-medium text-white">Transacciones Recientes</CardTitle>
              <CardDescription className="text-zinc-500">Movimientos financieros en tiempo real.</CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="ml-auto text-zinc-400 hover:text-white hover:bg-zinc-800">
              Ver todo <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-500 pl-6">Usuario</TableHead>
                  <TableHead className="text-zinc-500">Estado</TableHead>
                  <TableHead className="text-zinc-500 text-right pr-6">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((t, i) => (
                    <TableRow key={i} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="pl-6 font-medium">
                            <div className="text-zinc-200">{t.user}</div>
                            <div className="text-xs text-zinc-500">{t.email}</div>
                        </TableCell>
                        <TableCell>
                            <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell className="text-right pr-6 font-mono text-zinc-300">
                            {t.amount}
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Panel Lateral (1/3 ancho) */}
        <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100 shadow-none h-fit">
          <CardHeader className="pb-3 border-b border-zinc-800/50">
            <CardTitle className="text-lg font-medium text-white">Nuevos Registros</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6">
            {[1,2,3,4].map((_, i) => (
                <div className="flex items-center gap-4" key={i}>
                    <Avatar className="h-9 w-9 border border-zinc-700">
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">U{i}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <p className="text-sm font-medium text-zinc-200">Usuario Demo {i+1}</p>
                        <p className="text-xs text-zinc-500">hace {i * 15 + 2} minutos</p>
                    </div>
                </div>
            ))}
            <Button variant="outline" className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white mt-2">
                Ver todos los usuarios
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- Componentes Auxiliares para Estilo ---

function DarkKpiCard({ title, value, trend, icon }: any) {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800 text-zinc-100 shadow-none hover:bg-zinc-900 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium text-zinc-400">{title}</span>
            {icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{value}</div>
            <p className="text-xs text-zinc-500 mt-1">{trend}</p>
          </CardContent>
        </Card>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Success') {
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Completado</span>
    }
    if (status === 'Processing') {
        return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Procesando</span>
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Fallido</span>
}