import React from 'react';

export default function WebBackground() {
  const gridLines = [];
  const start = -990;
  const end = 1530;

  // 격자선 세로 및 가로
  for (let val = start; val <= end; val += 90) {
    // 세로선 (x = val)
    gridLines.push(
      <line
        key={`v-${val}`}
        x1={val}
        y1={start}
        x2={val}
        y2={end}
        stroke="rgba(0, 240, 255, 0.08)"
        strokeWidth={1}
      />
    );
    // 가로선 (y = val)
    gridLines.push(
      <line
        key={`h-${val}`}
        x1={start}
        y1={val}
        x2={end}
        y2={val}
        stroke="rgba(0, 240, 255, 0.08)"
        strokeWidth={1}
      />
    );
  }

  // 스타 트랙 세로선
  const starTracks = [];
  const dashArrays = ["3, 15", "5, 20", "4, 18", "6, 25", "4, 15", "5, 22"];
  let dashIndex = 0;
  for (let val = start + 45; val <= end - 45; val += 90) {
    const dash = dashArrays[Math.abs(dashIndex) % dashArrays.length];
    starTracks.push(
      <line
        key={`s-${val}`}
        x1={val}
        y1={start}
        x2={val}
        y2={end}
        stroke="rgba(255, 215, 0, 0.12)"
        strokeWidth={1}
        strokeDasharray={dash}
      />
    );
    dashIndex++;
  }

  return (
    <>
      {gridLines}
      {starTracks}
    </>
  );
}
