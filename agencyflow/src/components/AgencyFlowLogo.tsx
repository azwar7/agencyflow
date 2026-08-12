import React from 'react';
import Link from 'next/link';

interface AgencyFlowLogoProps {
  height?: number;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AgencyFlowLogo({ height = 36, href = '/', className = '', style }: AgencyFlowLogoProps) {
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
        margin: 0,
        padding: 0,
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
