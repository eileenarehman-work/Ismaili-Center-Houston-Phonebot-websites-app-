import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightText = false,
}) => {
  // Height classes for responsive presentation
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-14',
    xl: 'h-20',
  };

  const selectedHeight = heightClasses[size] || heightClasses.md;

  if (!showText) {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        {lightText ? (
          <img
            src="/ismaili-emblem-dark.png"
            alt="Ismaili Center Houston Emblem"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105`}
          />
        ) : (
          <>
            <img
              src="/ismaili-emblem.png"
              alt="Ismaili Center Houston Emblem"
              className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 block dark:hidden`}
            />
            <img
              src="/ismaili-emblem-dark.png"
              alt="Ismaili Center Houston Emblem"
              className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 hidden dark:block`}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {lightText ? (
        <img
          src="/ismaili-official-logo-dark.png"
          alt="Ismaili Center Houston"
          className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105`}
        />
      ) : (
        <>
          <img
            src="/ismaili-official-logo.png"
            alt="Ismaili Center Houston"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 block dark:hidden`}
          />
          <img
            src="/ismaili-official-logo-dark.png"
            alt="Ismaili Center Houston"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 hidden dark:block`}
          />
        </>
      )}
    </div>
  );
};

