import React, { useEffect } from 'react'
import { extend, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import * as THREE from 'three'
import forEachTriangle from 'three-triangle-iterator'
extend({ OrbitControls, ConvexGeometry })

const WebglConvexGeometry = () => {
  const pointsRef = React.useRef()
  const meshFrontRef = React.useRef()

  const {
    camera,
    gl: { domElement },
  } = useThree()
  const [texture] = useLoader(TextureLoader, [
    'https://cdn.rawgit.com/mrdoob/three.js/r129/examples/textures/sprites/disc.png',
  ])
  const vertices = React.useMemo(() => {
    const vertices = new THREE.DodecahedronGeometry(10).vertices
    return vertices
  }, [])

  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.setFromPoints(vertices)
    }
  }, [vertices])

  useEffect(() => {
    if (meshFrontRef.current) {
      const colors =[];
      forEachTriangle(meshFrontRef.current, (triangle) => {
        triangle.forEach((vertex) => {
          console.log(vertex)
          const hex= '#'+(Math.random() * 0x9B270F << 0).toString(16).padStart(6, '0');
          const color = new THREE.Color()
          color.set(hex)
          colors.push(color.r,color.g,color.b)

        })
      })
      meshFrontRef.current.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(colors),3))
    }
    if(meshBackRef.current){
      const colors =[];
      forEachTriangle(meshBackRef.current, (triangle) => {
        triangle.forEach((vertex) => {
          const hex= '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');
          const color = new THREE.Color()
          color.set(hex)
          colors.push(color.r,color.g,color.b)

        })
      })
      meshFrontRef.current.geometry.setAttribute('color',new THREE.BufferAttribute(new Float32Array(colors),3))
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
          <bufferGeometry ref={pointsRef} />
        </points>

        <mesh ref={meshFrontRef} renderOrder={0}>
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
            vertextColors={THREE.VertexColors}
          />
        </mesh>
        <mesh ref={meshBackRef} rednderOrder={1}>
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
export { WebglConvexGeometry }
