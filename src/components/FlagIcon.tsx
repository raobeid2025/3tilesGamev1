"use client";

import * as FlagKit from 'react-flag-kit'; // Importing the entire module as a namespace

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
      <FlagKit.Flag code={countryCode.toUpperCase()} size={size} />
    </span>
  );
};

export default FlagIcon;