import React from 'react';
import Link from 'next/link';

interface AgencyFlowLogoProps {
  height?: number;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AgencyFlowLogo({ height = 36, href = '/', className = '', style }: AgencyFlowLogoProps) {
  const logoContent = (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '4px 12px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
        height: `${height}px`,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <img
        src="/agencyflow-logo.png"
        alt="AgencyFlow"
        style={{
          height: '100%',
          width: 'auto',
          maxHeight: `${height - 10}px`,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
