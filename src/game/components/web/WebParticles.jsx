import React from 'react';

export default function WebParticles({ particles }) {
  return (
    <>
      {particles.map((part) => (
        <circle key={part.id} cx={part.x} cy={part.y} r={part.radius} fill={part.color} opacity={part.alpha} />
      ))}
    </>
  );
}
