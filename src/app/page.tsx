"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  Play,
  Layers,
  Database,
  Wand2,
  KanbanSquare,
  Rocket,
  CheckCircle2,
  Github,
  Twitter,
} from "lucide-react";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  // Sincronizar tema inicial (opcional, mejor usar next-themes)
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Cjhirashi <span className="text-primary">App</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Herramientas
            </a>
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Proyectos
            </a>
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Roadmap
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              {isDark ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Log in
            </a>

            <a
              href="#"
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              Ingresar al Hub
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-bg pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent border border-border text-xs font-medium text-primary mb-6 animate-fade-in-up">
            <Sparkles className="w-3 h-3" />
            Gestión Inteligente de Proyectos + Multitool Generativo
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Tu Centro de Comando <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Potenciado por IA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Centraliza tu flujo de trabajo. Desde RAG avanzado y generación
            multimedia hasta un Project Manager autónomo que organiza tus ideas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Iniciar Sesión
            </a>
            <a
              href="#"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-input bg-card text-card-foreground font-medium hover:bg-accent hover:text-accent-foreground transition-all flex items-center justify-center gap-2"
            >
              <Layers className="w-5 h-5" />
              Explorar Herramientas
            </a>
          </div>

          {/* Abstract Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto animate-float">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-full w-full pointer-events-none"></div>
            <div className="rounded-xl border border-border shadow-2xl overflow-hidden bg-card">
              {/* Mock Browser Header */}
              <div className="h-8 bg-muted/50 border-b border-border flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="ml-4 flex-1 flex justify-center">
                  <div className="h-4 w-64 bg-muted rounded-full text-[10px] flex items-center justify-center text-muted-foreground/70">
                    cjhirashi-app.ai/hub
                  </div>
                </div>
              </div>
              {/* Mock AI Hub Interface */}
              <div className="aspect-video bg-muted/20 p-4 md:p-6 grid grid-cols-12 gap-4">
                {/* Sidebar: Tools */}
                <div className="hidden md:flex col-span-2 bg-sidebar rounded-xl border border-sidebar-border h-full flex-col p-3 gap-2 shadow-sm">
                  <div className="h-8 w-full bg-accent/50 rounded-lg border border-primary/20"></div>
                  <div className="h-8 w-full bg-transparent rounded-lg border border-transparent"></div>
                  <div className="h-8 w-full bg-transparent rounded-lg border border-transparent"></div>
                  <div className="mt-auto h-12 w-full bg-muted/50 rounded-lg"></div>
                </div>

                {/* Main Chat/Workspace */}
                <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
                  <div className="flex-1 bg-card rounded-xl border border-border p-4 relative shadow-sm">
                    {/* AI Msg */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-secondary"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-3/4 bg-muted rounded-full"></div>
                        <div className="h-3 w-1/2 bg-muted rounded-full"></div>
                      </div>
                    </div>
                    {/* Input Area */}
                    <div className="absolute bottom-4 left-4 right-4 h-12 border border-input rounded-lg flex items-center px-3 gap-2 bg-background/50">
                      <div className="w-6 h-6 rounded bg-muted"></div>
                      <div className="flex-1 h-2 bg-muted/50 rounded-full"></div>
                      <div className="w-8 h-8 rounded bg-primary"></div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Context/Project Manager */}
                <div className="hidden md:flex col-span-3 bg-card rounded-xl border border-border h-full flex-col p-3 gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-muted rounded-full"></div>
                    <div className="h-4 w-4 rounded-full bg-green-400 shadow-lg shadow-green-500/20"></div>
                  </div>
                  {/* Task Cards */}
                  <div className="h-20 bg-muted/30 rounded-lg border border-border/50 p-2"></div>
                  <div className="h-20 bg-muted/30 rounded-lg border border-border/50 p-2"></div>
                  <div className="h-20 bg-muted/30 rounded-lg border border-border/50 p-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Grid */}
      <section className="py-20 bg-card border-y border-border">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 mb-4 text-primary font-bold tracking-wider text-sm uppercase">
              Arsenal Completo
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Herramientas para cada modalidad
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No necesitas 5 suscripciones diferentes. Cjhirashi App unifica tus
              necesidades de generación y análisis en una sola interfaz fluida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Tool 1: RAG */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-primary/50 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">
                RAG Avanzado
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Sube tus PDFs, bases de datos o notas. La IA contextualiza sus
                respuestas basándose exclusivamente en tu conocimiento personal.
              </p>
            </div>

            {/* Tool 2: Multitool Gen */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-secondary/50 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">
                Multitool Generativo
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Texto, Imagen, Audio y Video. Un solo prompt puede detonar la
                creación de assets en múltiples formatos simultáneamente.
              </p>
            </div>

            {/* Tool 3: Project Manager */}
            <div className="p-8 rounded-xl bg-background border border-border hover:border-orange-500/50 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">
                Gestor de Proyectos IA
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Convierte ideas abstractas en roadmaps accionables. La IA
                desglosa tareas, asigna prioridades y monitorea el progreso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration/Future Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="bg-accent/20 rounded-3xl border border-primary/10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-bold text-primary">
                HOJA DE RUTA
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Próximamente: Modo Enterprise SaaS
              </h2>
              <p className="text-muted-foreground text-lg">
                Diseñada para la máxima eficiencia individual, Cjhirashi App
                está evolucionando rápidamente para integrar gestión de equipos,
                facturación centralizada y funcionalidades avanzadas.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Colaboración en tiempo real
                </li>
                <li className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  API para desarrolladores
                </li>
                <li className="flex items-center gap-3 text-foreground">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Marketplace de Plugins
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full max-w-md">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-full w-full bg-card rounded-xl flex items-center justify-center flex-col gap-4">
                  <Rocket className="w-16 h-16 text-primary" />
                  <div className="text-center">
                    <div className="font-bold text-xl text-foreground">SaaS Ready</div>
                    <div className="text-sm text-muted-foreground">
                      Q4 2025
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 bg-primary rounded flex items-center justify-center text-primary-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  Cjhirashi <span className="text-primary">App</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Tu sistema operativo personal para la era de la Inteligencia
                Artificial. Centraliza, genera y organiza.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">
                Plataforma
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Multitool
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Knowledge Base
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Project Manager
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-foreground mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary transition-colors"
                  >
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Cjhirashi App. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}