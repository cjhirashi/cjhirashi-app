# **Nexus UI \- Design System**

Version: 1.0.4  
Style: Material 3 (Custom Corporate)  
Base: Tailwind CSS \+ Material Design Guidelines

## **1\. Paleta de Colores (Theming)**

La paleta utiliza un sistema tonal semántico. Se han ajustado los tonos oscuros para mayor vibrancia y los bordes para mayor sutileza.

### **Brand Colors**

| Token Name | Light Mode (Hex) | Dark Mode (Hex) | Usage |
| :---- | :---- | :---- | :---- |
| **Primary** | \#0061A4 (Electric Blue) | \#0A84FF (Vibrant Blue) | Acciones principales, FABs, Links activos. |
| **On Primary** | \#FFFFFF | \#FFFFFF | Texto sobre color primario. |
| **Primary Container** | \#D1E4FF | \#00497D | Fondos de selección, estados activos suaves. |
| **Secondary** | \#6F43C0 (Deep Purple) | \#BF5AF2 (Vibrant Purple) | Elementos de soporte, acentos secundarios. |
| **Secondary Container** | \#E9DDFF | \#5727A6 | Badges, chips, items de navegación activos. |
| **Error** | \#BA1A1A | \#FFB4AB | Estados de error, validaciones destructivas. |

### **Surface & Backgrounds**

| Token Name | Light Mode (Hex) | Dark Mode (Hex) | Usage |
| :---- | :---- | :---- | :---- |
| **Background** | \#F8F9FF | \#111318 | Fondo general de la página (body). |
| **Surface** | \#FFFFFF | \#1A1C1E | Fondo de Tarjetas (Cards), Modales, Sidebars. |
| **Surface Variant** | \#E1E2EC | \#44474F | Elementos decorativos de bajo contraste. |
| **Outline** | \#E2E2E6 | \#2A2D35 | Bordes de inputs y divisores (Tenues). |

## **2\. Tipografía**

**Font Family:** Roboto (Google Fonts) *Fallback:* sans-serif

| Scale | Class (Tailwind) | Weight | Size/Height | Usage |
| :---- | :---- | :---- | :---- | :---- |
| **Display** | text-4xl | Regular (400) | 36px/40px | Números grandes (KPIs). |
| **Headline** | text-3xl | Bold (700) | 30px/36px | Títulos de página principales. |
| **Title** | text-xl | Bold (700) | 20px/28px | Títulos de sección, Tarjetas. |
| **Body** | text-base | Regular (400) | 16px/24px | Texto general. |
| **Label** | text-sm | Medium (500) | 14px/20px | Botones, Inputs, Metadatos. |
| **Caption** | text-xs | Medium (500) | 12px/16px | Ayudas, Timestamps. |

## **3\. Formas y Bordes (Radii)**

Nos alejamos del estilo "píldora" (full rounded) de Material 3 estándar para un look más estructurado y profesional.

* **Cards / Containers:** rounded-xl (12px)  
* **Buttons / Inputs:** rounded-lg (8px)  
* **Badges / Chips:** rounded-full (9999px)

## **4\. Componentes Core**

### **Botones (Buttons)**

* **Primary:** Background bg-primary, Text text-white, rounded-lg, Shadow shadow-sm.  
* **Secondary/Tonal:** Background bg-secondary/10 o bg-accent, Text text-primary.  
* **Text/Ghost:** Hover bg-muted, Text text-primary.

### **Tarjetas (Cards)**

* **Elevated:** Background bg-card, shadow-sm, rounded-xl.  
* **Outlined:** Border border-border, Background transparent, rounded-xl.  
* **Filled:** Background bg-muted, No border, rounded-xl.

### **Inputs (Campos de Texto)**

* **Base:** bg-input (siendo este muy tenue) o transparente con borde.  
* **Borde:** border-b-2 color border-border (Suavizado al 15-20% de opacidad visual).  
* **Focus:** Borde cambia a border-primary y Label se reduce.

### **Navegación (Sidebar)**

* **Item Activo:** Background bg-card (Light) / bg-sidebar (Dark), Borde izquierdo border-l-4 border-primary.  
* **Item Inactivo:** Texto text-muted-foreground, Hover bg-muted/50.

## **5\. Iconografía**

* **Set:** Lucide Icons.  
* **Implementación:** Componentes React (ej. \<User /\>, \<Settings /\>) via lucide-react.  
* **Tamaño base:** w-6 h-6 (24px) para iconos estándar, w-5 h-5 (20px) dentro de inputs/botones.