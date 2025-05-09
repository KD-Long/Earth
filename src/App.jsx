
import './App.css'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Experience from './components/Experience'


function App() {


  return (
    <>
      <Canvas
        // not this fixes the tone mapping (colors look better)
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
          // console.log('Max anisotropy:', gl.capabilities.getMaxAnisotropy())
        }}
        shadows={true}
        camera={{
          fov: 25,
          near: 0.1,
          far: 100,
          position: [0, 0, 25]
        }}
      >
        <Experience />

x
      </Canvas>
    </>
  )
}

export default App
