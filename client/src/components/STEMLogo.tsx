import React from 'react';
import { Link } from 'react-router-dom';

interface STEMLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  withLink?: boolean;
  className?: string;
}

export const STEMLogo: React.FC<STEMLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  withLink = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-10 w-auto',
    md: 'h-14 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto',
  };

  const content = (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src="/brand/stempact_logo.jpg"
        alt="STEMPACT ACADEMY - Stem Skills for Real World Impact"
        className={`${sizeClasses[size]} object-contain drop-shadow-sm rounded-lg transition-transform duration-200 hover:scale-105`}
        loading="eager"
      />
      {showSubtitle && size !== 'sm' && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-900 leading-tight text-lg">
            STEMPACT <span className="text-blue-600">ACADEMY</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-600 tracking-wide">
            Stem Skills for Real World Impact
          </span>
          <span className="text-[9px] font-bold text-rose-800 uppercase tracking-wider">
            Ile-Ife • Osun State • Nigeria
          </span>
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link to="/" className="inline-flex items-center transition-opacity hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
};
