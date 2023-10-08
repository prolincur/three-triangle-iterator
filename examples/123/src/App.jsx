import React from 'react'
import { Canvas } from '@react-three/fiber'
import { WebglConvexGeometry } from './WebglGeometryConvex'
import './App.css'

function App() {
  const style = {
    width: '100%',
    height: '100%',
    background: 0,
    position: 'absolute',
    top: 0,
    left: 0,
  }
  return (
    <div className="App" style={style}>
      <p>Webgl Convex Geometry Example using React</p>
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
          <WebglConvexGeometry />
        </React.Suspense>
      </Canvas>
    </div>
  )
}

export default App
