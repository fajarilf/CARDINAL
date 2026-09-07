// Brand glyphs: the crow's-foot "many" mark (one CARDINAL -> many connections)
// and a one-to-many cardinality terminal.

export function CrowsFoot({
  size = 22,
  className = "",
  strokeWidth = 1.75,
}: {
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12h9" />
      <path d="M11 12l10-6.5" />
      <path d="M11 12h10" />
      <path d="M11 12l10 6.5" />
    </svg>
  );
}

export function CardinalityGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size * 2.1}
      height={size}
      viewBox="0 0 42 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 10h9" />
      <path d="M8 4.5v11" />
      <path d="M24 10h6" />
      <path d="M30 10l10-6" />
      <path d="M30 10h10" />
      <path d="M30 10l10 6" />
    </svg>
  );
}
