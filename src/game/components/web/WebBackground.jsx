import React from 'react';

export default function WebBackground() {
  return (
    <>
      {/* 심연의 우주배경 그리드 세로선/가로선 */}
      <line x1={90} y1={0} x2={90} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={180} y1={0} x2={180} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={270} y1={0} x2={270} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={360} y1={0} x2={360} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={450} y1={0} x2={450} y2={540} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={0} y1={90} x2={540} y2={90} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={0} y1={180} x2={540} y2={180} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={0} y1={270} x2={540} y2={270} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={0} y1={360} x2={540} y2={360} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />
      <line x1={0} y1={450} x2={540} y2={450} stroke="rgba(0, 240, 255, 0.08)" strokeWidth={1} />

      {/* 세로 골든 스타 트랙 */}
      <line x1={45} y1={0} x2={45} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="3, 15" />
      <line x1={135} y1={0} x2={135} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="5, 20" />
      <line x1={225} y1={0} x2={225} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="4, 18" />
      <line x1={315} y1={0} x2={315} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="6, 25" />
      <line x1={405} y1={0} x2={405} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="4, 15" />
      <line x1={495} y1={0} x2={495} y2={540} stroke="rgba(255, 215, 0, 0.12)" strokeWidth={1} strokeDasharray="5, 22" />
    </>
  );
}
