# Castellano PH — La luz se vuelve experiencia

Sitio one-page de **Castellano PH**, estudio creativo de eventos (Villa María, Córdoba 🇦🇷).
No es un portfolio de fotógrafo: es, en sí mismo, una demo de la capacidad técnica del
estudio. Un campo de partículas WebGL recorre toda la web como hilo conductor —
nace difuso, se condensa en figuras para cada servicio y termina pulsando al ritmo del
audio en el **Modo Vivo**.

> No cubrimos tu evento. Lo diseñamos.

## Stack

- **React + Vite + TypeScript**
- **three.js** vía `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` (Bloom)
- **GSAP + ScrollTrigger** — scroll horizontal del portfolio, pin, timeline del proceso
- **Lenis** — smooth scroll, sincronizado con ScrollTrigger
- **Framer Motion** — micro-interacciones, reveals y tipografía cinética
- **Tailwind CSS** — sistema de diseño
- **Web Audio API** — análisis de audio del Modo Vivo (micrófono o demo sintético)

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
| Servicios, packs, trabajos, proceso | `src/data/content.ts` |

### Reemplazar los placeholders del portfolio

Las piezas en `WORKS` (`src/data/content.ts`) hoy usan gradientes generativos.
Para usar fotos/videos reales, agregá el campo de media y reemplazá el placeholder
en `src/sections/Portfolio.tsx` (componente `WorkCard`).

## Concepto: el campo de partículas

- `src/three/particleShaders.ts` — shaders (morphing, ruido simplex, audio, repulsión del puntero).
- `src/three/particleShapes.ts` — las figuras hacia las que morfea (diafragma, filmstrip, hélice, grilla, web, volumen, waveform, monograma).
- `src/three/ParticleField.tsx` — el sistema de puntos y su lógica de animación.
- `src/three/audioEngine.ts` — el Modo Vivo: micrófono con fallback a un track de demo sintético.
- `src/state/ExperienceContext.tsx` — estado compartido (Modo Vivo, puntero, figura activa).

Cada sección, al entrar en viewport, le pide al campo que morfee a la figura que le
corresponde (`useSectionShape`).

## Performance, accesibilidad y responsive

- **`prefers-reduced-motion`** → sin partículas reactivas ni scroll-jacking; gradiente animado estático.
- **Mobile** → menos partículas, menor `dpr`, portfolio con swipe nativo.
- **Bloom** y conteo de partículas escalados por dispositivo.
- Contraste AA sobre fondo oscuro, foco visible en inputs, `lang="es-AR"`, meta + Open Graph.

## Pendiente para producción

- Agregar `public/og-image.png` (1200×630) para el preview en redes (referenciado en `index.html`).
- Cargar el número real de WhatsApp en `src/config.ts`.
- Subir fotos/videos reales al portfolio.
