import React, { memo } from 'react';

const WebParticles = memo(function WebParticles({ particles }) {
  return (
    <>
      {particles.map((part) => (
        <circle key={part.id} cx={part.x} cy={part.y} r={part.radius} fill={part.color} opacity={part.alpha} />
      ))}
    </>
  );
});

export default WebParticles;

