import React from 'react';

let Rect;
try {
  const Skia = require('@shopify/react-native-skia');
  Rect = Skia.Rect;
} catch (e) {}

export default function SkiaChronoOverlay({ chronoMuteTimer }) {
  if (chronoMuteTimer <= 0 || !Rect) return null;
  return (
    <Rect x={0} y={0} width={540} height={540} color="rgba(148, 26, 255, 0.15)" />
  );
}
