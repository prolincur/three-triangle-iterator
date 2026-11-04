import * as THREE from 'three'
import forEachTriangle from '../src/index'

/* global EXPECTED_THREE_REVISION */

// BoxGeometry is a BufferGeometry from r125 onward; before that use BoxBufferGeometry.
const Box = new THREE.BoxGeometry(1, 1, 1).isBufferGeometry
  ? THREE.BoxGeometry
  : THREE.BoxBufferGeometry
const box = (size = 1) => new Box(size, size, size)

const collect = (object) => {
  const triangles = []
  forEachTriangle(object, (triangle) => triangles.push(triangle))
  return triangles
}

const allVertices = (triangles) => triangles.flat()

const withinBox =
  (center, half = 0.5, eps = 1e-6) =>
  (v) =>
    Math.abs(v.x - center.x) <= half + eps &&
    Math.abs(v.y - center.y) <= half + eps &&
    Math.abs(v.z - center.z) <= half + eps

const ORIGIN = new THREE.Vector3(0, 0, 0)

let warnSpy
beforeEach(() => {
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})

describe(`three r${THREE.REVISION}`, () => {
  test('resolves the expected three.js version', () => {
    expect(THREE.REVISION).toBe(EXPECTED_THREE_REVISION)
  })

  test('callback receives triangles of three Vector3', () => {
    const triangles = collect(box())
    triangles.forEach((tri) => {
      expect(tri).toHaveLength(3)
      tri.forEach((v) => expect(v).toBeInstanceOf(THREE.Vector3))
    })
  })

  test('returns nothing and does not throw for null / undefined input', () => {
    expect(collect(null)).toHaveLength(0)
    expect(collect(undefined)).toHaveLength(0)
  })

  describe('BufferGeometry', () => {
    test('indexed geometry passed directly', () => {
      const geometry = box()
      expect(geometry.index).not.toBeNull()
      const triangles = collect(geometry)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(ORIGIN))).toBe(true)
    })

    test('non-indexed geometry passed directly', () => {
      const geometry = box().toNonIndexed()
      expect(geometry.index).toBeNull()
      const triangles = collect(geometry)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(ORIGIN))).toBe(true)
    })

    test('indexed and non-indexed yield the same triangles', () => {
      const key = (tri) =>
        tri
          .map((v) =>
            v
              .toArray()
              .map((n) => n.toFixed(5))
              .join(',')
          )
          .join('|')
      const indexed = collect(box()).map(key)
      const nonIndexed = collect(box().toNonIndexed()).map(key)
      expect(nonIndexed).toEqual(indexed)
    })

    test('interleaved position attribute', () => {
      const source = box().toNonIndexed().attributes.position
      const stride = 6 // xyz + 3 padding floats
      const data = new Float32Array(source.count * stride).fill(99)
      for (let i = 0; i < source.count; i++) {
        data[i * stride] = source.getX(i)
        data[i * stride + 1] = source.getY(i)
        data[i * stride + 2] = source.getZ(i)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute(
        'position',
        new THREE.InterleavedBufferAttribute(new THREE.InterleavedBuffer(data, stride), 3, 0)
      )
      const triangles = collect(geometry)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(ORIGIN))).toBe(true)
    })

    test('honours drawRange on indexed geometry', () => {
      const geometry = box()
      geometry.setDrawRange(6, 12) // triangles 2..5
      expect(collect(geometry)).toHaveLength(4)
    })

    test('honours drawRange on non-indexed geometry', () => {
      const geometry = box().toNonIndexed()
      geometry.setDrawRange(0, 9)
      expect(collect(geometry)).toHaveLength(3)
    })

    test('skips non-indexed geometry whose vertex count is not a multiple of 3', () => {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0], 3))
      expect(collect(geometry)).toHaveLength(0)
      expect(warnSpy).toHaveBeenCalled()
    })

    test('geometry without a position attribute yields nothing', () => {
      expect(collect(new THREE.BufferGeometry())).toHaveLength(0)
    })
  })

  describe('Object3D hierarchy', () => {
    test('Mesh applies its own transform', () => {
      const mesh = new THREE.Mesh(box())
      mesh.position.set(10, 0, 0)
      const triangles = collect(mesh)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(mesh.position))).toBe(true)
    })

    test('Mesh applies rotation and scale', () => {
      const mesh = new THREE.Mesh(box())
      mesh.scale.set(2, 2, 2)
      mesh.rotation.set(0, Math.PI / 2, 0)
      const vertices = allVertices(collect(mesh))
      expect(vertices.every(withinBox(ORIGIN, 1))).toBe(true)
      expect(vertices.some((v) => Math.abs(Math.abs(v.x) - 1) < 1e-6)).toBe(true)
    })

    test('Mesh does not mutate its geometry', () => {
      const mesh = new THREE.Mesh(box())
      mesh.position.set(5, 5, 5)
      const before = Array.from(mesh.geometry.attributes.position.array)
      collect(mesh)
      expect(Array.from(mesh.geometry.attributes.position.array)).toEqual(before)
    })

    test('Group visits every mesh', () => {
      const group = new THREE.Group()
      group.add(new THREE.Mesh(box()))
      group.add(new THREE.Mesh(box().toNonIndexed()))
      expect(collect(group)).toHaveLength(24)
    })

    test('parent Group transforms are accumulated', () => {
      const outer = new THREE.Group()
      outer.position.set(100, 0, 0)
      const inner = new THREE.Group()
      inner.position.set(0, 50, 0)
      const mesh = new THREE.Mesh(box())
      mesh.position.set(0, 0, 7)
      outer.add(inner)
      inner.add(mesh)
      const triangles = collect(outer)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(new THREE.Vector3(100, 50, 7)))).toBe(true)
    })

    test('sibling transforms do not leak into each other', () => {
      const group = new THREE.Group()
      const a = new THREE.Mesh(box())
      a.position.set(10, 0, 0)
      const b = new THREE.Mesh(box())
      group.add(a)
      group.add(b)
      const triangles = collect(group)
      expect(allVertices(triangles.slice(0, 12)).every(withinBox(a.position))).toBe(true)
      expect(allVertices(triangles.slice(12)).every(withinBox(ORIGIN))).toBe(true)
    })

    test('Scene and plain Object3D containers are traversed', () => {
      const scene = new THREE.Scene()
      const holder = new THREE.Object3D()
      holder.add(new THREE.Mesh(box()))
      scene.add(holder)
      scene.add(new THREE.Mesh(box()))
      expect(collect(scene)).toHaveLength(24)
      expect(warnSpy).not.toHaveBeenCalled()
    })

    test('children of a Mesh are traversed with the parent transform', () => {
      const parent = new THREE.Mesh(box())
      parent.position.set(20, 0, 0)
      const child = new THREE.Mesh(box())
      child.position.set(0, 3, 0)
      parent.add(child)
      const triangles = collect(parent)
      expect(triangles).toHaveLength(24)
      expect(allVertices(triangles.slice(12)).every(withinBox(new THREE.Vector3(20, 3, 0)))).toBe(
        true
      )
    })

    test('non-mesh objects without geometry yield nothing', () => {
      expect(collect(new THREE.Object3D())).toHaveLength(0)
    })
  })

  const legacy = THREE.Geometry ? describe : describe.skip
  legacy('legacy THREE.Geometry (removed in r125)', () => {
    const legacyBox = () => new THREE.Geometry().fromBufferGeometry(box())

    test('Geometry passed directly', () => {
      const triangles = collect(legacyBox())
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(ORIGIN))).toBe(true)
    })

    test('Mesh with Geometry applies transform', () => {
      const mesh = new THREE.Mesh(legacyBox())
      mesh.position.set(-4, 0, 0)
      const triangles = collect(mesh)
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(mesh.position))).toBe(true)
    })
  })
})
