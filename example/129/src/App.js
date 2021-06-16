import { useEffect } from 'react'
import { init, animate } from './webgl_geometry_convex'

function App() {
  useEffect(() => {
    init()
    animate()
  }, [])
  return (
    <div className="App">
      <p>Webgl Convex Geometry Example</p>
    </div>
  )
}

export default App
