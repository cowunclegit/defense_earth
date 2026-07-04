import React from 'react';
let Circle; try { const S = require('@shopify/react-native-skia'); Circle = S.Circle; } catch(e) {}

export default function SkiaParticles({ particles }) {

  return (
    <>
      {particles.map((part) => (
        <Circle key={part.id} cx={part.x} cy={part.y} r={part.radius} color={part.color} opacity={part.alpha} />
      ))}
    </>
  );
}
