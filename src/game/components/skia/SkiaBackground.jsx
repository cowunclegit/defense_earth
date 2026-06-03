import React from 'react';

let Line;
try {
  const Skia = require('@shopify/react-native-skia');
  Line = Skia.Line;
} catch (e) {}

export default function SkiaBackground() {
  if (!Line) return null;
  return (
    <>
      {/* 심연의 우주배경 그리드 세로선/가로선 */}
      <Line p1={{ x: 90, y: 0 }} p2={{ x: 90, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 180, y: 0 }} p2={{ x: 180, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 270, y: 0 }} p2={{ x: 270, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 360, y: 0 }} p2={{ x: 360, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 450, y: 0 }} p2={{ x: 450, y: 540 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 0, y: 90 }} p2={{ x: 540, y: 90 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 0, y: 180 }} p2={{ x: 540, y: 180 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 0, y: 270 }} p2={{ x: 540, y: 270 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 0, y: 360 }} p2={{ x: 540, y: 360 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <Line p1={{ x: 0, y: 450 }} p2={{ x: 540, y: 450 }} color="rgba(0, 240, 255, 0.08)" strokeWidth={1} />

      {/* 세로 골든 스타 트랙 */}
      <Line p1={{ x: 45, y: 0 }} p2={{ x: 45, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
      <Line p1={{ x: 135, y: 0 }} p2={{ x: 135, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
      <Line p1={{ x: 225, y: 0 }} p2={{ x: 225, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
      <Line p1={{ x: 315, y: 0 }} p2={{ x: 315, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
      <Line p1={{ x: 405, y: 0 }} p2={{ x: 405, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
      <Line p1={{ x: 495, y: 0 }} p2={{ x: 495, y: 540 }} color="rgba(255, 215, 0, 0.12)" strokeWidth={1} />
    </>
  );
}
