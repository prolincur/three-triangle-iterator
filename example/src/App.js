import logo from './logo.svg';
import './App.css';
import {useEffect} from "react";
import {init,animate} from "./webgl_geometry_convex";

function App() {
  useEffect(()=>{
    init();
    animate();
  })
  return (
    <div className="App">

    </div>
  );
}

export default App;
