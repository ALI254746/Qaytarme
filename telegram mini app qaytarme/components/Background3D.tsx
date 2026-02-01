"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, PerspectiveCamera, Environment, Lightformer } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";

function FloatingShape({ position, color, ...props }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float
      speed={2} 
      rotationIntensity={1.5} 
      floatIntensity={2} 
      floatingRange={[-0.2, 0.2]}
    >
      <mesh 
        ref={meshRef} 
        position={position}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.1 : 1}
        {...props}
      >
        <dodecahedronGeometry args={[0.8, 0]} />
        <MeshTransmissionMaterial
          backside
          backsideThickness={5}
          thickness={2}
          roughness={0.1}
          transmission={0.95}
          ior={1.5}
          chromaticAberration={0.4} // Split colors for "wow" effect
          anisotropy={20}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.2}
          color={color}
          background={new THREE.Color("#F7F6E2")}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
      
      {/* Decorative Lights for reflections */}
      <Environment preset="city">
         <Lightformer intensity={2} position={[10, 5, 0]} scale={[10, 50, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
         <Lightformer intensity={2} color="#A9D3C9" position={[-1, 10, -2]} scale={[10, 2, 1]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
      </Environment>

      {/* Floating Glass Shapes */}
      <FloatingShape position={[-1.5, 1, 0]} color="#A9D3C9" /> {/* Mint */}
      <FloatingShape position={[1.8, -0.5, 1]} color="#E05D5D" /> {/* Red/Destructive accent */}
      <FloatingShape position={[0, -2, -2]} color="#6B6A65" /> {/* Muted foreground */}
      
      {/* Optional Particles or Stars could go here */}
    </>
  );
}

export default function Background3D() {
  return (
    <div className="fixed inset-0 z-[-1] w-full h-full bg-[#f7f6e2] pointer-events-none">
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  );
}
