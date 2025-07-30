import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo = ({ size = 'md', className = '' }: LogoProps) => {
  const emojiSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={emojiSizeClasses[size]} role="img" aria-label="brain">
        🧠
      </span>
    </div>
  );
};

export default Logo;
