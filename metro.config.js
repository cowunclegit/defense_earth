const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 웹 번들에서 Node.js 전용 모듈(fs, path 등)을 빈 모듈로 대체
// canvaskit-wasm이 fs를 require하지만 브라우저에서는 불필요
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  fs: require.resolve('./src/compat/emptyModule.js'),
  path: require.resolve('./src/compat/emptyModule.js'),
};

// canvaskit-wasm을 웹 번들에서 제외 (WASM은 네이티브 Skia에서만 사용)
const originalBlockList = config.resolver.blockList || [];
config.resolver.blockList = [
  ...(Array.isArray(originalBlockList) ? originalBlockList : [originalBlockList]),
  /canvaskit-wasm\/bin\/full\/canvaskit\.js/,
];

module.exports = config;
