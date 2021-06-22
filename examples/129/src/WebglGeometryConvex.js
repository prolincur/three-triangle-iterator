import React, { useEffect } from 'react'
import { extend, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import forEachTriangle from 'three-triangle-iterator'
extend({ OrbitControls, ConvexGeometry })

const WebglGeometryConvex = () => {
  const pointsRef = React.useRef()
  const meshFrontRef = React.useRef()
  const meshBackRef = React.useRef()
  const {
    camera,
    gl: { domElement },
  } = useThree()
  const [texture] = useLoader(TextureLoader, [
    'https://cdn.rawgit.com/mrdoob/three.js/r129/examples/textures/sprites/disc.png',
  ])
  const vertices = React.useMemo(() => {
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
    return vertices
  }, [])

  React.useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.setFromPoints(vertices)
    }
  }, [vertices])

  useEffect(() => {
    if (meshFrontRef.current) {
      const colors = []
      forEachTriangle(meshFrontRef.current, (triangle) => {
        triangle.forEach((vertex) => {
          let letters = '0123456789ABCDEF'

          let hexR = '#'
          for (let i = 0; i < 6; i++) {
            hexR += letters[Math.floor(Math.random() * 16)]
          }
          let hexG = '#'
          for (let i = 0; i < 6; i++) {
            hexG += letters[Math.floor(Math.random() * 16)]
          }
          let hexB = '#'
          for (let i = 0; i < 6; i++) {
            hexB += letters[Math.floor(Math.random() * 16)]
          }

          const color = new THREE.Color()
          color.setRGB(hexR, hexG, hexB)
          color.set(hexB)
          colors.push(color.r, color.g, color.b)
        })
      })
      meshFrontRef.current.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3)
      )
    }
    if (meshBackRef.current) {
      const colors = []
      let letters = '0123456789ABCDEF'
      forEachTriangle(meshBackRef.current, (triangle) => {
        triangle.forEach((vertex) => {
          let hexR = '#'
          for (let i = 0; i < 6; i++) {
            hexR += letters[Math.floor(Math.random() * 16)]
          }
          let hexG = '#'
          for (let i = 0; i < 6; i++) {
            hexG += letters[Math.floor(Math.random() * 16)]
          }
          let hexB = '#'
          for (let i = 0; i < 6; i++) {
            hexB += letters[Math.floor(Math.random() * 16)]
          }
          const color = new THREE.Color()
          color.setRGB(hexR, hexG, hexB)
          color.set(hexB)
          colors.push(color.r, color.g, color.b)
        })
      })
      meshBackRef.current.geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3, true)
      )
    }
  }, [])
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
        <points>
          <bufferGeometry ref={pointsRef} />
          <pointsMaterial
            args={[
              {
                color: 0x0080ff,
                map: texture,
                size: 1,
                alphaTest: 0.5,
              },
            ]}
          />
        </points>
        <mesh ref={meshBackRef} renderOrder={0}>
          <convexGeometry args={[vertices]} />
          <meshLambertMaterial
            args={[
              {
                color: 0xffffff,
                opacity: 0.5,
                transparent: true,
              },
            ]}
            side={THREE.BackSide}
            vertexColors={THREE.VertexColors}
          />
        </mesh>
        <mesh ref={meshFrontRef} rednderOrder={1}>
          <convexGeometry args={[vertices]} />
          <meshLambertMaterial
            args={[
              {
                color: 0xffffff,
                opacity: 0.5,
                transparent: true,
              },
            ]}
            side={THREE.FrontSide}
            vertexColors={THREE.VertexColors}
          />
        </mesh>
      </group>
    </React.Fragment>
  )
}
export { WebglGeometryConvex }
