"use client";

import FlagModule from 'react-flag-kit'; // Import the default export

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
  // It could be the default export itself, or a 'Flag' property within the default export.
  // We use 'as any' to bypass TypeScript's strict checks for this problematic module.
  const FlagComponent = (FlagModule as any).Flag || FlagModule;

  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <FlagComponent code={countryCode.toUpperCase()} size={size} />
    </span>
  );
};

export default FlagIcon;