# Checkpoints

Puntos de restauración del proyecto. Para volver a uno:

```bash
git checkout <hash>            # mirar ese estado
git reset --hard <hash>        # volver la rama a ese estado (destructivo)
git revert <hash>..HEAD        # deshacer lo posterior sin reescribir historia
```

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
