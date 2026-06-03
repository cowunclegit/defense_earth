import React from 'react';

let Line;
try {
  const Skia = require('@shopify/react-native-skia');
  Line = Skia.Line;
} catch (e) {}

export default function SkiaBackground() {
  if (!Line) return null;

  const gridLines = [];
  const start = -990;
  const end = 1530;

  // 격자선 세로 및 가로
  for (let val = start; val <= end; val += 90) {
    // 세로선 (x = val)
    gridLines.push(
      <Line
        key={`v-${val}`}
        p1={{ x: val, y: start }}
        p2={{ x: val, y: end }}
        color="rgba(0, 240, 255, 0.08)"
        strokeWidth={1}
      />
    );
    // 가로선 (y = val)
    gridLines.push(
      <Line
        key={`h-${val}`}
        p1={{ x: start, y: val }}
        p2={{ x: end, y: val }}
        color="rgba(0, 240, 255, 0.08)"
        strokeWidth={1}
      />
    );
  }

  // 스타 트랙 세로선
  const starTracks = [];
  for (let val = start + 45; val <= end - 45; val += 90) {
    starTracks.push(
      <Line
        key={`s-${val}`}
        p1={{ x: val, y: start }}
        p2={{ x: val, y: end }}
        color="rgba(255, 215, 0, 0.12)"
        strokeWidth={1}
      />
    );
  }

  return (
    <>
      {gridLines}
      {starTracks}
    </>
  );
}
