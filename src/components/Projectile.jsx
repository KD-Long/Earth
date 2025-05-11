import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import Ghost from './Ghost';



function latLonToVec3(lat, lon, radius = 1) {
    const latOffset = 0;
    const lonOffset = -90;
    const phi = (90 - lat + latOffset) * (Math.PI / 180)
    const theta = (lon + 180 + lonOffset) * (Math.PI / 180)
    return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
}

const Projectile = ({ onDone, fromLat, fromLon, toLat, toLon, duration = 5, radius = 2, arcHeight = 1.5, color = '#00ffff' }) => {
    const ref = useRef()
    const [startTime] = useState(() => performance.now() / 1000)

    const [ghosts, setGhosts] = useState([])
    const lastGhostTime = useRef(0)



    const { curve } = useMemo(() => {
        const start = latLonToVec3(fromLat, fromLon, radius)
        const end = latLonToVec3(toLat, toLon, radius)

        // Direction halfway between start and end
        const midDirection = new THREE.Vector3().addVectors(start, end).normalize()

        // First control point near start, lifted
        const control1 = new THREE.Vector3().copy(start)
        control1.add(midDirection.clone().multiplyScalar(arcHeight))
        control1.setLength(radius + arcHeight)

        // Second control point near end, lifted
        const control2 = new THREE.Vector3().copy(end)
        control2.add(midDirection.clone().multiplyScalar(arcHeight))
        control2.setLength(radius + arcHeight)

        const curve = new THREE.CubicBezierCurve3(start, control1, control2, end)
        return { curve }
    }, [fromLat, fromLon, toLat, toLon, radius, arcHeight])



    useFrame((state, delta) => {
        const elapsed = performance.now() / 1000 - startTime
        const t = Math.min(elapsed / duration, 1)
        const position = curve.getPoint(t)
        if (ref.current) {
            ref.current.position.copy(position)
        }


        // Spawn a ghost every 0.05 seconds
        if (elapsed - lastGhostTime.current > 0.05) {
            lastGhostTime.current = elapsed
            setGhosts(prev => [...prev, { position: position.clone(), key: crypto.randomUUID() }])
        }
        // trigger arc complete
        if (t >= 1 && onDone) onDone()
    })

    return (<>

        <mesh ref={ref}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color={color} />
            {/* <meshBasicMaterial color={'#00ffff'} args={[{ wireframe: true, toneMapped: false }]} /> */}
        </mesh>

        {ghosts.map(({ position, key }) => (
            <Ghost
                key={key}
                position={position}
                color={color}
            />
        ))}

    </>)
}

export default Projectile