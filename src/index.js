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

/** Info passed for triangles of a geometry that has no groups. */
const NO_GROUP = Object.freeze({ materialIndex: undefined, groupIndex: undefined })

/**
 * An utility to make traversal of triangular faces of {@link three.js} Mesh, Geometry or BufferGeometry easy.
 *
 */
class ThreeTriangleIterator {
  constructor(object, forEachFace) {
    this.callback = forEachFace
    this.matrix = new THREE.Matrix4()
    // Material of the Mesh whose geometry is being visited; undefined for a bare geometry.
    this.material = undefined
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
      const parentMaterial = this.material
      this.material = mesh.material
      try {
        this.iterate(mesh.geometry)
      } finally {
        this.material = parentMaterial
      }
      this._iterateChildren(mesh)
    })
  }

  /**
   * Like three.js' renderer, a group / face material slot is drawn only when the mesh
   * has a material array containing a material at that index.
   */
  _hasMaterialSlot = (materialIndex) => {
    const material = this.material
    return !Array.isArray(material) || !!material[materialIndex]
  }

  _vertex = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(this.matrix)

  fromGeometry = (geometry) => {
    const vertices = geometry.vertices
    const faces = geometry.faces
    const len = faces.length
    for (let i = 0; i < len; i++) {
      const face = faces[i]
      // three.js converts faces into groups by materialIndex (DirectGeometry.computeGroups)
      if (!this._hasMaterialSlot(face.materialIndex)) continue
      const a = vertices[face.a]
      const b = vertices[face.b]
      const c = vertices[face.c]
      this.callback(
        [this._vertex(a.x, a.y, a.z), this._vertex(b.x, b.y, b.z), this._vertex(c.x, c.y, c.z)],
        Object.freeze({ materialIndex: face.materialIndex, groupIndex: undefined })
      )
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

  /**
   * Whether geometry.groups decide which triangles are visited, mirroring three.js'
   * WebGLRenderer: groups are used only for a Mesh with an array of materials (a Mesh
   * with a single material is drawn over its whole drawRange, ignoring groups). A bare
   * geometry has no material, so its groups are used whenever it has any.
   */
  _useGroups = (geometry) => {
    if (Array.isArray(this.material)) return true
    if (this.material !== undefined) return false
    return !!geometry.groups && geometry.groups.length > 0
  }

  /**
   * Calls emit(i, info) for the first element i of every triangle to visit.
   * When groups are used, each group's range (clipped to drawRange) is visited in order,
   * the same way three.js draws a multi-material mesh: elements outside every group are
   * skipped, elements in overlapping groups are visited once per group, and groups
   * whose materialIndex has no material are skipped.
   */
  _forEachTriangleStart = (geometry, count, emit) => {
    const [drawStart, drawEnd] = this._range(geometry, count)
    if (!this._useGroups(geometry)) {
      for (let i = drawStart; i + 2 < drawEnd; i += 3) emit(i, NO_GROUP)
      return
    }
    const groups = geometry.groups || []
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g]
      if (!this._hasMaterialSlot(group.materialIndex)) continue
      const start = Math.max(group.start, drawStart)
      const end = Math.min(group.start + group.count, drawEnd) // group.count may be Infinity
      const info = Object.freeze({ materialIndex: group.materialIndex, groupIndex: g })
      for (let i = start; i + 2 < end; i += 3) emit(i, info)
    }
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
    this._forEachTriangleStart(geometry, count, (i, info) => {
      this.callback(
        [
          this._vertexAt(position, i),
          this._vertexAt(position, i + 1),
          this._vertexAt(position, i + 2),
        ],
        info
      )
    })
  }

  fromIndexedBufferGeometry = (geometry) => {
    const position = geometry.attributes?.position
    if (!position) return
    const index = geometry.index
    this._forEachTriangleStart(geometry, index.count, (i, info) => {
      this.callback(
        [
          this._vertexAt(position, index.getX(i)),
          this._vertexAt(position, index.getX(i + 1)),
          this._vertexAt(position, index.getX(i + 2)),
        ],
        info
      )
    })
  }
}

/**
 * Iterates each geometry face of the object.
 * @param {object} object ThreeJS Object3D (Mesh, Group, Scene...), Geometry, or BufferGeometry
 * @param {function} callback Called as callback(triangle, info) for each face, where
 *   `triangle` is an array of three THREE.Vector3 and `info` is a frozen
 *   `{ materialIndex, groupIndex }`.
 *   Triangles are selected the way three.js' WebGLRenderer draws them:
 *   - Mesh with an array of materials: only triangles inside geometry.groups are visited,
 *     group by group (clipped to drawRange), skipping groups whose materialIndex has no
 *     material; info holds the group's materialIndex and its index in geometry.groups.
 *     With no groups nothing is visited.
 *   - Mesh with a single material: groups are ignored; every triangle in drawRange is
 *     visited and both info fields are undefined.
 *   - Bare BufferGeometry: groups are used when present, otherwise as a single material.
 *   - Legacy THREE.Geometry: materialIndex is the face's materialIndex; with an array of
 *     materials, faces whose materialIndex has no material are skipped.
 */
const forEachTriangle = (object, callback) => {
  return new ThreeTriangleIterator(object, callback)
}

export default forEachTriangle
