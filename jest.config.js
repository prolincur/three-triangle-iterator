/**
 * Runs the same test suite against several three.js versions.
 * Each project maps `three` to an npm-aliased install (see devDependencies).
 */
// three's `exports` map hides package.json, so read it from disk.
const latestRevision = JSON.parse(
  require('fs').readFileSync(
    require('path').join(__dirname, 'node_modules/three/package.json'),
    'utf8'
  )
).version.split('.')[1]

const versions = [
  { name: 'three@0.123', module: 'three-r123', revision: '123' }, // still has THREE.Geometry
  { name: 'three@0.157', module: 'three-r157', revision: '157' },
  {
    name: 'three@latest',
    // Recent three ships `three.cjs` as a deprecated thin wrapper over the ES module
    // build, so point straight at the ES module build and let jest transpile it.
    module: '<rootDir>/node_modules/three/build/three.module.js',
    revision: latestRevision,
    // Matches both flat (node_modules/three/) and pnpm
    // (node_modules/.pnpm/three@x/node_modules/three/) layouts.
    transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/three@[^/]+/node_modules/)?three/)'],
  },
]

module.exports = {
  projects: versions.map((v) => ({
    displayName: v.name,
    testEnvironment: 'node',
    testMatch: ['<rootDir>/test/**/*.test.js'],
    moduleNameMapper: { '^three$': v.module },
    globals: { EXPECTED_THREE_REVISION: v.revision },
    ...(v.transformIgnorePatterns && { transformIgnorePatterns: v.transformIgnorePatterns }),
  })),
}
