"use client";

import * as FlagKit from 'react-flag-kit'; // Import the entire module as a namespace

interface FlagIconProps {
  countryCode: string;
  size?: number;
  className?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 24, className }) => {
  if (!countryCode) {
    return null; // Or a placeholder if preferred
  }

  // Dynamically determine the Flag component.
  // It could be the default export (FlagKit.default) or the module itself (FlagKit).
  // We use 'as any' to bypass TypeScript's strict checks for this problematic module.
  const FlagComponent = (FlagKit as any).default || FlagKit;

  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <FlagComponent code={countryCode.toUpperCase()} size={size} />
    </span>
  );
};

export default FlagIcon;