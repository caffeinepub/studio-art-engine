import { useEffect, useRef, useState } from 'react';

export default function GlossyHeroText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(0.5);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      
      // Cancel any pending animation frame
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }

      // Schedule update on next frame
      rafRef.current = requestAnimationFrame(() => {
        setMouseX(Math.max(0, Math.min(1, x)));
      });
    };

    container.addEventListener('pointermove', handlePointerMove);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block cursor-default select-none">
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter">
        <span className="glossy-text-base">GENESIS</span>
        <span className="glossy-text-base text-muted-foreground">.ENGINE</span>
      </h1>
      
      {/* Glossy reflection overlay */}
      <div
        className="glossy-reflection pointer-events-none"
        style={{
          '--shine-x': `${mouseX * 100}%`,
        } as React.CSSProperties}
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter">
          <span>GENESIS</span>
          <span className="text-muted-foreground">.ENGINE</span>
        </h1>
      </div>
    </div>
  );
}
