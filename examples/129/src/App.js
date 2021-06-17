import React from 'react'
import { WebglGeometryConvex } from './WebglGeometryConvex'
import { Canvas, useFrame } from '@react-three/fiber'

function App() {
  return (
    <div className="App">
      <Canvas
        camera={{
          fov: 40,
          near: 1,
          far: 1000,
          position: [15, 20, 30],
          aspect: window.innerWidth / window.innerHeight,
        }}
      >
        <React.Suspense fallback={null}>
          <WebglGeometryConvex />
        </React.Suspense>
      </Canvas>
    </div>
  )
}

export default App
