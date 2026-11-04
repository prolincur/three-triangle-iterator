/*
 * Copyright (c) 2020-present Prolincur Technologies LLP.
 * All Rights Reserved.
 */

module.exports = (api) => {
  const env = api.env()
  const isTest = env === 'test'
  const isEsm = env === 'esm' // `babel --env-name esm` emits ES modules

  // Tests run on the current Node, which has class fields and `static {}` blocks natively,
  // so jest can also transpile recent three (ESM only) without touching its classes.
  const targets = isTest
    ? { node: 'current' }
    : { edge: '17', firefox: '60', chrome: '67', safari: '11.1' }

  return {
    presets: [
      // No `useBuiltIns`: the library must not emit `require("core-js/...")`,
      // since core-js is not a dependency of this package.
      ['@babel/env', { targets, modules: isEsm ? false : 'auto' }],
      ...(isTest ? [] : ['minify']),
    ],
  }
}
