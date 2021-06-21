import React, { useEffect } from 'react'
import { extend, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry'
import * as THREE from 'three'
extend({ OrbitControls, ConvexGeometry })

const WebglConvexGeometry = () => {
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
  const pointsRef = React.useRef()
  useEffect(() => {
    if (pointsRef.current) {
      pointsRef.current.setFromPoints(vertices)
    }
  }, [vertices])

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

        <mesh renderOrder={0}>
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
          />
        </mesh>
        <mesh rednderOrder={1}>
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
          />
        </mesh>
      </group>
    </React.Fragment>
  )
}
export { WebglConvexGeometry }
