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

const collectInfo = (object) => {
  const infos = []
  forEachTriangle(object, (triangle, info) => infos.push(info))
  return infos
}

const materialIndices = (object) => collectInfo(object).map((info) => info.materialIndex)

// Non-indexed geometry of `n` triangles, triangle k lying at x = k.
const strip = (n) => {
  const positions = []
  for (let k = 0; k < n; k++) positions.push(k, 0, 0, k, 1, 0, k, 0, 1)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

// x coordinate identifying each visited triangle of a strip()
const triangleIds = (object) => collect(object).map((tri) => tri[0].x)

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

  describe('geometry.groups', () => {
    test('indexed box: triangles reported per group with materialIndex and groupIndex', () => {
      const geometry = box()
      expect(geometry.groups).toHaveLength(6)
      const infos = collectInfo(geometry)
      expect(infos).toHaveLength(12)
      expect(infos.map((i) => i.materialIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
      expect(infos.map((i) => i.groupIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
    })

    test('non-indexed geometry honours groups', () => {
      const geometry = strip(4)
      geometry.addGroup(0, 6, 3)
      geometry.addGroup(6, 6, 7)
      expect(triangleIds(geometry)).toEqual([0, 1, 2, 3])
      expect(materialIndices(geometry)).toEqual([3, 3, 7, 7])
    })

    test('groups are visited in group order, not buffer order', () => {
      const geometry = strip(3)
      geometry.addGroup(6, 3, 2)
      geometry.addGroup(0, 6, 1)
      expect(triangleIds(geometry)).toEqual([2, 0, 1])
      expect(materialIndices(geometry)).toEqual([2, 1, 1])
    })

    test('triangles outside every group are skipped', () => {
      const geometry = strip(4)
      geometry.addGroup(0, 3, 1)
      geometry.addGroup(9, 3, 2)
      expect(triangleIds(geometry)).toEqual([0, 3])
    })

    test('overlapping groups visit shared triangles once per group', () => {
      const geometry = strip(3)
      geometry.addGroup(0, 6, 0)
      geometry.addGroup(3, 6, 1)
      expect(triangleIds(geometry)).toEqual([0, 1, 1, 2])
      expect(materialIndices(geometry)).toEqual([0, 0, 1, 1])
    })

    test('group with count Infinity runs to the end of the geometry', () => {
      const geometry = strip(4)
      geometry.addGroup(3, Infinity, 5)
      expect(triangleIds(geometry)).toEqual([1, 2, 3])
    })

    test('groups are clipped to drawRange', () => {
      const geometry = strip(4)
      geometry.addGroup(0, 6, 0)
      geometry.addGroup(6, 6, 1)
      geometry.setDrawRange(3, 6) // triangles 1..2
      expect(triangleIds(geometry)).toEqual([1, 2])
      expect(materialIndices(geometry)).toEqual([0, 1])
    })

    test('indexed geometry with custom groups', () => {
      const geometry = box() // 12 triangles, 36 indices
      geometry.clearGroups()
      geometry.addGroup(30, 6, 9)
      const infos = collectInfo(geometry)
      expect(infos).toHaveLength(2)
      expect(infos.every((i) => i.materialIndex === 9 && i.groupIndex === 0)).toBe(true)
    })

    test('geometry without groups reports undefined materialIndex and groupIndex', () => {
      const infos = collectInfo(strip(2))
      expect(infos).toHaveLength(2)
      infos.forEach((info) => {
        expect(info.materialIndex).toBeUndefined()
        expect(info.groupIndex).toBeUndefined()
      })
    })

    test('info objects are frozen', () => {
      const [info] = collectInfo(box())
      expect(Object.isFrozen(info)).toBe(true)
    })

    test('multi-material Mesh reports groups and applies transform', () => {
      const materials = [0, 1, 2, 3, 4, 5].map(() => new THREE.MeshBasicMaterial())
      const mesh = new THREE.Mesh(box(), materials)
      mesh.position.set(0, 0, -30)
      const triangles = []
      const infos = []
      forEachTriangle(mesh, (tri, info) => {
        triangles.push(tri)
        infos.push(info)
      })
      expect(triangles).toHaveLength(12)
      expect(allVertices(triangles).every(withinBox(mesh.position))).toBe(true)
      expect(new Set(infos.map((i) => i.materialIndex))).toEqual(new Set([0, 1, 2, 3, 4, 5]))
    })
  })

  describe('geometry.groups on a Mesh (matches three.js WebGLRenderer)', () => {
    const mat = () => new THREE.MeshBasicMaterial()
    // strip(4) with a gap (triangle 1) and an overlap (triangle 3 twice)
    const gappyStrip = () => {
      const geometry = strip(4)
      geometry.addGroup(0, 3, 0)
      geometry.addGroup(6, 6, 1)
      geometry.addGroup(9, 3, 2)
      return geometry
    }

    test('single material: groups ignored, whole drawRange visited once', () => {
      const mesh = new THREE.Mesh(gappyStrip(), mat())
      expect(triangleIds(mesh)).toEqual([0, 1, 2, 3])
      collectInfo(mesh).forEach((info) => {
        expect(info.materialIndex).toBeUndefined()
        expect(info.groupIndex).toBeUndefined()
      })
    })

    test('single material: drawRange still applies', () => {
      const geometry = gappyStrip()
      geometry.setDrawRange(3, 6)
      expect(triangleIds(new THREE.Mesh(geometry, mat()))).toEqual([1, 2])
    })

    test('material array: only grouped triangles, gaps skipped, overlaps repeated', () => {
      const mesh = new THREE.Mesh(gappyStrip(), [mat(), mat(), mat()])
      expect(triangleIds(mesh)).toEqual([0, 2, 3, 3])
      expect(materialIndices(mesh)).toEqual([0, 1, 1, 2])
      expect(collectInfo(mesh).map((i) => i.groupIndex)).toEqual([0, 1, 1, 2])
    })

    test('material array: groups without a material at materialIndex are skipped', () => {
      const mesh = new THREE.Mesh(gappyStrip(), [mat(), undefined, mat()])
      expect(triangleIds(mesh)).toEqual([0, 3])
      expect(materialIndices(mesh)).toEqual([0, 2])
    })

    test('material array: geometry without groups visits nothing', () => {
      expect(collect(new THREE.Mesh(strip(3), [mat()]))).toHaveLength(0)
    })

    test('material array: groups clipped to drawRange', () => {
      const geometry = gappyStrip()
      geometry.setDrawRange(6, 3) // triangle 2 only
      expect(triangleIds(new THREE.Mesh(geometry, [mat(), mat(), mat()]))).toEqual([2])
    })

    test('material of a parent mesh does not leak to child or sibling meshes', () => {
      const parent = new THREE.Mesh(gappyStrip(), [mat(), mat(), mat()])
      const child = new THREE.Mesh(gappyStrip(), mat())
      parent.add(child)
      const group = new THREE.Group()
      group.add(parent)
      group.add(new THREE.Mesh(gappyStrip(), mat()))
      // parent: grouped; child and sibling: single material, all 4 triangles
      expect(triangleIds(group)).toEqual([0, 2, 3, 3, 0, 1, 2, 3, 0, 1, 2, 3])
    })

    test('bare geometry passed after a mesh is treated as having no material', () => {
      const geometry = gappyStrip()
      forEachTriangle(new THREE.Mesh(geometry, mat()), () => {})
      expect(triangleIds(geometry)).toEqual([0, 2, 3, 3])
    })
  })

  const legacy = THREE.Geometry ? describe : describe.skip
  legacy('legacy THREE.Geometry (removed in r125)', () => {
    const legacyBox = () => new THREE.Geometry().fromBufferGeometry(box())

    test('reports each face materialIndex', () => {
      const infos = collectInfo(legacyBox())
      expect(new Set(infos.map((i) => i.materialIndex))).toEqual(new Set([0, 1, 2, 3, 4, 5]))
      infos.forEach((i) => expect(i.groupIndex).toBeUndefined())
    })

    test('Mesh with single material visits every face', () => {
      expect(collect(new THREE.Mesh(legacyBox(), new THREE.MeshBasicMaterial()))).toHaveLength(12)
    })

    test('Mesh with material array skips faces without a material', () => {
      const materials = [0, 1, 2, 3, 4, 5].map(() => new THREE.MeshBasicMaterial())
      materials[1] = undefined
      materials[4] = undefined
      const infos = collectInfo(new THREE.Mesh(legacyBox(), materials))
      expect(infos).toHaveLength(8)
      expect(new Set(infos.map((i) => i.materialIndex))).toEqual(new Set([0, 2, 3, 5]))
    })

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
