// The demo code lives in ../shared, so its bare imports would otherwise resolve from the
// repo root (where `three` is the library's dev copy). `dedupe` resolves them from this
// folder, so the example runs on the three.js version pinned here.
export default {
  resolve: { dedupe: ['three', 'three-triangle-iterator'] },
}
