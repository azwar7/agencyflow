import React from 'react';
import Link from 'next/link';

interface AgencyFlowLogoProps {
  height?: number;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
  showWordmark?: boolean;
}

export default function AgencyFlowLogo({
  height = 36,
  href = '/',
  className = '',
  style,
  showWordmark = true,
}: AgencyFlowLogoProps) {
  const brandContent = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <img
        src="/official-agencyflow-logo.jpg?v=5"
        alt="AgencyFlow Logo"
        className={className}
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          margin: 0,
          padding: 0,
          borderRadius: '4px',
          ...style,
        }}
      />
      {showWordmark && (
        <span
          style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: `${Math.max(18, Math.round(height * 0.65))}px`,
            fontWeight: 700,
            color: '#e2e2e8',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          AgencyFlow
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
        {brandContent}
      </Link>
    );
  }

  return brandContent;
}
