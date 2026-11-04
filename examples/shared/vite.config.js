import { defineConfig } from 'vite'

// Shared by every example. The example code lives in ../shared, so bare imports from it
// would otherwise resolve from the repo root (where `three` is the library's dev copy).
// `dedupe` resolves these packages from the example's own folder instead, so each example
// runs on the three.js version it pins and on the workspace-linked library.
export default defineConfig({
  resolve: { dedupe: ['three', 'three-triangle-iterator'] },
})
