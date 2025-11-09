import React from 'react';
import Image from 'next/image';

const Logo = ({ className, logoUrl }: { className?: string; logoUrl?: string | null }) => {
  if (logoUrl) {
    return <Image src={logoUrl} alt="Logo" width={128} height={32} className={className} priority />;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 240 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tlemcen Smart Supermarket Logo"
    >
      <path
        d="M23.1167 33.6667C24.8885 33.6667 26.3333 32.2219 26.3333 30.45V11.2167H33V8H20.1167V11.2167H26.3333V27.4H20.1167V30.45C20.1167 32.2219 21.5615 33.6667 23.1167 33.6667Z"
        className="fill-primary"
      />
      <path
        d="M5.5 12.1167V8.89999H16.8333V12.1167H11.1667V30.45H7.71667V12.1167H5.5Z"
        className="fill-foreground"
      />
      <text
        x="40"
        y="26"
        className="font-headline text-[24px] fill-foreground"
      >
        Tlemcen Smart
      </text>
    </svg>
  );
};

export default Logo;
