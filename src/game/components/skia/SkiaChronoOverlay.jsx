import React from 'react';
import { Rect } from '@shopify/react-native-skia';


export default function SkiaChronoOverlay({ chronoMuteTimer }) {
  if (chronoMuteTimer <= 0) return null;
  return (
    <Rect x={0} y={0} width={540} height={540} color="rgba(148, 26, 255, 0.15)" />
  );
}
