import React from 'react';

let Circle;
try {
  const Skia = require('@shopify/react-native-skia');
  Circle = Skia.Circle;
} catch (e) {}

export default function SkiaParticles({ particles }) {
  if (!Circle) return null;
  return (
    <>
      {particles.map((part) => (
        <Circle key={part.id} cx={part.x} cy={part.y} r={part.radius} color={part.color} opacity={part.alpha} />
      ))}
    </>
  );
}
