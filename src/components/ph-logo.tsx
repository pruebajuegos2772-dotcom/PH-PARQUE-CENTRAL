type Props = {
  className?: string;
};

/**
 * Logo del PH Parque Central Arraiján dibujado en SVG.
 * No depende de /public, así viaja siempre dentro del código
 * (git, zip y Vercel lo muestran sin archivos extra).
 */
export function PhLogo({ className = "h-11 w-auto" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ${className}`}
      aria-label="PH Parque Central Arraiján"
      role="img"
    >
      <svg viewBox="0 0 220 128" className="h-full w-auto" aria-hidden="true">
        {/* Torres */}
        <g fill="#134e45">
          <rect x="55" y="26" width="30" height="54" rx="1.5" />
          <rect x="90" y="10" width="38" height="70" rx="1.5" />
          <rect x="133" y="26" width="30" height="54" rx="1.5" />
        </g>
        {/* Ventanas torre izquierda */}
        <g fill="#ffffff" opacity="0.95">
          <rect x="60" y="31" width="7" height="6" />
          <rect x="71" y="31" width="7" height="6" />
          <rect x="60" y="40" width="7" height="6" />
          <rect x="71" y="40" width="7" height="6" />
          <rect x="60" y="49" width="7" height="6" />
          <rect x="71" y="49" width="7" height="6" />
          <rect x="60" y="58" width="7" height="6" />
          <rect x="71" y="58" width="7" height="6" />
          <rect x="60" y="67" width="7" height="6" />
          <rect x="71" y="67" width="7" height="6" />
        </g>
        {/* Ventanas torre central */}
        <g fill="#ffffff" opacity="0.95">
          <rect x="95" y="15" width="6" height="5" />
          <rect x="105" y="15" width="6" height="5" />
          <rect x="115" y="15" width="6" height="5" />
          <rect x="95" y="23" width="6" height="5" />
          <rect x="105" y="23" width="6" height="5" />
          <rect x="115" y="23" width="6" height="5" />
          <rect x="95" y="31" width="6" height="5" />
          <rect x="105" y="31" width="6" height="5" />
          <rect x="115" y="31" width="6" height="5" />
          <rect x="95" y="39" width="6" height="5" />
          <rect x="105" y="39" width="6" height="5" />
          <rect x="115" y="39" width="6" height="5" />
          <rect x="95" y="47" width="6" height="5" />
          <rect x="105" y="47" width="6" height="5" />
          <rect x="115" y="47" width="6" height="5" />
          <rect x="95" y="55" width="6" height="5" />
          <rect x="105" y="55" width="6" height="5" />
          <rect x="115" y="55" width="6" height="5" />
          <rect x="95" y="63" width="6" height="5" />
          <rect x="105" y="63" width="6" height="5" />
          <rect x="115" y="63" width="6" height="5" />
        </g>
        {/* Ventanas torre derecha */}
        <g fill="#ffffff" opacity="0.95">
          <rect x="138" y="31" width="7" height="6" />
          <rect x="149" y="31" width="7" height="6" />
          <rect x="138" y="40" width="7" height="6" />
          <rect x="149" y="40" width="7" height="6" />
          <rect x="138" y="49" width="7" height="6" />
          <rect x="149" y="49" width="7" height="6" />
          <rect x="138" y="58" width="7" height="6" />
          <rect x="149" y="58" width="7" height="6" />
          <rect x="138" y="67" width="7" height="6" />
          <rect x="149" y="67" width="7" height="6" />
        </g>
        {/* Cinta principal */}
        <rect x="18" y="82" width="184" height="27" rx="2" fill="#134e45" />
        <text
          x="110"
          y="100"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="800"
          fontSize="16.5"
          letterSpacing="0.5"
        >
          <tspan fill="#ffffff">PARQUE </tspan>
          <tspan fill="#e8914a">CENTRAL</tspan>
        </text>
        <text
          x="110"
          y="122"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="10"
          letterSpacing="4"
          fill="#8a9a96"
        >
          ARRAIJAN
        </text>
      </svg>
    </span>
  );
}
