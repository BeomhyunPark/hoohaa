// 웹의 계산 엔진(../src/engine/tier.js, data.js)을 복사하지 않고 그대로 번들에 넣는다.
// - watchFolders: mobile/ 밖에 있는 ../src/engine 폴더를 Metro가 보게 한다.
// - extraNodeModules: 앱 코드의 '@hoohaa/engine/...'를 그 폴더로 잇는다.
//   (타입은 tsconfig.json의 paths, Jest는 package.json의 moduleNameMapper가 같은 이름을 잇는다.)
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const engineDir = path.resolve(__dirname, '../src/engine');
const config = getDefaultConfig(__dirname);

config.watchFolders = [...(config.watchFolders ?? []), engineDir];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@hoohaa/engine': engineDir,
};

module.exports = config;
