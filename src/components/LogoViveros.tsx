'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoViverosProps {
  size?: 'sm' | 'md' | 'nav' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
}

const LogoViveros: React.FC<LogoViverosProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false,
  textSize = 'md' 
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    nav: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24 md:w-32 md:h-32'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  const fallbackSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    nav: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };

  if (imageError) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={fallbackSizes[size]}>🏢</div>
        {showText && (
          <div>
            <h1 className={`font-bold ${textSizeClasses[textSize]}`}>
              Viveros Unidos
            </h1>
            <p className="text-xs opacity-75">Cooperativa de Trabajo</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        <Image
          src="/images/logo-viveros.png"
          alt="Viveros Unidos - Cooperativa de Trabajo"
          fill
          className="object-contain"
          priority={size === 'xl'}
          onError={() => setImageError(true)}
        />
      </div>
      {showText && (
        <div>
          <h1 className={`font-bold ${textSizeClasses[textSize]}`}>
            Viveros Unidos
          </h1>
          <p className="text-xs opacity-75">Cooperativa de Trabajo</p>
        </div>
      )}
    </div>
  );
};

export default LogoViveros;
