import React, { useRef, useMemo, useState } from 'react'
import { extend, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three'
import { Perf } from 'r3f-perf'


import { shaderMaterial, useTexture, OrbitControls } from '@react-three/drei';

import { useControls } from 'leva'
import * as THREE from 'three'

import vertexShader from '../shaders/earth/vertex.glsl'
import fragmentShader from '../shaders/earth/fragment.glsl'
import Projectile from './Projectile';
import ProjectileManager from './ProjectileManager';

const Experience = () => {

    const sphereRef = useRef()
    const sunDebugRef = useRef()
    const myShaderMaterialRef = useRef() // this is used to update uniforms inside the useFrame (when leva changes)

    const [projectiles, setProjectiles] = useState([])



    // Controls

    //Spherical Phi bottopm up Theta left to right
    const { bgColor, holoColor, radius, phi, theta } = useControls({
        bgColor: { value: '#1d1f2a', label: 'Background Color' },
        holoColor: { value: '#0070ff', label: 'holo Color' },
        radius: { value: 1, min: 0, max: 5, step: 0.01 },
        phi: { value: Math.PI * 0.5, min: 0, max: Math.PI, step: 0.01, label: 'Phi (Vertical)' },
        theta: { value: 0.5, min: 0, max: Math.PI * 2, step: 0.01, label: 'Theta (Horizontal)' },
    });

    // Convert to Spherical and then to Cartesian (Vector3) for the shader
    const sunDirection = useMemo(() => {
        //Spherical Phi bottom up Theta left to right
        // THREE.Spherical(radius, phi, theta)
        const spherical = new THREE.Spherical(radius, phi, theta)
        return new THREE.Vector3()
            .setFromSpherical(spherical)
            .multiplyScalar(5)
    }, [radius, phi, theta])


    // Regions
    const apac = latLonToVec3(-30, 140, 1)
    const amer = latLonToVec3(40, -100, 1)
    const emea = latLonToVec3(50, 10, 1)

    function latLonToVec3(lat, lon, radius = 1) {
        const latOffset = 0;
        const lonOffset = -90;
        const phi = (90 - lat + latOffset) * (Math.PI / 180)
        const theta = (lon + 180 + lonOffset) * (Math.PI / 180)
        return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta)
    }

    //projectile
    const startRegion = latLonToVec3(40, -100, 1); // Start location (e.g., AMER)
    const endRegion = latLonToVec3(-30, 140, 1); // End location (e.g., APAC)

    let t = 0; // Time parameter for interpolation, moves between 0 and 1


    // Function to interpolate between two points on the globe
    // the arc between
    function interpolatePosition(startVec3, endVec3, t) {
        return new THREE.Vector3().lerpVectors(startVec3, endVec3, t); // Linear interpolation
    }



    // Shader 

    let [earthDayTexture, earthNightTexture, earthSpecularCloudsTexture] = useLoader(TextureLoader, ['earth/day.jpg', 'earth/night.jpg', 'earth/specularClouds.jpg'])

    // This color space makes the textures sharper
    earthDayTexture.colorSpace = THREE.SRGBColorSpace
    earthNightTexture.colorSpace = THREE.SRGBColorSpace
    earthSpecularCloudsTexture.colorSpace = THREE.SRGBColorSpace

    // This makes the globe edges clearer
    // anisotrop is a property available on textures that will improve the sharpness of the texture when seen at a narrow angle by applying different levels of filtering
    earthDayTexture.anisotropy = 8
    earthNightTexture.anisotropy = 8
    earthSpecularCloudsTexture.anisotropy = 8

    const MyShaderMaterial = shaderMaterial({
        uTime: 0,
        uDayTexture: earthDayTexture,
        uNightTexture: earthNightTexture,
        uSpecularCloudsTexture: earthSpecularCloudsTexture,
        uSunDirection: sunDirection,
        uRegionAPAC: apac,
        uRegionAMER: amer,
        uRegionEMEA: emea,
    },
        vertexShader,
        fragmentShader
    )
    //this exent allows it to be used a a component below
    // Note: When using "extend" which register custom components with the JSX reconciler, 
    // use lowercase names for those components, regardless of how they are initially defined.
    extend({ MyShaderMaterial: MyShaderMaterial })




    //Animation
    useFrame((state, delta) => {



        const elapsedTime = state.clock.elapsedTime
        const rotation = 0
        // rotation = 0.1

        // sphereRef.current.rotation.x = - elapsedTime * 0.1
        sphereRef.current.rotation.y = elapsedTime * rotation


        // uniform update when leva controls change
        if (myShaderMaterialRef.current) {
            myShaderMaterialRef.current.uniforms.uSunDirection.value.copy(sunDirection)
        }




        // Apply the same rotation to regions to make them move with the globe
        const rotationMatrix = new THREE.Matrix4().makeRotationY(elapsedTime * rotation)

        // Apply the rotation to each region
        const rotatedAPAC = apac.clone().applyMatrix4(rotationMatrix)
        const rotatedAMER = amer.clone().applyMatrix4(rotationMatrix)
        const rotatedEMEA = emea.clone().applyMatrix4(rotationMatrix)

        // Update shader uniforms with the rotated region positions
        if (myShaderMaterialRef.current) {
            myShaderMaterialRef.current.uniforms.uRegionAPAC.value.copy(rotatedAPAC)
            myShaderMaterialRef.current.uniforms.uRegionAMER.value.copy(rotatedAMER)
            myShaderMaterialRef.current.uniforms.uRegionEMEA.value.copy(rotatedEMEA)
            myShaderMaterialRef.current.uniforms.uSunDirection.value.copy(sunDirection)
        }

        // Projectile
        t += delta * 0.2; // Adjust speed of the projectile here
        if (t > 1) t = 1; // Ensure the projectile stops at the destination
        // Interpolate between start and end region
        const position = interpolatePosition(startRegion, endRegion, t);

        // Update the position of your projectile (the moving dot or arc)
        // projectileRef.current.position.set(position.x, position.y, position.z)





        // update utime
        // sphereRef.current.material.uniforms.uTime.value = elapsedTime

        // update color shader with color picker from useControls
        // sphereRef.current.material.uniforms.uColor.value= new THREE.Color(holoColor)

        // state.camera.lookAt(0, 0, 0);
    })

    return (<>
        <OrbitControls makeDefault />
        {/* Sets background */}
        <color args={['#1d1f2a']} attach='background' />

        <mesh
            ref={sphereRef}
            position={[0, 0, 0]}
        >
            <sphereGeometry args={[2, 64, 64]} />
            {/* <meshBasicMaterial color={'#ffffff'} args={[{ wireframe: true }]} /> */}
            <myShaderMaterial
                ref={myShaderMaterialRef}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>

        <mesh
            ref={sunDebugRef}
            position={sunDirection}
        >
            <icosahedronGeometry args={[0.1, 2]} />
            <meshBasicMaterial color={'#ff0000'} />
        </mesh>

        {/* const apac = latLonToVec3(-30, 140, 1)
        const amer = latLonToVec3(40, -100, 1)
        const emea = latLonToVec3(50, 10, 1) */}

        {/* <Projectile
            // onDone={() => removeThisProjectile(id)}
            fromLat={-30}
            fromLon={140}
            toLat={40}
            toLon={-100}
        />
        <Projectile
            fromLat={40}
            fromLon={-100}
            toLat={-30}
            toLon={140}
        />
        <Projectile
            fromLat={50}
            fromLon={10}
            toLat={-30}
            toLon={140}
        /> */}

        <ProjectileManager />


    </>
    )
}

export default Experience