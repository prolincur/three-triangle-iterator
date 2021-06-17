import React from 'react'
import { extend, useThree } from '@react-three/fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
extend({ OrbitControls })
const WebglGeometryConvex = () => {
  const {
    camera,
    gl: { domElement },
  } = useThree()

  return (
    <React.Fragment>
      <orbitControls args={[camera, domElement]} />
      <ambientLight intensity={0.1} />
      <directionalLight color="red" position={[0, 0, 5]} />
      <mesh>
        <boxGeometry />
        <meshPhongMaterial />
      </mesh>
    </React.Fragment>
  )
}
export { WebglGeometryConvex }
