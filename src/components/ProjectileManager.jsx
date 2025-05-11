import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { button, useControls } from 'leva'
import Projectile from './Projectile'
import { Color } from 'three'

const ProjectileManager = () => {
    // Store the active projectiles in state
    const [projectiles, setProjectiles] = useState([])

    // Function to spawn a new projectile
    const spawnProjectile = (fromLat, fromLon, toLat, toLon, color) => {
        setProjectiles((prev) => [
            ...prev,
            { fromLat, fromLon, toLat, toLon, id: Math.random(), color } // Unique ID for each projectile
        ])
    }

    // Cleanup function to remove a projectile from the state after animation
    const cleanupProjectile = (id) => {
        setProjectiles((prev) => prev.filter((p) => p.id !== id))
    }


    // LEVA
    // Button to trigger spawning a new projectile
    useControls('spawnProjectile', {
        spawn: button(() => {
            const { lat, lon } = getRandomCoordinates(40, -100);
            spawnProjectile(lat, lon, -30, 140, getRandomColor()) // Example lat/lon coords
        }),
    })
    useControls('spawn10', {
        spawn: button(() => {
            // const { lat, lon } = getRandomCoordinates(40, -100);
            // spawnProjectile(lat, lon, -30, 140, getRandomColor()) // Example lat/lon coords
            for (let i = 0; i < 10; i++) {
                const { lat, lon } = getRandomCoordinates(40, -100);
                spawnProjectile(lat, lon, -30, 140, getRandomColor()) // Example lat/lon coords
            }
        }),
    })

    function getRandomColor() {
        return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
    }

    function getRandomCoordinates(lat, lon, radius = 30) {
        // Random offset for latitude
        const latOffset = (Math.random() - 0.5) * 2 * radius; // random value within radius

        // Random offset for longitude
        const lonOffset = (Math.random() - 0.5) * 2 * radius;

        // Calculate new lat/lon within the radius
        const newLat = lat + latOffset;
        const newLon = lon + lonOffset;

        // Ensure the new lat/lon are within valid bounds
        const clampedLat = Math.min(Math.max(newLat, -90), 90);
        const clampedLon = Math.min(Math.max(newLon, -180), 180);

        return { lat: clampedLat, lon: clampedLon };
    }

    // Update projectiles: for each, render the Projectile component
    return (
        <>
            {projectiles.map((p) => (
                <Projectile
                    key={p.id}
                    onDone={() => cleanupProjectile(p.id)} // Cleanup when done
                    fromLat={p.fromLat}
                    fromLon={p.fromLon}
                    toLat={p.toLat}
                    toLon={p.toLon}
                    color={p.color}
                />
            ))}
        </>
    )
}

export default ProjectileManager
