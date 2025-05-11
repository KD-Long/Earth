import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const Ghost = ({ position, lifespan = 0.5, color = "#00ffff" }) => {
    const ref = useRef()
    const birth = useRef(performance.now() / 1000)

    useFrame(() => {
        const age = performance.now() / 1000 - birth.current
        const t = age / lifespan

        if (ref.current) {
            ref.current.material.opacity = 1 - t
        }

        if (t >= 1 && ref.current?.parent) {
            ref.current.parent.remove(ref.current)
        }
    })

    return (
        <mesh ref={ref} position={position.clone()}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={1} />
        </mesh>
    )
}

export default Ghost
