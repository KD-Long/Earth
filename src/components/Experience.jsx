import React, { useRef, useMemo } from 'react'
import { extend, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three'
import { Perf } from 'r3f-perf'


import { shaderMaterial, useTexture, OrbitControls } from '@react-three/drei';

import { useControls } from 'leva'
import * as THREE from 'three'

import vertexShader from '../shaders/earth/vertex.glsl'
import fragmentShader from '../shaders/earth/fragment.glsl'

const Experience = () => {

    const sphereRef = useRef()
    const sunDebugRef = useRef()
    const myShaderMaterialRef = useRef() // this is used to update uniforms inside the useFrame (when leva changes)

    // anisotrop is a property available on textures that will improve the sharpness of the texture when seen at a narrow angle by applying different levels of filtering

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

        // sphereRef.current.rotation.x = - elapsedTime * 0.1
        sphereRef.current.rotation.y = elapsedTime * 0.1


        // uniform update when leva controls change
        if (myShaderMaterialRef.current) {
            myShaderMaterialRef.current.uniforms.uSunDirection.value.copy(sunDirection)
        }







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
            {/* <meshBasicMaterial color={'#1ffff0'} args={[{ wireframe: false }]} /> */}
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

    </>
    )
}

export default Experience