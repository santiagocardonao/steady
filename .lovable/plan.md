# Olmo Gym — PWA de seguimiento de gimnasio

App móvil instalable, en español, para registrar peso corporal, agua y ejercicios, con dashboards de progreso. Backend en Lovable Cloud (base de datos + login con email, datos aislados por usuario).

## Fase 1 — Backend y datos

Tablas: `perfiles`, `categorias`, `ejercicios`, `entrenamientos`, `series`, `peso_corporal`, `agua`, con seguridad por fila (cada usuario solo ve lo suyo), permisos explícitos y trigger que crea el perfil al registrarse.

Semillas incluidas en la misma migración: 12 categorías (9 de fuerza, 3 de cardio) y los ~50 ejercicios predefinidos del brief (globales, `user_id = null`).

## Fase 2 — Autenticación

Pantalla `/auth`: registro, inicio de sesión y recuperación de contraseña. Sesión persistente. Rutas de la app protegidas; si no hay sesión, redirige a `/auth`.

## Fase 3 — Sistema de diseño OLMO

Tokens exactos del brief como variables CSS (violeta → índigo, canvas #EFEFEF, radios pill, sombras suaves, easing). Solo modo claro. Inter (200–900) + Source Serif 4 itálica cargadas vía `<link>` en la raíz. Iconos Phosphor Fill. Botón CTA con degradado, mayúsculas y tracking amplio; titulares con degradado sobre el texto.

## Fase 4 — Navegación

Barra inferior fija tipo pill flotante con 3 secciones: Perfil, Dashboards, Medición. Medición con control segmentado Peso · Agua · Ejercicios. Mobile-first, áreas táctiles ≥44px.

## Fase 5 — Medición

- **Peso:** un registro por día (editable), IMC calculado al instante, histórico reciente.
- **Agua:** progreso del día con anillo, botón grande `+1 vaso` y `−1 vaso`, vasos y litros (1 vaso = 250 ml).
- **Ejercicios:** categoría → ejercicio (predefinido o nuevo propio) → series con reps + kg (fuerza) o RPE 1–10 + minutos (cardio), notas y fecha editable. Panel "Última vez" con el registro anterior de ese ejercicio. Historial del día.

## Fase 6 — Dashboards

Filtro de rango (Semana · Mes · 3 meses · Todo) y 5 paneles con Recharts:
1. Frecuencia de entrenamiento: días, promedio/semana, racha actual y mejor, calendario heatmap.
2. Tendencia de peso: línea, peso actual, cambio en el rango, distancia al objetivo.
3. Cumplimiento de agua: promedio de vasos, días cumplidos, % y barras diarias.
4. Minutos de cardio por semana: barras, total y RPE promedio.
5. Progresión de fuerza: selector de ejercicio, mejor peso por sesión, volumen total, PR.

Estados vacíos amables cuando no hay datos.

## Fase 7 — Perfil y PWA

Perfil: nombre, estatura, meta de peso (bajar/subir/mantener), peso objetivo, meta diaria de agua, resumen de peso e IMC con categoría, cerrar sesión.

PWA: manifest (`Olmo Gym`, standalone, portrait, theme #7C3AED, background #EFEFEF), iconos 192/512 + maskable con la marca Olmo, service worker que cachea el app shell para señal intermitente.

## Notas técnicas

- Stack fijo: TanStack Start + React + Tailwind v4 + shadcn/ui; datos vía Lovable Cloud con lecturas/escrituras desde el cliente bajo RLS y TanStack Query para caché.
- Rutas: `/` = Medición (pantalla inicial), `/dashboards`, `/perfil`, `/auth`; layout autenticado con la barra inferior.
- Los cálculos (IMC, rachas, agregaciones semanales, PR) se hacen en el cliente sobre los registros del usuario; sin lógica duplicada en SQL.
- Iconos PWA generados como imágenes del proyecto en `public/`; service worker registrado tras la hidratación.
