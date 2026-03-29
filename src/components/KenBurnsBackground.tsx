import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface KenBurnsBackgroundProps {
  images: string[];
  duration?: number; // Duration of each slide in ms
  overlayOpacity?: number; // Black opacity to ensure readability over the images
  className?: string; // Optional wrapper class
}

export function KenBurnsBackground({
  images,
  duration = 8000,
  overlayOpacity = 0.6,
  className = "",
}: KenBurnsBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, duration);

    return () => clearInterval(interval);
  }, [images.length, duration]);

  if (!images || images.length === 0) return null;

  return (
    <div className={`ken-burns-wrapper ${className}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <AnimatePresence mode="popLayout">
        {images.map(
          (img, index) =>
            index === currentIndex && (
              <motion.div
                key={`${img}-${index}`}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1.0 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{
                  opacity: { duration: 2, ease: "easeInOut" },
                  scale: { duration: duration / 1000 + 2, ease: "linear" },
                }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <img
                  src={img}
                  alt="Cinematic Background"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </motion.div>
            )
        )}
      </AnimatePresence>

      {/* Primary Dimming Overlay */}
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(6, 6, 10, ${overlayOpacity})` }}
      />
      
      {/* Void gradient vignette for blending the edges into the Ultra-Premium UI */}
      <div 
        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #06060a, transparent)' }} 
      />
    </div>
  );
}

export default KenBurnsBackground;
