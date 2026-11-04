# three-triangle-iterator

**three-triangle-iterator** makes it easy to visit every triangle of a three.js
[Mesh](https://threejs.org/docs/#api/en/objects/Mesh), [Group](https://threejs.org/docs/#api/en/objects/Group),
[Scene](https://threejs.org/docs/#api/en/scenes/Scene), [BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry)
or legacy `Geometry`. It works with three.js r123 and later, including the legacy `THREE.Geometry`
removed in r125, and ships both CommonJS and ES module builds.

## Install

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

## Usage

```javascript
import forEachTriangle from 'three-triangle-iterator'

forEachTriangle(object, (triangle) => {
  // triangle is an array of three THREE.Vector3

  // Traverse vertices
  triangle.forEach((vertex) => {
    // ... do something with the vertex
  })

  // Traverse edges
  for (let i = 0; i < 3; i++) {
    const edge = { start: triangle[i], end: triangle[(i + 1) % 3] }
    // ... do something with the edge
  }
})
```

## Supported

- `Mesh`, `Group`, `Scene` and any other `Object3D`; children are visited recursively, including
  children of a mesh
- Indexed and non-indexed `BufferGeometry`, including interleaved position attributes
- `geometry.drawRange` and `geometry.groups` (see below)
- Legacy `THREE.Geometry` (three.js before r125)

Not supported: instancing is not expanded. An `InstancedMesh` or `InstancedBufferGeometry` yields
the triangles of its base geometry once, ignoring per-instance matrices and `instanceCount`.

## Coordinate space

Every vertex is a new `THREE.Vector3`; the source geometry is never modified. The transform of the
object you pass in and of all its descendants is applied, but not the transforms of its parents
(`matrixWorld` is not used). Vertices are therefore in the coordinate space of the passed object's
parent. Pass the scene to get world coordinates. A geometry passed directly is returned in its own
coordinates.

## Geometry groups (multi-material)

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

## What's new in 5.0

5.0 changes which triangles are returned and where, so check your results when upgrading from 4.x:

- Transforms of nested groups and objects are now applied (before, only the mesh's own transform
  was applied).
- `Scene`, plain `Object3D` and children of a `Mesh` are now traversed (before, only `Group`
  children were visited).
- `geometry.drawRange` and `geometry.groups` are now respected, and the callback receives an `info`
  argument. A mesh with an array of materials but no groups now yields no triangles, as in three.js.
- Fixed: passing an indexed `BufferGeometry` or legacy `Geometry` directly threw an error.
- Fixed: interleaved position attributes returned wrong vertices.
- The package no longer requires `core-js` at runtime and now also ships an ES module build
  (`module` field).

## Examples

[examples/](examples) holds one demo ([examples/shared/demo.js](examples/shared/demo.js)) that runs on
several three.js versions. Each folder pins a version and uses the local library through the
pnpm workspace:

```
pnpm install
pnpm --dir examples/123 dev   # three r123
pnpm --dir examples/157 dev   # three r157
```

## Development

```
pnpm install
pnpm test        # runs the test suite against three r123, r157 and the latest three
pnpm run build   # writes lib/ (CommonJS) and lib/esm/ (ES modules)
```

## License

Copyright (c) 2020-present [Prolincur Technologies LLP](https://prolincur.com).

Released under the [MIT License](LICENSE).
