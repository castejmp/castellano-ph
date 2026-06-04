# Castellano PH — La luz se vuelve experiencia

Sitio one-page de **Castellano PH**, estudio creativo de eventos (Villa María, Córdoba 🇦🇷).
No es un portfolio de fotógrafo: es una pieza audiovisual en sí misma. La web está
construida como una **película en 3 actos** — uno por cada pilar del estudio — y cada
acto tiene su **propio eje de movimiento** para que el scroll cuente una historia gráfica:

1. **CAPTURA** → parallax horizontal (travelling de cámara) — foto, video, drone, fotos en vivo.
2. **DISEÑO** → parallax vertical hacia arriba (las piezas se construyen) — identidad, visuales, web/RSVP.
3. **EXPERIENCIA** → túnel en profundidad (entrás al show) — mapping, AR/VR y `pulse.show`.

> No cubrimos tu evento. Lo diseñamos.

## Stack

- **React + Vite + TypeScript**
- **GSAP + ScrollTrigger** — pin + parallax horizontal (Captura) y túnel 3D (Experiencia)
- **Lenis** — smooth scroll, sincronizado con ScrollTrigger
- **Framer Motion** — parallax vertical (Diseño), reveals, tipografía cinética, micro-interacciones
- **Tailwind CSS** — sistema de diseño
- Fondo cinematográfico con CSS (halo de luz + viñeta + grano de película), sin WebGL

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo (http://localhost:5173)
npm run build    # build de producción → dist/
npm run preview  # previsualizar el build
npm run lint     # typecheck (tsc --noEmit)
```

## Cómo editar el contenido

Todo lo que probablemente quieras tocar está centralizado:

| Qué | Dónde |
| --- | --- |
| WhatsApp, email, Instagram, ubicación | `src/config.ts` |
| Color de marca (acento) | `src/config.ts` (`BRAND`) y `src/index.css` (`--accent`) |
| Mostrar precios en los packs | `src/config.ts` → `SHOW_PRICES` |
| Nota legal (dólar oficial) | `src/config.ts` → `LEGAL_NOTE` |
| Packs y proceso | `src/data/content.ts` |
| Contenido de los 3 actos | `src/sections/pillars/*.tsx` (arrays `SHOTS`, `COLUMNS`, `LAYERS`) |

### Reemplazar los placeholders por obra real

Los 3 actos usan placeholders con gradientes. Para usar fotos/videos reales,
reemplazá el `background` de cada tarjeta por tu media en:

- `src/sections/pillars/Captura.tsx` (`SHOTS`)
- `src/sections/pillars/Diseno.tsx` (`COLUMNS`)
- `src/sections/pillars/Experiencia.tsx` (`LAYERS`)

## Concepto: los 3 actos

Cada acto es un componente con su propio eje de movimiento (ScrollTrigger / Framer):

- `src/sections/pillars/Captura.tsx` — pin + parallax **horizontal** (capas a distinta velocidad).
- `src/sections/pillars/Diseno.tsx` — parallax **vertical** por columnas (`useScroll` + `useTransform`).
- `src/sections/pillars/Experiencia.tsx` — **túnel 3D** con `perspective` + planos en `translateZ`.
- `src/components/Backdrop.tsx` — fondo cinematográfico (halo + viñeta + grano), sin WebGL.

## Performance, accesibilidad y responsive

- **`prefers-reduced-motion`** → sin pins ni túnel; cada acto cae a un layout estático legible.
- **Mobile** → Captura con swipe nativo, Experiencia como lista vertical (sin 3D).
- Bundle liviano (~147 KB gzip): se quitó three.js, el peso visual va por GSAP/CSS.
- Foco visible para teclado, `cursor-pointer`, contraste AA, `lang="es-AR"`, meta + Open Graph.

## Pendiente para producción

- Agregar `public/og-image.png` (1200×630) para el preview en redes (referenciado en `index.html`).
- Cargar el número real de WhatsApp en `src/config.ts`.
- Reemplazar los placeholders de los 3 actos por fotos/videos reales.
