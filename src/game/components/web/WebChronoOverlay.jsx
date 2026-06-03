import React from 'react';

export default function WebChronoOverlay({ chronoMuteTimer }) {
  if (chronoMuteTimer <= 0) return null;
  return (
    <rect x={0} y={0} width={540} height={540} fill="rgba(148, 26, 255, 0.15)" />
  );
}
