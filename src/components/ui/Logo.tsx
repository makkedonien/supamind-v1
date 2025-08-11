import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

const Logo = ({ size = 'md', className = '', showText = false, onClick }: LogoProps) => {
  const emojiSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const baseClasses = `flex items-center ${showText ? 'space-x-2' : 'justify-center'}`;
  const clickableClasses = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      <span className={emojiSizeClasses[size]} role="img" aria-label="brain">
        🧠
      </span>
      {showText && (
        <span className={`font-semibold text-gray-900 ${textSizeClasses[size]}`}>
          Supamind
        </span>
      )}
    </div>
  );
};

export default Logo;
