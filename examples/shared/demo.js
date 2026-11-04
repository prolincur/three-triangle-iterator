/*
 * Example: rebuild a scene from the triangles reported by three-triangle-iterator.
 *
 * A hidden group of transformed meshes is iterated with forEachTriangle. Every triangle
 * (already in the group's coordinate space) is copied into one new BufferGeometry with a
 * random color, which is what gets rendered. The same code runs on old three.js versions
 * (where BoxGeometry etc. are legacy THREE.Geometry) and new ones.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import forEachTriangle from 'three-triangle-iterator'

// Source objects: never added to the scene, only iterated.
const source = new THREE.Group()
source.rotation.y = Math.PI / 8

const box = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6))
box.position.set(-10, 0, 0)
const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 1))
const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(3, 1, 64, 8))
knot.position.set(10, 0, 0)
knot.rotation.x = Math.PI / 2
source.add(box, sphere, knot)

// Copy every triangle into flat position / color arrays.
const positions = []
const colors = []
const color = new THREE.Color()
let triangleCount = 0
forEachTriangle(source, (triangle) => {
  color.setHSL(Math.random(), 0.7, 0.55)
  triangle.forEach((vertex) => {
    positions.push(vertex.x, vertex.y, vertex.z)
    colors.push(color.r, color.g, color.b)
  })
  triangleCount++
})

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x111111)
scene.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true })))
scene.add(new THREE.AxesHelper(15))

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 18, 36)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

document.getElementById(
  'info'
).textContent = `three.js r${THREE.REVISION} · ${triangleCount} triangles`

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
