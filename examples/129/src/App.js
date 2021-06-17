import { WebglGeometryConvex } from './WebglGeometryConvex'
import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <div className="App">
      <Canvas>
        <WebglGeometryConvex />
      </Canvas>
    </div>
  )
}

export default App
