import { useEffect, useState } from 'react';

export function AmbientOrbs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="ambient-orbs-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 0, // Should be behind the general application layer
    }}>
      <div className="orb orb-cyan" style={{
        position: 'absolute',
        top: '10%',
        left: '-10%',
        width: '60vw',
        height: '60vw',
        maxWidth: '800px',
        maxHeight: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, rgba(6, 182, 212, 0) 70%)',
        filter: 'blur(120px)',
        animation: 'floatOrb 30s ease-in-out infinite alternate',
      }} />
      <div className="orb orb-purple" style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '70vw',
        height: '70vw',
        maxWidth: '1000px',
        maxHeight: '1000px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.06) 0%, rgba(147, 51, 234, 0) 70%)',
        filter: 'blur(120px)',
        animation: 'floatOrbReverse 40s ease-in-out infinite alternate',
      }} />
    </div>
  );
}
