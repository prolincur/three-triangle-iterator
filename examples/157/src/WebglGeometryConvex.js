import React, { useEffect } from 'react'
import { extend, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import * as THREE from 'three'
import * as  BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import forEachTriangle from 'three-triangle-iterator';
import {generateRandomColors} from './Common/ColorUtils'

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
  const setAttribute = (mesh, name, value, itemSize) => {
    if (!mesh) return
    if (!Array.isArray(value)) return
    const geometry = mesh.geometry
    if (!geometry) return
    if (geometry instanceof THREE.BufferGeometry) {
      if(name==='color'){
        const rgb =[];
        value.forEach((v)=>{
          rgb.push(v[0],v[1],v[2])
        })
        value=rgb
      }
      geometry.setAttribute(name, new THREE.Float32BufferAttribute(value, itemSize))
    }
  }
  useEffect(() => {
    if (meshFrontRef.current) {
      const colors=[];
      forEachTriangle(meshFrontRef.current, (triangle) => {
        triangle.forEach((vertex) => {
        colors.push(generateRandomColors())
        })
      })
      setAttribute(meshFrontRef.current, 'color', colors, 3)
    }
    if (meshBackRef.current) {
      let colors=[]

      forEachTriangle(meshBackRef.current, (triangle) => {
        triangle.forEach((vertex) => {
            colors.push(generateRandomColors())
        })
      })
      setAttribute(meshBackRef.current, 'color', colors, 3)
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
      <ambientLight args={[0xffffff]} intensity={0.1} />
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
               opacity: .5,
                transparent: true,
              },
            ]}
            side={THREE.BackSide}
            vertexColors={true}
          />
        </mesh>
        <mesh ref={meshFrontRef} rednderOrder={1}>
          <convexGeometry args={[vertices]} />
          <meshLambertMaterial
            args={[
              {
                color: 0xffffff,
                opacity: .5,
               transparent: true,
              },
            ]}
            side={THREE.FrontSide}
            vertexColors={true}
          />
        </mesh>
      </group>
    </React.Fragment>
  )
}
export { WebglGeometryConvex }
