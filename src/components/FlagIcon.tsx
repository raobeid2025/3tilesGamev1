"use client";

import Flag = require('react-flag-kit'); // Using TypeScript-specific CommonJS import

interface FlagIconProps {
  countryCode: string;
  size?: number;
  className?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 24, className }) => {
  if (!countryCode) {
    return null; // Or a placeholder if preferred
  }
  return (
    <span className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <Flag code={countryCode.toUpperCase()} size={size} />
    </span>
  );
};

export default FlagIcon;