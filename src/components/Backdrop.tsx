/**
 * Fondo cinematográfico — reemplaza el campo de partículas.
 *
 * Nada de "partículas IA": una base oscura con un halo de luz que respira
 * lentamente, viñeta de cine y grano de película. La luz es protagonista,
 * pero contenida y de autor. Las secciones aportan el movimiento narrativo.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-ink" />

      {/* Halo de luz que respira (la luz que escribimos). */}
      <div
        className="absolute inset-0 animate-pulseGlow"
        style={{
          background:
            'radial-gradient(45% 38% at 50% 28%, color-mix(in srgb, var(--accent) 11%, transparent), transparent 70%)',
        }}
      />

      {/* Viñeta cinematográfica. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 85% at 50% 45%, transparent 52%, rgba(0,0,0,0.75) 100%)',
        }}
      />

      {/* Grano de película. */}
      <div className="grain" />
    </div>
  );
}
