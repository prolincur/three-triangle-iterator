/*
 * Copyright (c) 2020-present Prolincur Technologies LLP.
 * All Rights Reserved.
 */

import * as THREE from 'three'

/**
 * Simple trick to load THREE.Geometry in older and newer versions of three
 * (THREE.Geometry was removed in r125).
 * @returns
 */
const _safeGetExport = (three, exp) => {
  return three[exp]
}

/**
 * An utility to make traversal of triangular faces of {@link three.js} Mesh, Geometry or BufferGeometry easy.
 *
 */
class ThreeTriangleIterator {
  constructor(object, forEachFace) {
    this.callback = forEachFace
    this.matrix = new THREE.Matrix4()
    if (object) this.iterate(object)
  }

  iterate = (object) => {
    if (!object) return
    const Geometry = _safeGetExport(THREE, 'Geometry')
    if (Geometry && object instanceof Geometry) {
      this.fromGeometry(object)
    } else if (object instanceof THREE.BufferGeometry || object.isBufferGeometry) {
      if (object.index !== null && object.index !== undefined) {
        this.fromIndexedBufferGeometry(object)
      } else {
        this.fromNonIndexedBufferGeometry(object)
      }
    } else if (object instanceof THREE.Mesh || object.isMesh) {
      this.fromMesh(object)
    } else if (object instanceof THREE.Object3D || object.isObject3D) {
      // Group, Scene, plain Object3D etc.
      this.fromObject3D(object)
    } else {
      console.warn('three-triangle-iterator - skipping unsupported object type ' + object?.type)
    }
  }

  /**
   * Runs fn with this.matrix temporarily multiplied by the object's local matrix,
   * so that transforms of parent containers are accumulated.
   */
  _withLocalMatrix = (object, fn) => {
    const parentMatrix = this.matrix
    object.updateMatrix()
    this.matrix = parentMatrix.clone().multiply(object.matrix)
    try {
      fn()
    } finally {
      this.matrix = parentMatrix
    }
  }

  _iterateChildren = (object) => {
    const children = object.children
    if (!children) return
    for (let i = 0; i < children.length; i++) this.iterate(children[i])
  }

  fromObject3D = (object) => {
    this._withLocalMatrix(object, () => this._iterateChildren(object))
  }

  fromMesh = (mesh) => {
    this._withLocalMatrix(mesh, () => {
      this.iterate(mesh.geometry)
      this._iterateChildren(mesh)
    })
  }

  _vertex = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(this.matrix)

  fromGeometry = (geometry) => {
    const vertices = geometry.vertices
    const faces = geometry.faces
    const len = faces.length
    for (let i = 0; i < len; i++) {
      const face = faces[i]
      const a = vertices[face.a]
      const b = vertices[face.b]
      const c = vertices[face.c]
      this.callback([
        this._vertex(a.x, a.y, a.z),
        this._vertex(b.x, b.y, b.z),
        this._vertex(c.x, c.y, c.z),
      ])
    }
  }

  // getX/getY/getZ handle both BufferAttribute and InterleavedBufferAttribute
  _vertexAt = (position, i) => this._vertex(position.getX(i), position.getY(i), position.getZ(i))

  /**
   * Returns the [start, end) element range to visit, honouring geometry.drawRange.
   */
  _range = (geometry, count) => {
    const drawRange = geometry.drawRange
    if (!drawRange) return [0, count]
    const start = Math.max(0, drawRange.start || 0)
    const end = Math.min(count, start + drawRange.count) // drawRange.count defaults to Infinity
    return [start, end]
  }

  fromNonIndexedBufferGeometry = (geometry) => {
    const position = geometry.attributes?.position
    if (!position) return
    const count = position.count
    if (count % 3 !== 0) {
      console.warn(
        'three-triangle-iterator - skipping unsupported non-indexed buffer geometry with vertex count ' +
          count
      )
      return
    }
    const [start, end] = this._range(geometry, count)
    for (let i = start; i + 2 < end; i += 3) {
      this.callback([
        this._vertexAt(position, i),
        this._vertexAt(position, i + 1),
        this._vertexAt(position, i + 2),
      ])
    }
  }

  fromIndexedBufferGeometry = (geometry) => {
    const position = geometry.attributes?.position
    if (!position) return
    const index = geometry.index
    const [start, end] = this._range(geometry, index.count)
    for (let i = start; i + 2 < end; i += 3) {
      this.callback([
        this._vertexAt(position, index.getX(i)),
        this._vertexAt(position, index.getX(i + 1)),
        this._vertexAt(position, index.getX(i + 2)),
      ])
    }
  }
}

/**
 * Iterates each geometry face of the object.
 * @param {object} object ThreeJS Object3D (Mesh, Group, Scene...), Geometry, or BufferGeometry
 * @param {function} callback Callback function to visit each face
 */
const forEachTriangle = (object, callback) => {
  return new ThreeTriangleIterator(object, callback)
}

export default forEachTriangle
