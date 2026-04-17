/**
 * LUMIS Logo — L hueca estilizada con gradient pink → purple → indigo.
 *
 * El efecto "outline" se logra con dos paths concéntricos sobre el mismo
 * recorrido: uno grueso coloreado y otro más fino en blanco que recorta el
 * interior, dejando la L hueca. Funciona sobre cualquier fondo claro.
 *
 * Uso:
 *   <LumisLogo />                          // default: 36px + texto
 *   <LumisLogo size={48} />                // más grande
 *   <LumisLogo showText={false} />         // solo el símbolo
 *   <LumisLogo textClassName="text-white"/>// texto blanco sobre fondo oscuro
 */
export function LumisLogo({
  size = 36,
  showText = true,
  textClassName = 'text-slate-900',
  className = '',
  innerStrokeColor = 'white',
}: {
  size?: number
  showText?: boolean
  textClassName?: string
  className?: string
  /** Color del stroke interno que hace el "hueco". Cámbialo a bg-color si el logo va sobre fondo que no es blanco. */
  innerStrokeColor?: string
}) {
  // id único para el gradient, evita colisiones si hay varios logos en la misma page
  const gradientId = `lumis-logo-gradient-${size}`

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-label="LUMIS"
        role="img"
      >
        <defs>
          <linearGradient id={gradientId} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="45%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        {/* Outer colored stroke */}
        <path
          d="M 55 38 L 55 150 Q 55 162 67 162 L 162 162"
          stroke={`url(#${gradientId})`}
          strokeWidth="34"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner cut-out stroke (creates the hollow look) */}
        <path
          d="M 55 38 L 55 150 Q 55 162 67 162 L 162 162"
          stroke={innerStrokeColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span
          className={`font-outfit font-black text-xl tracking-tight ${textClassName}`}
        >
          LUMIS
        </span>
      )}
    </div>
  )
}
