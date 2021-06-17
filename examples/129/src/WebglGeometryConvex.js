import React from 'react'
import { extend, useThree, useLoader, useFrame } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import { AnimationClipCreator } from 'three-stdlib'
extend({ OrbitControls, ConvexGeometry })

const WebglGeometryConvex = () => {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  const [texture] = useLoader(TextureLoader, [
    'https://cdn.rawgit.com/mrdoob/three.js/r129/examples/textures/sprites/disc.png',
  ])
  const vertices = []
  let dodecahedronGeometry = new THREE.DodecahedronGeometry(10)
  const positionAttribute = dodecahedronGeometry.getAttribute('position')
  dodecahedronGeometry.deleteAttribute('normal')
  dodecahedronGeometry.deleteAttribute('uv')
  dodecahedronGeometry = BufferGeometryUtils.mergeVertices(dodecahedronGeometry)
  for (let i = 0; i < positionAttribute.count; i++) {
    const vertex = new THREE.Vector3()
    vertex.fromBufferAttribute(positionAttribute, i)
    vertices.push(vertex)
  }

  const pointsMaterial = new THREE.PointsMaterial({
    color: 0x0080ff,
    map: texture,
    size: 1,
    alphaTest: 0.5,
  })

  const pointsGeometry = new THREE.BufferGeometry().setFromPoints(vertices)
  const meshGeometry = new ConvexGeometry(vertices)
  const backSide = THREE.BackSide
  const frontSide = THREE.FrontSide
  const meshMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    opacity: 0.5,
    transparent: true,
  })
  return (
    <React.Fragment>
      <orbitControls
        args={[camera, domElement]}
        minDistance={20}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
      <ambientLight args={[0x222222]} intensity={0.1} />
      <pointLight args={[0xffffff, 1]} />
      <axesHelper args={[20]} />
      <group>
        <points args={[pointsGeometry, pointsMaterial]} />
        <mesh args={[meshGeometry, meshMaterial]} renderOrder={0} side={backSide} />
        <meshLambertMaterial args={[0xffffff, 0.5, true]} />
        <mesh args={[meshGeometry, meshMaterial.clone()]} renderOrder={1} side={frontSide} />
      </group>
      <mesh>
        <boxGeometry />
        <meshPhongMaterial />
      </mesh>
    </React.Fragment>
  )
}
export { WebglGeometryConvex }
