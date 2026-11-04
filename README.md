
# three-triangle-iterator

**three-triangle-iterator** is a simple utility which make it easy to iterate over all the triangular geometry faces of a [Mesh](https://threejs.org/docs/#api/en/objects/Mesh), Geometry (in version prior to r125 of three.js) or [BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry) objects. It also supports the instanced buffer geometry. This library can work cross platfrom and with your version [three.js](https://threejs.org). This library is backward-compatible with the versions prior to r125 or later. 

#### Install
```
pnpm add three-triangle-iterator three
```
or
```
yarn add three-triangle-iterator three
```
or
```
npm i three-triangle-iterator three
```

#### Usage

```javascript
import * as THREE from 'three';
import forEachTriangle from 'three-triangle-iterator';

forEachTriangle(object, (triangle) => {
  //... do something with each triangle
  // Traverse vertices
  triangle.forEach((vertex) => {
    //... do something with the vertex
  })
  // Traverse edges
  for (let i = 0; i < 3; i++) {
    // get the first and next vertex making up the edge
    const iNext = (i + 1) % 3;
    const edge = {
      start: triangle[i],
      end: triangle[iNext],
    };
    //... do something with the edge
  }
})

```

#### Geometry groups (multi-material)

The callback also receives an `info` object `{ materialIndex, groupIndex }`.

```javascript
forEachTriangle(mesh, (triangle, { materialIndex, groupIndex }) => {
  // materialIndex: index into mesh.material when it is an array
  // groupIndex: position of the group in geometry.groups
})
```

Triangles are selected the same way three.js' `WebGLRenderer` draws them:

- **Mesh with an array of materials**: only triangles inside `geometry.groups` are visited, group
  by group, each group clipped to `geometry.drawRange`. Triangles outside every group are
  skipped, triangles in overlapping groups are visited once per group, and groups whose
  `materialIndex` has no material are skipped. A geometry without groups yields nothing.
- **Mesh with a single material**: groups are ignored; every triangle in `drawRange` is visited
  once and both `info` values are `undefined`.
- **Bare `BufferGeometry`** (no mesh, so no material): groups are used when present, otherwise
  every triangle in `drawRange` is visited.
- **Legacy `THREE.Geometry`** (before r125): `materialIndex` is the face's `materialIndex`; with an
  array of materials, faces whose `materialIndex` has no material are skipped.

### Examples

[examples/](examples) holds one demo ([examples/shared/demo.js](examples/shared/demo.js)) that runs on
several three.js versions. Each folder pins a version and uses the local library through the
pnpm workspace:

```
pnpm install
pnpm --dir examples/123 dev   # three r123
pnpm --dir examples/157 dev   # three r157
```

### Author

[Prolincur Technologies](https://prolincur.com)

### License

Copyright (c) 2020-present Prolincur Technologies LLP.

Released under the [MIT License](LICENSE).

