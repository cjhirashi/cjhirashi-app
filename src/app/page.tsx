import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  ArrowRight, 
  Terminal, 
  Image as ImageIcon, 
  Mic, 
  FileText, 
  LayoutGrid, 
  Sparkles 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      
      {/* --- NAVBAR --- */}
      <header className="border-b sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
                <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">cjhirashi-app</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Herramientas</Link>
            <Link href="#pricing" className="hover:text-primary transition-colors">Precios</Link>
            <Link href="#docs" className="hover:text-primary transition-colors">Docs</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/signup">
                <Button size="sm" className="shadow-md shadow-primary/20">
                  Empezar Gratis
                </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative pt-20 pb-32 overflow-hidden">
            {/* Fondo decorativo (Gradiente) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none" />

            <div className="container mx-auto px-4 text-center flex flex-col items-center">
                <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm border-primary/30 bg-primary/5 text-primary">
                    <Sparkles className="w-3 h-3 mr-2 fill-current" />
                    v1.0 Ahora disponible
                </Badge>
                
                <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
                    El Sistema Operativo para <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                        Agentes de Inteligencia Artificial
                    </span>
                </h1>
                
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
                    Centraliza tus flujos de trabajo. Desde generación de código hasta análisis de datos complejos. 
                    Un solo hub, infinitas posibilidades.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Button size="lg" className="h-12 px-8 text-lg rounded-full gap-2">
                        Explorar Agentes <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
                        Ver Demo en Vivo
                    </Button>
                </div>

                {/* Dashboard Preview (Visual Mockup) */}
                <div className="mt-16 w-full max-w-5xl border rounded-xl shadow-2xl bg-card overflow-hidden">
                    <div className="h-8 bg-muted/50 border-b flex items-center px-4 gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                        <div className="w-3 h-3 rounded-full bg-green-400/80" />
                    </div>
                    <div className="p-1 aspect-[16/9] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-muted-foreground">
                        <p className="text-sm">Vista Previa del Panel de Control (Admin Dashboard)</p>
                    </div>
                </div>
            </div>
        </section>

        <Separator />

        {/* --- FEATURES GRID (EL HUB) --- */}
        <section id="features" className="py-24 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="container mx-auto px-4">
                <div className="mb-12 md:text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-4">Un Arsenal de Herramientas</h2>
                    <p className="text-muted-foreground">
                        No necesitas múltiples suscripciones. Accede a modelos especializados para cada tarea.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Agente 1 */}
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <CardTitle>Copywriter AI</CardTitle>
                            <CardDescription>Generación de contenido SEO y Marketing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Crea artículos de blog, posts para redes sociales y correos de venta en segundos.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Agente 2 */}
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <CardTitle>Dev Companion</CardTitle>
                            <CardDescription>Asistente de código y refactorización.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Debugging inteligente, conversión de lenguajes y generación de documentación técnica.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Agente 3 */}
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600">
                                <ImageIcon className="w-6 h-6" />
                            </div>
                            <CardTitle>Image Studio</CardTitle>
                            <CardDescription>Generación y edición de imágenes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Desde logos hasta ilustraciones fotorrealistas usando los últimos modelos de difusión.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Agente 4 */}
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 text-orange-600">
                                <Mic className="w-6 h-6" />
                            </div>
                            <CardTitle>Voice Transcriber</CardTitle>
                            <CardDescription>Audio a Texto de alta precisión.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Transcribe reuniones, genera resúmenes y detecta hablantes automáticamente.
                            </p>
                        </CardContent>
                    </Card>
                     
                    {/* Agente 5 */}
                    <Card className="group hover:shadow-lg transition-all hover:-translate-y-1 border-primary/10">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-600">
                                <Bot className="w-6 h-6" />
                            </div>
                            <CardTitle>Orchestrator</CardTitle>
                            <CardDescription>El cerebro central.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Conecta múltiples agentes para resolver tareas complejas que requieren varios pasos.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="py-12 border-t">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-sm text-muted-foreground">
                    © 2024 cjhirashi-app Inc. Todos los derechos reservados.
                </p>
                <div className="flex gap-6 text-sm text-muted-foreground">
                    <Link href="#" className="hover:text-foreground">Privacidad</Link>
                    <Link href="#" className="hover:text-foreground">Términos</Link>
                    <Link href="#" className="hover:text-foreground">Twitter</Link>
                </div>
            </div>
        </footer>

      </main>
    </div>
  );
}