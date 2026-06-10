import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── BlockNote helpers ────────────────────────────────────────────────────────

type Inline = { type: 'text'; text: string; styles: Record<string, unknown> }
type Block = { id: string; type: string; props: Record<string, unknown>; content: Inline[]; children: Block[] }

function uid() { return crypto.randomUUID() }
const dp = (extra: Record<string, unknown> = {}) => ({
  textColor: 'default', backgroundColor: 'default', textAlignment: 'left', ...extra,
})

function parseInline(raw: string): Inline[] {
  let t = raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // strip links → text
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<br>/g, ' ')
    .replace(/\\([[\]*()`])/g, '$1')             // unescape
    .trim()
  return t ? [{ type: 'text', text: t, styles: {} }] : []
}

const SKIP = /^(<table|<\/table|<tr|<\/tr|<td|<\/td|<database|<page |<\/page>|<data-source)/

function markdownToBlocks(md: string): Block[] {
  const blocks: Block[] = []
  for (const line of md.split('\n')) {
    const t = line.trim()
    if (!t || t === '---' || SKIP.test(t)) continue
    if (t.startsWith('### ')) {
      blocks.push({ id: uid(), type: 'heading', props: dp({ level: 3 }), content: parseInline(t.slice(4)), children: [] })
    } else if (t.startsWith('## ')) {
      blocks.push({ id: uid(), type: 'heading', props: dp({ level: 2 }), content: parseInline(t.slice(3)), children: [] })
    } else if (t.startsWith('# ')) {
      blocks.push({ id: uid(), type: 'heading', props: dp({ level: 1 }), content: parseInline(t.slice(2)), children: [] })
    } else if (t.startsWith('> ')) {
      const inner = parseInline(t.slice(2))
      if (inner.length) blocks.push({ id: uid(), type: 'quote', props: dp(), content: inner, children: [] })
    } else if (/^- \[x\]/i.test(t)) {
      const inner = parseInline(t.slice(6))
      if (inner.length) blocks.push({ id: uid(), type: 'checkListItem', props: dp({ checked: true }), content: inner, children: [] })
    } else if (/^- \[ \]/.test(t)) {
      const inner = parseInline(t.slice(6))
      if (inner.length) blocks.push({ id: uid(), type: 'checkListItem', props: dp({ checked: false }), content: inner, children: [] })
    } else if (t.startsWith('- ')) {
      const inner = parseInline(t.slice(2))
      if (inner.length) blocks.push({ id: uid(), type: 'bulletListItem', props: dp(), content: inner, children: [] })
    } else if (/^\d+\. /.test(t)) {
      const inner = parseInline(t.replace(/^\d+\. /, ''))
      if (inner.length) blocks.push({ id: uid(), type: 'numberedListItem', props: dp(), content: inner, children: [] })
    } else {
      const inner = parseInline(t)
      if (inner.length) blocks.push({ id: uid(), type: 'paragraph', props: dp(), content: inner, children: [] })
    }
  }
  return blocks
}

// ── Notion content ───────────────────────────────────────────────────────────

const PAGES: { key: string; parentKey: string | null; title: string; icon: string; md: string }[] = [
  {
    key: 'root',
    parentKey: null,
    title: 'mod3l.io — Workspace',
    icon: '🌐',
    md: `Automatización · IA · Agentes
📍 Patagonia, Argentina

> Este es el espacio central del proyecto mod3l.io. Acá se registran ideas, decisiones, cambios pendientes y el roadmap del producto.

## Secciones
- 💡 Ideas & Backlog — todo lo que va surgiendo
- 🔧 Cambios Pendientes — landing, redes, producto
- 🗺️ Roadmap — fases y prioridades
- 📝 Decisiones — por qué se eligió cada cosa
- 🤝 Equipo — roles y accesos
- 📱 Redes Sociales — estrategia y contenido
- 🛠️ Desarrollo — tareas técnicas
- ⚙️ Operaciones — procesos internos
- 🚀 Lanzamiento Tally — sistema completo GTM`,
  },
  {
    key: 'cambios',
    parentKey: 'root',
    title: 'Cambios Pendientes',
    icon: '🔧',
    md: `Todo lo que hay que modificar, mejorar o corregir.

## Producto
- [ ] Bugs: Agenda para un DEMO e informa al cliente que lo contactará al número de Tally y no del cliente. Acuerda una DEMO con los datos del cliente — ¿eso se refleja en una transacción?
- [ ] Para corregir de la web: Sigue habiendo partes con letras muy pequeñas. Ajustar del carrusel la letra y colores. Doble presentación de Tally en Mod3l.io sin claridad de qué es qué. Sigue el ruidito del chat.
- [ ] Pie de página en ambos sitios (Tally y Mod3l) ilegible — letra pequeña y falta contraste
- [ ] Plantillas Meta: crear la opción de agregar Media
- [ ] Cambiar el flujo de cómo se registran las intenciones
- [ ] Poner 3 colores al mapeo de intenciones con colores sugeridos
- [ ] BBDD a enviar la propuesta del producto (medicina en Gral, centros de rehabilitación, Corralón)
- [ ] Hacer logo para cada empresa
- [ ] Subir el logo de cada empresa en Meta — Cristian
- [ ] Verificar que el aviso de recordatorio de turno sea 24hs antes del turno
- [ ] Mandar confirmación de turno de manera inmediata
- [ ] Error en la generación de reclamos: se genera doble y el link no es válido
- [ ] ¿Qué pasa con las imágenes, documentos y demás cosas que pueda poner el usuario?
- [ ] Workflow para el agente IA: cómo gestionar un pedido de supervisor del cliente
- [ ] Crear módulo "Logs de Agentes" para visualizar la conversación de los agentes
- [x] En el panel cliente, sección de moderación — opción de activar/desactivar
- [x] Mapeo de intención — cambiar ícono en el menú
- [x] En menú segmentos, agregar condiciones por mapeos de intenciones
- [x] En campaña, habilitar la opción de programar envío
- [x] Mod3l.io responsive — Erika
- [x] Política de seguridad — Erika
- [x] Mejorar contraste en Agenda → Profesionales
- [x] Política de privacidad, cookies, navegación en mod3l.io — Erika
- [x] Subir información de comercio Tech y Médico a la Base de Conocimiento — Erika
- [x] Error: cuando el humano toma el chat y lo abandona no ve la respuesta del Asistente IA — Cris
- [x] Cambiar precio de planes de pesos a Dólares — Cris
- [x] Hacer el prompt a cada empresa — mensaje de bienvenida personalizado — Erika
- [x] Reubicar checkbox "Ver inactivos" en Agenda → Profesionales
- [x] Agregar selección de cliente en Agenda → Nuevo Turno
- [x] Corregir error que impide guardar turnos creados manualmente
- [x] Agregar mensajes de confirmación y error al guardar turnos
- [x] Implementar autoselección del profesional al crear turno desde agenda específica
- [x] Verificar persistencia completa del turno en base de datos
- [x] Validar flujo completo de creación de turnos
- [x] Crear módulo de reclamos — registro tipo tickets
- [x] Cambiar la palabra "Bots" por "Agentes" en todo el sitio admin
- [x] Exportar datos del CRM a una planilla en tiempo real
- [x] Contactos bloqueados: poder bloquear números abusivos
- [x] Agenda Multi Profesional
- [x] CRM Multiprofesional
- [x] Incluir en el Admin del cliente el número de teléfono del Asistente — Cristian
- [x] Landing Page / Armar producto con planes — Erika
- [x] Documentar flujo de onboarding de clientes
- [x] Horarios de Atención: configurar en qué horarios responde el agente
- [x] Notificaciones: centro de alertas dentro de la plataforma

## Mejoras de métricas (backlog técnico)
1. Tasa de error OpenAI — agregar updateDailyStats cuando falla la llamada IA
2. Latencia del agente — medir tiempo de respuesta y guardar promedio diario
3. Alerta de tasa de error alta — si errores_ia / mensajes_ia > 5% en 24hs → alerta crítica
4. Conversaciones sin respuesta IA — detectar conversaciones donde el bot no respondió en X minutos
5. Tokens consumidos por empresa — guardar usage.total_tokens por empresa
6. Webhook health check — endpoint /health para verificar DB + OpenAI

## Landing Page (mod3l.io)
- [x] Contraste insuficiente en links del footer — fix: aumentar luminosidad
- [x] Falta landmark main — fix: envolver contenido principal en main
- [x] 404 en favicon — fix: agregar favicon.ico en la raíz
- [x] Style & Layout en main thread: 1.237ms en layout/estilos

## Redes Sociales
- [x] Crear Página de Facebook desde cuenta personal
- [x] Configurar foto de perfil con logo cuadrado
- [x] Configurar Meta Business Manager
- [x] Validación de Meta Business Manager
- [ ] Crear cuenta Instagram @mod3l.io
- [ ] Subir los 9 posts de Instagram
- [ ] Completar bio de Instagram

## Mensaje de lanzamiento Instagram — 08/06/2026
Texto aprobado para distribución manual por WhatsApp personal al lanzamiento del perfil de Instagram.
> Che, acabo de lanzar el perfil de Instagram de mod3l.io. Estamos presentando a Tally, un agente que atiende WhatsApp 24/7. Si conocés algún negocio que pierda clientes por no responder a tiempo, avisáme. Dale un vistazo: instagram.com/mod3l.automation
Contexto: Primer post publicado el 08/06/2026. Distribuir a 10 contactos seleccionados manualmente — dueños de negocios o personas que los conozcan.`,
  },
  {
    key: 'testing',
    parentKey: 'root',
    title: 'Testing & QA',
    icon: '🧪',
    md: `Registro de casos de prueba para todos los módulos de mod3l.io.
> Usá el tablero para ver el estado de cada prueba. Filtrá por módulo para enfocarte en un área específica.

## Herramientas de Testing

### Stack seleccionado
Ollama + Promptfoo — para evaluación de los agentes IA

### Ollama
Ollama es una herramienta que permite correr modelos de inteligencia artificial directamente en la computadora, sin conexión a internet y sin costo. En el contexto de mod3l.io, se usa para simular las respuestas de los agentes durante la etapa de desarrollo y testing.

¿Para qué lo usamos?
- Testear que los prompts de cada agente funcionan correctamente
- Validar respuestas sin gastar créditos de la API de Anthropic
- Iterar rápido en el desarrollo sin costo

Limitación importante: los modelos que corren localmente con Ollama son menos potentes que Claude en producción. Sirven para desarrollo y validación — no reemplazan las pruebas finales con la API real.

### Promptfoo
Framework open source para evaluar agentes IA de forma automatizada. Corre los casos de prueba definidos en promptfooconfig.yaml y reporta qué casos pasan y cuáles fallan.

Casos de prueba configurados: 19 casos para los 4 agentes de mod3l.io
- AGT-01 Turnos y Reservas — 5 casos
- AGT-02 Atención al Cliente — 5 casos
- AGT-03 Consultas Técnicas — 4 casos
- AGT-04 Tickets de Reparación — 5 casos

### Playwright
Para testing de interfaz web — simula un usuario real navegando la landing page, completando formularios y verificando flujos visuales.

### Para correr los tests
1. Instalar Ollama desde ollama.com
2. Instalar Node.js desde nodejs.org
3. Correr npx promptfoo@latest eval dentro de la carpeta mod3l-promptfoo
4. Ver resultados con npx promptfoo@latest view

## Sitios bajo prueba
- Dashboard Cliente — main.d1v3ue00dhedrk.amplifyapp.com/dashboard — Playwright
- Admin mod3l.io — main.d2vsd762to2k6n.amplifyapp.com/logs — Playwright
- Agente IA — WhatsApp — Promptfoo

## Entorno de ejecución
Los tests corren en Google Colab — entorno cloud gratuito de Google. No requiere instalación local.

### Flujo de trabajo
1. Abrir Google Colab
2. Correr los tests de Playwright o Promptfoo
3. El resultado se publica automáticamente en Notion en la sección Testing & QA
4. Cada caso de prueba actualiza su estado — Aprobado o Fallido`,
  },
  {
    key: 'roadmap',
    parentKey: 'root',
    title: 'Roadmap',
    icon: '🗺️',
    md: `## FASE 1 — Lanzamiento (Mayo - Junio 2026)
- [x] Crear landing page mod3l.io
- [x] Definir identidad visual y paleta de colores
- [x] Crear primeros 9 posts de Instagram
- [x] Definir los 3 servicios core
- [x] Armar speech de ventas
- [ ] Crear perfiles en redes sociales
- [ ] Configurar Meta Business Manager
- [ ] Conseguir primeros 3 clientes beta

## FASE 2 — Validación (Julio - Agosto 2026)
- [ ] Lanzar primer agente en producción con cliente real
- [ ] Documentar caso de uso #1
- [ ] Lanzar servicio de Dashboard
- [ ] Alcanzar 500 seguidores en Instagram
- [ ] Definir pricing definitivo

## FASE 3 — Escala (Septiembre - Diciembre 2026)
- [ ] Rendimiento del Agente: métricas específicas — tasa de resolución, conversaciones escaladas, temas consultados
- [ ] Plantillas de Respuesta: respuestas rápidas predefinidas para el operador humano
- [ ] Exportar datos del CRM a una planilla en tiempo real
- [ ] Integraciones: Google Calendar, Mercado Pago, Email
- [ ] Lanzar servicio de Control Documental
- [ ] Sumar primer miembro al equipo
- [ ] Configurar automatización con Cowork
- [ ] Alcanzar 10 clientes activos
- [ ] Iniciar constitución legal de la empresa`,
  },
  {
    key: 'ideas',
    parentKey: 'roadmap',
    title: 'Ideas & Backlog',
    icon: '💡',
    md: `Todo lo que surge en el camino — sin filtro, sin orden, sin perder nada.
> Regla: cualquier idea que surja en una reunión, conversación o ducha va acá primero.

## Ideas de Producto
- [ ] Explorar integración con Mercado Pago para pagos automáticos desde el agente
- [ ] Dashboard con métricas de conversación del agente (mensajes, conversiones)
- [ ] Versión del agente para Instagram DMs
- [ ] Onboarding guiado para clientes sin experiencia tech

## Ideas de Marketing
- [ ] Video testimonial con primer cliente
- [ ] Webinar gratuito "Qué es un agente IA y cómo usarlo en tu negocio"
- [ ] Alianza con cámaras de comercio de la Patagonia
- [ ] Caso de uso documentado para cada rubro

## Ideas de Negocio
- [ ] Plan de precios por niveles (básico, pro, enterprise)
- [ ] Programa de referidos para clientes actuales
- [ ] Partnership con estudios contables para el servicio documental`,
  },
  {
    key: 'decisiones',
    parentKey: 'root',
    title: 'Registro de Decisiones',
    icon: '📝',
    md: `Por qué se eligió cada cosa. Para no volver a discutir lo que ya se decidió.

## Nombre de la empresa
Decisión: mod3l.io
Fecha: Mayo 2026
Motivo: Corto, memorable, el 3 reemplaza la E intencionalmente como guiño tech, .io da identidad digital moderna. Explorado extensamente antes de elegir.

## Paleta de colores
Decisión: Negro profundo + Azul eléctrico (#00c3ff) + Blanco hielo
Fecha: Mayo 2026
Motivo: Estética digital pura, fría y tech. Transmite precisión y modernidad sin ser genérico.

## Tipografía
Decisión: Space Mono + Exo 2
Fecha: Mayo 2026
Motivo: Space Mono para elementos técnicos (monoespaciada), Exo 2 para títulos y cuerpo (moderna y legible).

## Canales de redes sociales prioritarios
Decisión: Instagram primero, LinkedIn segundo
Fecha: Mayo 2026
Motivo: El cliente target (dueños de negocio) está más activo en Instagram. LinkedIn para el segmento B2B de empresas medianas.

## Cuenta de Facebook
Decisión: Crear desde cuenta personal del founder, NO con mail corporativo
Fecha: Mayo 2026
Motivo: Meta bloqueó la cuenta creada con mail corporativo redes.sociales@mod3l.io. Meta requiere cuenta personal como base.`,
  },
  {
    key: 'equipo',
    parentKey: 'root',
    title: 'Equipo & Roles',
    icon: '👥',
    md: `## Estructura actual
- Founder / CEO — Visión, ventas, producto — Activo
- Dev Backend — Agentes IA, automatizaciones — Por sumar
- Dev Frontend — Landing, dashboards — Por sumar
- Community Manager — Redes sociales — Por sumar

## Accesos y herramientas
- Flowspace — todo el equipo (este workspace)
- VS Code / GitHub — equipo de desarrollo
- Meta Business Manager — founder + community manager
- Claude / Anthropic — founder + desarrollo
- Cowork — automatización de redes

## Para invitar al equipo
1. Ir a Configuración → Miembros
2. Invitar por email
3. Asignar rol: Editor para equipo de desarrollo, Comentador para externos`,
  },
  {
    key: 'redes',
    parentKey: 'root',
    title: 'Redes Sociales',
    icon: '📱',
    md: `## Estado de cuentas
- Instagram @mod3l.io — ⏳ Por crear
- Facebook Page mod3l.io — ⏳ Por crear
- LinkedIn mod3l.io — ⏳ Por crear
- WhatsApp Business — ⏳ Pendiente API

## Estrategia
- Frecuencia: 3 posts por semana (Lunes, Miércoles, Viernes)
- Horario: 19:00 a 21:00hs Argentina
- Stories: 2 por día (08:00hs y 20:00hs)
- Reel: 1 por semana
- Presupuesto pago: $50 USD/mes para boost

## Contenido producido
- [x] 9 posts PNG 1080x1080px
- [x] Logo PNG horizontal
- [x] Logo PNG cuadrado (perfil)
- [x] 9 copies con hashtags
- [x] Calendario de publicación 3 semanas
- [x] Video simulación chats WhatsApp

## Próximos pasos
- [ ] Crear Instagram desde cuenta personal
- [ ] Crear Facebook Page desde cuenta personal
- [ ] Configurar Meta Business Manager
- [ ] Subir los 9 posts según calendario`,
  },
  {
    key: 'desarrollo',
    parentKey: 'root',
    title: 'Desarrollo',
    icon: '🛠️',
    md: `## Stack tecnológico
- Frontend: HTML/CSS/JS — landing actual en VS Code
- Agentes IA: Por definir
- Automatización documental: Por definir
- Dashboard: Por definir
- Hosting: Por definir

## Archivos del proyecto
- mod3l-website.html — landing page principal
- mod3l-whatsapp-demo.html — componente simulación WhatsApp
- mod3l-post-01 al 09.png — posts Instagram
- mod3l-logo.png — logo horizontal
- mod3l-logo-square.png — logo cuadrado

## Tareas técnicas pendientes
- [ ] Integrar componente WhatsApp demo en la landing
- [ ] Agregar secciones de los 3 servicios a la landing
- [ ] Configurar formulario de contacto
- [ ] Configurar dominio mod3l.io
- [ ] Definir hosting (Vercel, Netlify, otro)
- [ ] Configurar primer agente IA de demo
- [ ] Conectar WhatsApp Business API

## Repositorio
> Agregar link al repositorio de GitHub cuando esté creado`,
  },
  {
    key: 'operaciones',
    parentKey: 'root',
    title: 'Operaciones',
    icon: '⚙️',
    md: `Procesos internos de operación de mod3l.io.

## Secciones
- Onboarding de clientes
- Manual Pausar vs Suspender
- Flujo de soporte
- Procesos internos`,
  },
  {
    key: 'onboarding',
    parentKey: 'operaciones',
    title: 'Onboarding de Clientes',
    icon: '📋',
    md: `Proceso completo desde que un cliente contrata mod3l.io hasta que su agente está funcionando.
> Objetivo: que cualquier persona del equipo pueda llevar un cliente del Paso 1 al Paso 6 sin improvisar.

## Paso 1 — Bienvenida
Responsable: Erika — Tiempo estimado: 1 día
- [ ] El cliente firma y realiza el pago
- [ ] Se envía mail de bienvenida con acceso al panel
- [ ] Se agenda llamada de relevamiento

## Paso 2 — Formulario de Relevamiento
Responsable: Erika — Tiempo estimado: 1-2 días
El cliente completa información clave:
- [ ] Nombre del negocio y rubro
- [ ] Horarios de atención
- [ ] Servicios o productos que ofrece
- [ ] Preguntas frecuentes que recibe
- [ ] Tono de comunicación — formal, informal, con emojis
- [ ] Número de WhatsApp a conectar

## Paso 3 — Configuración del Agente
Responsable: Cristian — Tiempo estimado: 1-2 días
- [ ] Entrenar el agente con la información del relevamiento
- [ ] Configurar respuestas base
- [ ] Configurar horarios de atención
- [ ] Configurar mensaje fuera de horario
- [ ] Revisar y aprobar internamente antes de mostrar al cliente

## Paso 4 — Conexión de WhatsApp
Responsable: Cristian — Tiempo estimado: 1 día
- [ ] Conectar el número de WhatsApp del negocio a la plataforma
- [ ] Verificar que los mensajes llegan correctamente
- [ ] Verificar que el agente responde en el panel del cliente

## Paso 5 — Prueba y Validación
Responsable: Erika + Cliente — Tiempo estimado: 1 día
- [ ] El cliente prueba el agente enviando mensajes de prueba
- [ ] Se recogen correcciones y ajustes
- [ ] Cristian aplica los ajustes
- [ ] Cliente aprueba las respuestas

## Paso 6 — Activación
Responsable: Cristian — Tiempo estimado: 1 día
- [ ] El agente empieza a responder clientes reales
- [ ] Se confirma al cliente que está activo
- [ ] Se envía guía rápida de uso del panel

## Paso 7 — Seguimiento
Responsable: Erika — Tiempo estimado: A los 7 días de activación
- [ ] Llamada o mensaje de seguimiento al cliente
- [ ] Verificar que el agente está funcionando correctamente
- [ ] Resolver dudas del cliente sobre el panel
- [ ] Registrar feedback para mejorar el proceso

## Tiempo total estimado
5 a 7 días hábiles desde la contratación hasta el agente activo.

## Notas importantes
- Nunca activar el agente sin que el cliente lo haya aprobado en el Paso 5
- Si el cliente demora en responder el relevamiento, hacer seguimiento a las 48hs
- Documentar cualquier caso especial o rubro nuevo para mejorar el proceso`,
  },
  {
    key: 'lanzamiento',
    parentKey: 'root',
    title: '🚀 Lanzamiento Tally — Sistema Completo GTM',
    icon: '🚀',
    md: `Este espacio contiene toda la estrategia, campañas, material comercial y operaciones de lanzamiento de Tally construidas en sesión con asesor estratégico (junio 2026).
Última actualización: 6 de junio 2026

## Índice del sistema
- 📋 Estrategia — Posicionamiento, segmentación, plan 30-60-90 días
- 📣 Campañas — Mensajes WhatsApp, LinkedIn, Email
- 🔄 Trial 14 Días — Secuencia completa de onboarding
- ✅ Tareas de Lanzamiento — Checklist ejecutivo semana 1
- 📊 Pipeline de Prospectos — Base de datos de centros médicos y otros rubros
- 🗞️ Qué Pasa Medallo — Caso de Éxito

> Decisión clave registrada: Trial de 14 días (no free permanente). Sitio web debe actualizarse en tally.html para reflejar esto antes de iniciar prospección.
> Presupuesto publicitario: $0 mes 1 → $100-150 USD mes 2 → $200-300 USD mes 3
> Objetivo de clientes: 5 pagos mes 1 · 15 pagos mes 2 · 30 pagos mes 3`,
  },
  {
    key: 'estrategia',
    parentKey: 'lanzamiento',
    title: '1. Estrategia',
    icon: '📋',
    md: `## Posicionamiento
Qué es Tally: Un agente de IA para WhatsApp que reemplaza la atención manual repetitiva, disponible 24/7, implementado en 24 horas, sin que el cliente toque código.

Qué problema resuelve: Negocios que reciben consultas por WhatsApp a toda hora, las responden tarde o mal, pierden ventas en ese gap y no tienen registro de nada. El dueño o su empleado son el cuello de botella.

Por qué es diferente:
- Implementación en 24hs vs. semanas de competidores grandes
- Equipo local de Neuquén que conoce el mercado y atiende en persona
- Módulos propios integrados (CRM, turnos, calendario, dashboard)
- API oficial Meta = sin riesgo de baneo de número
- Aprende con el tiempo

Por qué comprarlo ahora: Cada semana sin Tally es mensajes no respondidos, turnos perdidos y prospectos que se van al competidor que sí contesta.

## Propuesta de Valor — 5 Versiones

### Versión corta
> Tu negocio atiende solo. Tally responde, agenda y vende por WhatsApp las 24 horas.

### Versión comercial
> Tally es el agente de IA que convierte tu WhatsApp en un canal de atención, ventas y gestión automatizado. Sin código, sin demoras, funcionando en 24 horas. Vos seguís manejando tu negocio; Tally se encarga de que ningún cliente quede sin respuesta.

### Versión para WhatsApp
> Hola [Nombre], ¿sabés cuántas consultas pierde tu negocio por no poder responder a tiempo? Tally las responde por vos, las 24hs. ¿Te muestro cómo funciona en 10 minutos?

### Elevator Pitch 30 segundos
> Tally es un agente de inteligencia artificial que trabaja dentro de tu WhatsApp Business. Atiende consultas, agenda turnos y califica clientes las 24 horas, sin que vos o tu equipo tengan que estar disponibles. Se configura en 24 horas y se adapta a cualquier rubro.

## Segmentación — Ranking de Industrias
- #1 Consultorios médicos/odontológicos — Dolor ★★★★★ — Facilidad venta ★★★★
- #2 Gimnasios y centros deportivos — Dolor ★★★★ — Facilidad venta ★★★★
- #3 Centros de estética / spa — Dolor ★★★★ — Facilidad venta ★★★★★
- #4 Inmobiliarias — Dolor ★★★★★ — Ticket ★★★★★
- #5 Restaurantes y delivery — Dolor ★★★★ — Escalabilidad ★★★★★
- #6 Talleres mecánicos
- #7 Estudios contables/legales

Triángulo de ataque inicial: Consultorios + Gimnasios + Estética

## Plan 30-60-90 Días

### MES 1 — Validación y primeros clientes
Objetivo: 5 clientes pagos + 10 en pipeline activo

Semana 1-2:
- Mapear 200-400 negocios target en Neuquén (Guía Cores, Google Maps, Instagram)
- Construir lista de 100 contactos priorizados
- Grabar demo de 3 minutos de Tally en consultorio ficticio
- Definir pricing final y materiales de soporte
- Corregir tally.html: "14 días de prueba" en lugar de "free para siempre"

Semana 3-4:
- Contactar 50 negocios por WhatsApp
- Meta: 15 demos agendadas, 5 cierres
- Publicar contenido en LinkedIn e Instagram
- Ofrecer precio "cliente fundador" a primeros 5 a cambio de testimonio

KPIs del mes 1:
- Mensajes enviados: 50
- Tasa de respuesta objetivo: >20%
- Demos realizadas: 15
- Clientes pagos: 5
- MRR objetivo: $350.000 ARS

### MES 2 — Tracción y expansión
Objetivo: 15 clientes pagos acumulados
- Documentar 5 primeros casos de éxito con métricas reales
- Lanzar secuencia email/WA con prueba social
- Ampliar prospección a gimnasios y estética
- Iniciar programa de referidos
- Primer post de caso de éxito real en LinkedIn
- Pauta: $100-150 USD en Meta Ads

KPIs:
- Clientes pagos acumulados: 15
- NPS primeros clientes: >7
- Referidos generados: 3
- MRR: $750.000 ARS

### MES 3 — Escala y sistematización
Objetivo: 30 clientes pagos
- Proceso de onboarding documentado (<4hs por cliente)
- Landing page con casos de éxito y pricing visible
- Contenido consistente: 2 posts semanales
- Evaluar primer hire o freelancer
- Revisar pricing al alza

KPIs:
- Clientes pagos: 30
- Churn: <10%
- MRR: $1.500.000 ARS mínimo
- CAC: <$15 USD
- Presupuesto pauta: $200-300 USD`,
  },
  {
    key: 'campanas',
    parentKey: 'lanzamiento',
    title: '2. Campañas',
    icon: '📣',
    md: `## WhatsApp — Mensajes de Prospección
> Regla operativa: Máximo 30-40 mensajes nuevos por día. Variá ligeramente el texto entre envíos para evitar limitaciones de Meta.

### MENSAJE 1 — Primer contacto (consultorio)
> Hola [Nombre], te escribo desde mod3l.io, somos de Neuquén. Vi que tenés tu consultorio en [zona/plataforma]. Trabajo con profesionales de la salud que reciben muchas consultas por WhatsApp y no siempre pueden responder a tiempo. ¿Es algo que te pasa a vos también?

### MENSAJE 1 — Primer contacto (gimnasio)
> Hola [Nombre], te escribo desde mod3l.io, somos de Neuquén. Trabajo con gimnasios y centros deportivos que pierden inscripciones porque las consultas por WhatsApp llegan fuera de horario y no hay quien responda. ¿Eso les pasa en [nombre del gimnasio]?

### MENSAJE 1 — Primer contacto (estética)
> Hola [Nombre], te escribo desde mod3l.io, somos de Neuquén. Trabajamos con centros de estética que tienen el WhatsApp lleno de consultas de turnos que alguien tiene que responder manualmente todo el día. ¿Es tu caso también?

### MENSAJE 2 — Seguimiento 1 (sin respuesta a las 48hs)
> Hola [Nombre], te mandé un mensaje hace un par de días. Por si no llegaste a verlo: desarrollamos un agente que atiende el WhatsApp de tu negocio automáticamente, las 24 horas. No es un bot básico de respuestas. Agenda turnos, responde consultas y te avisa cuando necesita tu intervención. ¿Tenés 10 minutos esta semana para que te muestre cómo funciona?

### MENSAJE 3 — Seguimiento 2 (sin respuesta a los 5 días)
> [Nombre], última vez que te escribo para no ser molesto. Te dejo esto por si en algún momento te sirve: tenemos 14 días de prueba gratuita para negocios de Neuquén, sin tarjeta ni compromiso. Si en algún momento querés verlo funcionando en tu negocio, escribime y lo armamos esa semana.

### MENSAJE 4 — Recuperación de interesados (+7 días sin cierre)
> Hola [Nombre], ¿cómo va todo? Te propongo algo concreto: activamos los 14 días de prueba gratuita en tu negocio real. Sin tarjeta, sin contrato. En ese tiempo Tally va a estar respondiendo consultas reales de tus clientes reales. Si al final de las dos semanas no ves que vale lo que cuesta, no seguimos. ¿Arrancamos esta semana?

### MENSAJE 5 — Referidos (para clientes activos)
> Hola [Nombre], ¿cómo está funcionando Tally? Si conocés a alguien con un negocio que reciba muchas consultas por WhatsApp y creés que Tally le puede servir, te propongo algo: si esa persona se suma a la prueba y después contrata, el mes que viene lo tenés gratis.

## LinkedIn — Plan de Contenidos 30 Días
> 2 posts semanales = 8 posts. Publicar desde perfil personal del founder.

### POST 1 — Semana 1 — Educativo / Problema
> Un negocio que recibe 50 consultas por WhatsApp por día y las responde manualmente está pagando un costo invisible. 50 mensajes × 3 minutos = 2,5 horas diarias. 2,5 horas × 22 días hábiles = 55 horas al mes. Lo que me sorprende no es que las empresas no lo hayan resuelto. Es que todavía no saben que existe la solución.

### POST 2 — Semana 1 — Historia / Autoridad
> Cuando empezamos a construir Tally, la primera pregunta que nos hicimos fue: ¿por qué los negocios siguen respondiendo WhatsApp manualmente? La respuesta: "porque las soluciones que existen son complicadas, caras o requieren un técnico". Entonces construimos lo opuesto.

### POST 3 — Semana 2 — Caso de uso (consultorio)
> Un consultorio odontológico recibe en promedio 30 consultas por WhatsApp por día. De esas 30: 12 son "¿cuánto sale una limpieza?", 8 son "¿tienen turno el jueves?", 6 son "¿cuál es la dirección?", 4 son consultas reales. Las primeras 26 las puede responder un agente de IA. Las últimas 4 las tiene que responder el profesional. Tally hace exactamente eso.

### POST 5 — Semana 3 — Objección / Contraintuitivo
> "Un bot no puede reemplazar la atención humana." Tienen razón. Y tampoco es lo que propone Tally. El objetivo no es reemplazar a tu equipo. Es liberarlo de las 80 consultas repetitivas para que pueda enfocarse en las 10 que realmente necesitan atención humana.

### POST 6 — Semana 3 — Local / Diferenciador
> Hay docenas de plataformas de automatización de WhatsApp en el mercado. La mayoría son de Buenos Aires, México o España. Nosotros somos de Neuquén. Eso significa que cuando un cliente nuestro tiene un problema, puede llamarnos. En tecnología, la localía importa más de lo que parece.

### POST 8 — Semana 4 — CTA directo
> Estamos buscando 5 negocios en Neuquén para un programa de implementación gratuita de 14 días. El único requisito: que uses WhatsApp Business para atender clientes y que estés dispuesto a darnos feedback honesto. Si al final del período ves resultados, seguimos. Si no, fue gratis.`,
  },
  {
    key: 'trial',
    parentKey: 'lanzamiento',
    title: '4. Trial 14 Días — Secuencia Completa',
    icon: '🔄',
    md: `> Principio rector: Los primeros días generan confianza. El día 7 genera el momento "wow" con datos reales. Del día 12 en adelante hay presión de conversión.

## Resumen de la secuencia
- Día 1 — WA + Email — Bienvenida y activación
- Día 3 — WA — Detectar problemas tempranos
- Día 5 — WA — Anticipación del reporte
- Día 7 — WA + Email — Reporte con datos reales (momento de mayor conversión)
- Día 9 — WA — Prueba social / caso similar
- Día 11 — WA — Pre-cierre + feedback
- Día 12 — WA + Email — Propuesta concreta
- Día 14 — WA + Email — Decisión final

## DÍA 1 — Bienvenida
> Hola [Nombre], soy [tu nombre] de mod3l.io. Tally ya está activo en tu WhatsApp. Desde ahora está atendiendo consultas de tus clientes. Si en algún momento querés que ajuste algo de cómo responde, escribíme y lo hacemos en el día. El día 7 te mando un reporte con todo lo que gestionó Tally en la primera semana. Tenés 14 días de prueba. Sin tarjeta, sin compromiso.

## DÍA 3 — Primer check-in
> Hola [Nombre], ¿cómo va el primer contacto con Tally? ¿Hubo alguna consulta que respondió de una forma que cambiarías? Si hay algo para ajustar, decíme y lo resuelvo hoy.

## DÍA 5 — Valor educativo
> [Nombre], un dato que suele sorprender: la mayoría cree que sus clientes preguntan principalmente por precios. Cuando ven el reporte de la primera semana, descubren que el 40-50% de las consultas son sobre horarios y disponibilidad. El viernes te mando el tuyo. Va a ser interesante compararlo.

## DÍA 7 — El reporte (momento de mayor conversión)
Antes de enviar: entrá al dashboard de Tally y anotá: conversaciones gestionadas, mensajes respondidos automáticamente, tipos de consultas más frecuentes, transferencias a operador humano.

> Hola [Nombre], acá va el reporte de la primera semana de Tally en [nombre del negocio]: Conversaciones gestionadas: [X] — Respondidas sin tu intervención: [X] — Transferidas a vos: [X] — Consulta más frecuente: [la más repetida]. ¿Qué te parece? ¿Algo que te sorprendió?

## DÍA 11 — Pre-cierre + feedback
> Hola [Nombre], el trial vence en 3 días. Antes de que termine quería preguntarte: ¿hay algo que Tally todavía no hizo bien o alguna situación que no supo manejar? Si hay algo para mejorar, prefiero saberlo ahora y resolverlo antes de que decidas si seguís o no.

## DÍA 12 — Propuesta concreta
> [Nombre], en 2 días vence la prueba. Si querés seguir con Tally, el plan Starter son $70.000 por mes. El onboarding ya lo tenés hecho, así que no hay ningún paso extra. ¿Lo activamos para que no haya interrupción en la atención?

## DÍA 14 — Cierre final
> Hola [Nombre], hoy vence la prueba de Tally. Si querés continuar, lo activamos ahora y no hay ninguna interrupción. Si necesitás más tiempo para decidir, también puedo extenderte 3 días más sin costo. ¿Cómo lo manejamos?

## Checklist antes del primer trial
- [ ] Dashboard con métricas por cliente operativo
- [ ] Plantillas de mensajes guardadas en WhatsApp Business
- [ ] Proceso de activación documentado (para que el socio pueda ejecutarlo solo)
- [ ] Criterio definido de qué es una "transferencia exitosa"
- [ ] Extensión de 3 días lista para ofrecer en día 14`,
  },
  {
    key: 'tareas-lanzamiento',
    parentKey: 'lanzamiento',
    title: '5. Tareas de Lanzamiento — Semana 1',
    icon: '✅',
    md: `> Regla: No avanzar a la siguiente semana sin completar los items críticos de la anterior.

## HOY
- [x] Corregir tally.html: cambiar "Free para siempre" por "Prueba gratuita 14 días"
- [x] Cambiar CTA de "Empezá gratis" por "Probá 14 días gratis" en tally.html
- [x] Agregar "14 días de prueba sin costo" en el hero de mod3l.io
- [ ] Guardar los 5 mensajes de WhatsApp como plantillas en el número Business
- [ ] Guardar las 3 versiones de email como borradores
- [x] Compartir este workspace con el socio

## MAÑANA
- [ ] Construir lista de 100 prospectos desde la base de centros médicos
- [ ] Priorizar los primeros 30 (consultorios + gimnasios + estética en Neuquén)
- [ ] Verificar que cada contacto tiene: nombre, rubro, WhatsApp y rubro confirmado
- [ ] Definir precio "cliente fundador" (sugerido: 40% off a cambio de testimonio)

## DÍA 3
- [ ] Enviar los primeros 20 mensajes de primer contacto (máximo 30/día)
- [ ] Publicar POST 1 en LinkedIn
- [ ] Registrar cada contacto en el Pipeline de Prospectos

## DÍA 5
- [ ] Seguimiento a quien no respondió de la primera tanda (Mensaje 2)
- [ ] Enviar 20 mensajes nuevos a la segunda tanda
- [ ] Agendar demos con quien respondió
- [ ] Revisar tasa de respuesta: si es <15%, ajustar el mensaje de primer contacto

## DÍA 7
- [ ] Publicar POST 2 en LinkedIn
- [ ] Revisar pipeline: ¿cuántos respondieron? ¿cuántos demos agendadas?
- [ ] Primera demo realizada (si no, revisar por qué y ajustar)
- [ ] Actualizar estados en Pipeline de Prospectos

## KPIs de la semana 1
- Mensajes enviados: objetivo 50-60
- Tasa de respuesta: >15% (8+ respuestas)
- Demos agendadas: 5+
- Demos realizadas: 3+
- Trials activados: 1+

## Decisiones pendientes antes de ejecutar
- [ ] Confirmar quién hace el onboarding técnico cuando entre el primer cliente
- [ ] Definir SLA de soporte: ¿en cuánto tiempo se responden consultas de clientes?`,
  },
  {
    key: 'medallo',
    parentKey: 'lanzamiento',
    title: '🗞️ Qué Pasa Medallo — Caso de Éxito',
    icon: '🗞️',
    md: `## Datos del medio
Nombre: Qué Pasa Medallo
Tipo: Medio de comunicación digital independiente
Ciudad: Medellín, Colombia
Sitio web: quepasamedallo.com
Redes sociales: Facebook · Twitter/X · YouTube · Instagram (@quepasamedallo_)
Cobertura: Política, justicia, deportes, entretenimiento — Medellín, Antioquia, Colombia y mundo

## Tipo de relación
Modelo: Intercambio estratégico (no cliente pago)
- mod3l.io entrega: Tally gratis + Implementación y configuración + Soporte durante el caso de éxito
- Qué Pasa Medallo entrega: Cobertura periodística + Mención en el medio + Testimonio documentado

> Objetivo estratégico: Generar prueba social con alcance en Colombia y validar Tally en el rubro de medios digitales.

## Estado del proceso
- [x] Contacto inicial
- [ ] Reunión de descubrimiento
- [ ] Preparación de demo
- [ ] Demo realizada
- [ ] Acuerdo de intercambio firmado
- [ ] Número nuevo conseguido (a cargo de ellos)
- [ ] Registro en API de Meta (a cargo del socio)
- [ ] Implementación de Tally
- [ ] Caso de éxito documentado
- [ ] Cobertura publicada

## Checklist de relevamiento — Reunión 1

### Bloque 1 — El canal actual
- [ ] El mensaje "Quiero más información" que llega recurrente — ¿desde dónde vienen esas personas? ¿Del sitio, de redes sociales?
- [ ] ¿Qué información están buscando concretamente cuando mandan ese mensaje?

### Bloque 2 — El problema
- [ ] ¿Los mensajes quedan sin respuesta indefinidamente o hay alguien que responde esporádicamente?
- [ ] ¿Cuántos mensajes calculás que llegan por semana aproximadamente?
- [ ] ¿Hubo algún momento en que eso generó un problema concreto?
- [ ] ¿Por qué decidieron no asignar a nadie para responder hasta ahora?

### Bloque 3 — Los flujos
- [ ] Perro extraviado — ¿Cuál es el flujo ideal? ¿Qué datos necesitan capturar? ¿A quién se transfiere?
- [ ] Persona extraviada — ¿Cuál es el flujo ideal?
- [ ] Pauta / publicidad — ¿Cuál es el flujo ideal?
- [ ] Denuncia ciudadana — ¿Cuál es el flujo ideal?
- [ ] De estos 4 flujos, ¿cuál es el que más les duele no tener resuelto hoy?

### Bloque 4 — El negocio
- [ ] ¿Cuál es el modelo de negocio principal? ¿Publicidad, suscripciones, ambos?
- [ ] ¿El WhatsApp podría ser un canal de ventas de publicidad?
- [ ] ¿Tienen otros canales de atención activos? ¿Email, formulario web, redes?

### Bloque 5 — El número nuevo y la decisión
- [x] ¿Tienen una línea nueva disponible? — Respuesta: Se va a conseguir una para Tally
- [x] ¿Tienen cuenta de Meta Business Manager activa? — Respuesta: Sí
- [x] ¿Quién más está involucrado en esta decisión? — Respuesta: 3 Socios: Carlos (contacto), Mauricio + otra persona
- [ ] ¿Cuál sería el resultado ideal para ustedes si esto funcionara bien?

## Acuerdo de intercambio — Lo que hay que definir
- [ ] Duración del acuerdo: ¿Tally gratis por cuánto tiempo?
- [ ] Forma de la cobertura: ¿nota periodística, mención en redes, entrevista?
- [ ] Plazo de publicación de la cobertura
- [ ] Quién redacta el testimonio: ¿ellos o mod3l.io propone y ellos aprueban?
- [ ] Métricas que se van a compartir en el caso de éxito

## Caso de éxito — Estructura del documento final
1. El medio: Qué es Qué Pasa Medallo, su alcance
2. El problema que tenían: WhatsApp sin atención
3. La solución: Cómo se configuró Tally para un medio digital
4. Los resultados: Consultas respondidas, tipos más frecuentes, tiempo ahorrado
5. El testimonio: Frase directa de quien tomó la decisión
6. La cobertura: Link a la nota publicada`,
  },
]

// ── Migration handler ────────────────────────────────────────────────────────

export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return NextResponse.json({ error: 'No session token' }, { status: 401 })

  const token = session.access_token
  const userId = user.id
  const headers = { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }

  // Get workspace
  const wsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/workspaces?owner_id=eq.${userId}&limit=1&select=id`,
    { headers },
  )
  const workspaces: { id: string }[] = await wsRes.json()
  if (!workspaces.length) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  const workspaceId = workspaces[0].id

  // Check for existing migration (avoid duplicates)
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/pages?workspace_id=eq.${workspaceId}&title=eq.mod3l.io%20%E2%80%94%20Workspace&select=id`,
    { headers },
  )
  const existing: { id: string }[] = await existingRes.json()
  if (existing.length) {
    return NextResponse.json({ error: 'Migration already done — "mod3l.io — Workspace" already exists.' }, { status: 409 })
  }

  // Insert pages in order, tracking IDs for parent linking
  const idMap: Record<string, string> = {}
  const results: { title: string; ok: boolean; error?: string }[] = []

  for (const page of PAGES) {
    const parentId = page.parentKey ? (idMap[page.parentKey] ?? null) : null

    const res = await fetch(`${SUPABASE_URL}/rest/v1/pages`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        parent_id: parentId,
        title: page.title,
        icon: page.icon,
        content: markdownToBlocks(page.md),
        created_by: userId,
        type: 'document',
      }),
    })

    const data = await res.json()
    if (res.ok && Array.isArray(data) && data[0]) {
      idMap[page.key] = data[0].id
      results.push({ title: page.title, ok: true })
    } else {
      results.push({ title: page.title, ok: false, error: data?.message ?? JSON.stringify(data) })
    }
  }

  const failed = results.filter(r => !r.ok)
  return NextResponse.json({
    total: results.length,
    ok: results.filter(r => r.ok).length,
    failed: failed.length,
    results,
  })
}
