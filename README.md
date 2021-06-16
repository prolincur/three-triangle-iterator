
# three-triangle-iterator

**three-triangle-iterator** is a simple utility which make it easy to iterate over all the triangular geometry faces of a [Mesh](https://threejs.org/docs/#api/en/objects/Mesh), Geometry (in version prior to r125 of three.js) or [BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry) objects. It also supports the instanced buffer geometry. This library can work cross platfrom and with your version [three.js](https://threejs.org). This library is backward-compatible with the versions prior to r125 as well as later. We have tested this with specifically r123 and r129 versions of three.js. 

#### Install
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

### Author

[Sourabh Soni](https://prolincur.com)\
[Prolincur Technologies](https://prolincur.com)

