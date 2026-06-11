# Checkpoints

Puntos de restauración del proyecto. Para volver a uno:

```bash
git checkout <hash>            # mirar ese estado
git reset --hard <hash>        # volver la rama a ese estado (destructivo)
git revert <hash>..HEAD        # deshacer lo posterior sin reescribir historia
```

---

## CHECKPOINT 2 — "retro + marca calcada" · 2026-06-11

**Commit:** `53d6fd3`

Estado previo a la etapa de modificación de COLORES:

- Estética RETRO fija (PS1 480: render interno 480 px reescalado
  nearest, 5 bits/canal con dithering Bayer). Pantallas LED sin
  grilla de lamparitas en retro (anti-moiré, patrón 44×18).
- Marca calcada a mano (brand.js): wordmark geométrico letra por
  letra + isotipo |o| proporcionado. Presente en gate, nav, piso
  (×2 + |o| central) y LED. Sistema listo para PNG reales en
  public/brand/ (pisan el calco en todos lados).
- Hero sin tagline; placa final sin la frase del mapa, con
  HABLEMOS · IG · VER MÁS.
- Livings +50% (1.28 m). Spotlight de edición ×2 de ancho.
- Shot de diseño cenital; móvil con protagonista en mitad superior.
- Flashes paparazzi aleatorios; mute; POV drone; copy definitivo.
- Fix importante: EffectComposer.setPixelRatio al cambiar resolución.

**Pendiente conocido:** PNGs reales de los logos (como archivo).

---

## CHECKPOINT 1 — "web segura" · 2026-06-11

**Commit:** `7e3b556`

Estado estable y completo de TU EVENTO, antes de la etapa de
experimentos:

- 9 estaciones con cámara de cine, imán de scroll direccional, POV de
  drone en la estación 6.
- 3 modos (quince / boda / corporativo): puesta de luz + synth
  procedural audio-reactivo, crossfade en vivo, botón de mute.
- Elenco GLB completo: 2 fotógrafos (flashes paparazzi aleatorios),
  filmmaker, VJ, diseñador, DJ con mixer, editores ×2 con su mesa.
- 10 invitados GLB en la pista + 3 en la barra; 6 mesas GLB entre
  pista y barra + 6 livings GLB en los laterales.
- 3 pantallas LED reactivas: principal + 2 curvas en las esquinas
  (mismo ancho de arco, sin espejado), iconos por estación.
- Branding: wordmark en el piso a ambos lados de la pista + isotipo
  |o| en el centro. Sistema de calco listo (public/brand/*.png).
- Spotlight "jugador seleccionado" con DoF y paneo orbital suave.
- Hero "BIENVENIDO A / TU EVENTO" + placa final centrada con CTAs.

**Pendiente conocido:** calco de los logos reales (esperando PNGs).
