/*
 * Copyright (c) 2020-present Prolincur Technologies LLP.
 * All Rights Reserved.
 */

module.exports = (api) => {
  const env = api.env()
  const isTest = env === 'test'
  const isEsm = env === 'esm'

  const targets = isTest
    ? { node: 'current' }
    : { edge: '17', firefox: '60', chrome: '67', safari: '11.1' }

  return {
    // Node (test env) supports class fields natively; transforming them would also
    // break three's own `static {}` blocks when jest transpiles recent three.
    plugins: isTest ? [] : ['@babel/plugin-proposal-class-properties'],
    presets: [
      // No `useBuiltIns`: the library must not emit `require("core-js/...")`,
      // since core-js is not a dependency of this package.
      ['@babel/env', { targets, modules: isEsm ? false : 'auto' }],
      ...(isTest ? [] : ['minify']),
    ],
  }
}
