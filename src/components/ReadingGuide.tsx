import React, { useEffect, useState } from 'react';

interface ReadingGuideProps {
  enabled: boolean;
}

export const ReadingGuide: React.FC<ReadingGuideProps> = ({ enabled }) => {
  const [mouseY, setMouseY] = useState<number>(-100);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  if (!enabled || mouseY < 0) return null;

  return (
    <div
      className="fixed left-0 right-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out"
      style={{
        top: `${mouseY}px`,
        transform: 'translateY(-50%)',
      }}
      aria-hidden="true"
    >
      {/* Upper shadow mask */}
      <div className="w-full h-10 bg-slate-900/10 dark:bg-slate-100/5 -mt-10" />
      
      {/* Central reading line window */}
      <div className="w-full h-9 border-y-2 border-amber-500/80 bg-amber-400/10 shadow-[0_0_12px_rgba(245,158,11,0.25)] flex items-center justify-between px-4">
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-600 dark:text-amber-300 opacity-60">
          Reading Focus Guide
        </span>
        <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-600 dark:text-amber-300 opacity-60">
          Line Ruler
        </span>
      </div>

      {/* Lower shadow mask */}
      <div className="w-full h-10 bg-slate-900/10 dark:bg-slate-100/5" />
    </div>
  );
};
