# TU EVENTO — Castellano PH

Web-demo 3D del estudio. La web **es** un evento: un diorama de un salón
flotando en el vacío y el scroll es una cámara de cine que lo recorre en
un plano secuencia de 9 estaciones. Tagline: **Diseñamos soluciones.**

## Correr

```bash
npm i
npm run dev      # http://localhost:5173
npm run build    # dist/
```

Debug de performance: agregá `?fps` a la URL (fps, draw calls, tier).

## Cómo está armado

```
src/
  config.js     ← TODO el contenido: copy, shots, paletas, música, WhatsApp
  main.js       ← boot, loop, calidad adaptativa
  scene/        ← salón (1 draw call de estáticos), crowd, LED, extras, luces
  camera/       ← path de cine (Catmull-Rom + FOV) e imán de scroll
  themes/       ← los 3 modos: misma geometría, otra puesta de luz
  audio/        ← synth procedural por modo + AnalyserNode (bass/mid/treb)
  ui/           ← overlay HTML: gate, nav, dots, cards, footer
  post/         ← bloom + DoF + viñeta (solo desktop, con kill-switch)
```

**Para cambiar contenido** (textos, precios de nada, encuadres, paletas,
música, link de WhatsApp): editá `src/config.js`. La lógica no se toca.

**Para enchufar un track real por modo**: poné la URL en
`modes.<modo>.trackUrl`. Si el stream falla, el synth procedural entra
solo — la experiencia nunca queda muda.

## Reglas de la experiencia

- Gate de entrada: nada suena ni se mueve hasta elegir QUINCE / BODA / CORPORATIVO.
- Cambio de modo en vivo desde la nav, crossfade < 1 s, sin recargar.
- La LED y las luces reaccionan al audio de verdad (AnalyserNode).
- `prefers-reduced-motion`: cortes directos, sin vuelo de cámara.
- Presupuesto: 60 fps en móvil moderno, draw calls < 80, sin sombras
  dinámicas en móvil. Si el fps cae sostenido, el kill-switch baja
  pixelRatio y apaga pases de post.
