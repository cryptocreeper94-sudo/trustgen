import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function CustomCursor() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    // Check if device is desktop (min-width: 1024px) AND naturally supports a hover state
    const mediaQuery = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    setIsDesktop(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isDesktop || !cursorDotRef.current || !cursorRingRef.current) {
      document.body.classList.remove('custom-cursor-active');
      return;
    }

    document.body.classList.add('custom-cursor-active');

    // Setup hardware-accelerated GSAP quickTo setters
    const xDotSetter = gsap.quickTo(cursorDotRef.current, "x", { duration: 0.1, ease: "power3" });
    const yDotSetter = gsap.quickTo(cursorDotRef.current, "y", { duration: 0.1, ease: "power3" });
    const xRingSetter = gsap.quickTo(cursorRingRef.current, "x", { duration: 0.4, ease: "power3" });
    const yRingSetter = gsap.quickTo(cursorRingRef.current, "y", { duration: 0.4, ease: "power3" });

    const onMouseMove = (e: MouseEvent) => {
      // Offset by half dimensions to center
      xDotSetter(e.clientX - 4);
      yDotSetter(e.clientY - 4);
      xRingSetter(e.clientX - 16);
      yRingSetter(e.clientY - 16);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // If hovering over interactive elements, expand the ring
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('interactive') ||
        getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      <div 
        ref={cursorDotRef}
        className="custom-cursor-dot"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          backgroundColor: '#06b6d4', // Cyan
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 999999,
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
        }}
      />
      <div 
        ref={cursorRingRef}
        className={`custom-cursor-ring ${isHovering ? 'hovering' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '32px',
          height: '32px',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 999998,
          transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s',
          ...(isHovering ? {
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(6, 182, 212, 0.05)',
            borderColor: 'rgba(6, 182, 212, 0.8)',
            transform: 'translate(-8px, -8px)', // Adjust for new size offsetting
          } : {})
        }}
      />
    </>
  );
}
