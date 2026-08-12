import React from 'react';
import Link from 'next/link';

interface AgencyFlowLogoProps {
  height?: number;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AgencyFlowLogo({ height = 32, href = '/', className = '', style }: AgencyFlowLogoProps) {
  const logoImage = (
    <img
      src="/agencyflow-logo-transparent.png"
      alt="AgencyFlow"
      className={className}
      style={{
        height: `${height}px`,
        width: 'auto',
        objectFit: 'contain',
        display: 'block',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        filter: 'drop-shadow(0 2px 8px rgba(99, 68, 245, 0.15))',
        ...style,
      }}
    />
  );

  if (href) {
    return (
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', background: 'transparent' }}>
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}
