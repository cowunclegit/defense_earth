import React from 'react';
import { Circle } from '@shopify/react-native-skia';

export default function SkiaParticles({ particles }) {

  return (
    <>
      {particles.map((part) => (
        <Circle key={part.id} cx={part.x} cy={part.y} r={part.radius} color={part.color} opacity={part.alpha} />
      ))}
    </>
  );
}
