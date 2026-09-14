import React, { useState } from 'react';
import { LOGO_ASSETS } from '../assets/logoAssets';

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
  // Fallback states in case of network/path resolution failures
  const [emblemDarkSrc, setEmblemDarkSrc] = useState(LOGO_ASSETS.emblemDark);
  const [emblemLightSrc, setEmblemLightSrc] = useState(LOGO_ASSETS.emblemLight);
  const [logoDarkSrc, setLogoDarkSrc] = useState(LOGO_ASSETS.logoDark);
  const [logoLightSrc, setLogoLightSrc] = useState(LOGO_ASSETS.logoLight);

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
            src={emblemDarkSrc}
            onError={() => setEmblemDarkSrc(LOGO_ASSETS.fallbackEmblemDark)}
            alt="Ismaili Center Houston Emblem"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105`}
          />
        ) : (
          <>
            <img
              src={emblemLightSrc}
              onError={() => setEmblemLightSrc(LOGO_ASSETS.fallbackEmblemLight)}
              alt="Ismaili Center Houston Emblem"
              className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 block dark:hidden`}
            />
            <img
              src={emblemDarkSrc}
              onError={() => setEmblemDarkSrc(LOGO_ASSETS.fallbackEmblemDark)}
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
          src={logoDarkSrc}
          onError={() => setLogoDarkSrc(LOGO_ASSETS.fallbackLogoDark)}
          alt="Ismaili Center Houston"
          className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105`}
        />
      ) : (
        <>
          <img
            src={logoLightSrc}
            onError={() => setLogoLightSrc(LOGO_ASSETS.fallbackLogoLight)}
            alt="Ismaili Center Houston"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 block dark:hidden`}
          />
          <img
            src={logoDarkSrc}
            onError={() => setLogoDarkSrc(LOGO_ASSETS.fallbackLogoDark)}
            alt="Ismaili Center Houston"
            className={`${selectedHeight} w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105 hidden dark:block`}
          />
        </>
      )}
    </div>
  );
};


