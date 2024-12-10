import React from 'react';

export const BackgroundGrid = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div 
      className="absolute w-[300vw] h-[200vh]"
      style={{
        backgroundColor: '#1a1d21',
        backgroundImage: `
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        transform: 'perspective(1000px) rotateX(60deg) scale(0.9)',
        transformOrigin: 'center center',
        backgroundPosition: 'center center',
        left: '-100vw',
        top: '-70vh'
      }}
    />
  </div>
);

