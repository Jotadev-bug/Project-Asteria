"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { MapControls, Stars, Line } from "@react-three/drei";
import { useRef, useMemo, useState, Suspense } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { getCartesianPosition, generateOrbitPoints, AU_SCALAR } from "../utils/orbitalMechanics";

function Sun() {
  return (
    <mesh>
      <sphereGeometry args={[2.0, 64, 64]} />
      <meshBasicMaterial color="#f98500ff" />
      <pointLight intensity={4} distance={800} color="#ff9900ff" decay={1} />
    </mesh>
  );
}

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const earthTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg");
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005; // Axial rotation
      const t = clock.getElapsedTime() * 0.05;
      meshRef.current.position.x = Math.cos(t) * AU_SCALAR;
      meshRef.current.position.z = Math.sin(t) * AU_SCALAR;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.9, 64, 64]} />
      <meshStandardMaterial map={earthTexture} roughness={0.7} metalness={0.1} />
      {/* Delicate Atmosphere */}
      <mesh>
        <sphereGeometry args={[0.93, 64, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </mesh>
  );
}

interface AsteroidProps {
  a: number;
  e: number;
  i: number;
  om: number;
  w: number;
  ma: number;
  epoch: number;
  diameter: number;
  onClick: () => void;
}

function Asteroid({ a, e, i, om, w, ma, epoch, diameter, onClick }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use a moon texture as a high-fidelity proxy for a cratered asteroid surface
  const moonTexture = useLoader(TextureLoader, "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg");
  
  // Highly visual cinematic scale for asteroids
  const visualSize = useMemo(() => Math.max(0.12, Math.min(diameter * 0.25, 0.7)), [diameter]);
  
  const orbitPoints = useMemo(() => {
    return generateOrbitPoints(a, e, i, om, w, 150).map(p => new THREE.Vector3(...p));
  }, [a, e, i, om, w]);
  
  // Ensure we don't start everyone at the exact same point if no real 'ma' is provided
  const baseMa = useMemo(() => (ma !== undefined ? ma * (Math.PI / 180) : Math.random() * Math.PI * 2), [ma]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.02;
      
      // Calculate realistic position
      // We simulate time by adding the elapsed time to the Mean Anomaly
      // Asteroids with larger 'a' move slower (inversely proportional to a^1.5)
      const t = clock.getElapsedTime();
      const meanMotion = Math.pow(a, -1.5) * 0.05; // Considerably slower for clickability
      const currentMa = baseMa + t * meanMotion;
      
      const [x, y, z] = getCartesianPosition(a, e, i * (Math.PI/180), om * (Math.PI/180), w * (Math.PI/180), currentMa);
      
      meshRef.current.position.set(x, y, z);
    }
  });

  return (
    <group>
      <mesh 
         ref={meshRef} 
         onClick={(event) => {
           event.stopPropagation();
           onClick();
         }}
         onPointerOver={(e) => {
           document.body.style.cursor = 'pointer';
           setIsHovered(true);
         }}
         onPointerOut={(e) => {
           document.body.style.cursor = 'auto';
           setIsHovered(false);
         }}
      >
        <sphereGeometry args={[visualSize, 32, 32]} />
        <meshStandardMaterial map={moonTexture} roughness={0.9} metalness={0.2} color="#cccccc" />
      </mesh>
      
      {isHovered && (
        <Line 
          points={orbitPoints} 
          color="#88ccff" 
          opacity={0.35} 
          transparent 
          lineWidth={1.5}
        />
      )}
    </group>
  );
}

// Ensure the massive textures don't break the app during mounting.
function SceneObjects({ asteroids, onSelect }: any) {
  const validAsteroids = useMemo(() => {
     return asteroids.filter((neo: any) => neo.a !== undefined && neo.diameter !== undefined);
  }, [asteroids]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <Stars radius={500} depth={150} count={8000} factor={6} saturation={0} fade speed={0.2} />
      
      <Sun />
      <Earth />
      
      {validAsteroids.map((ast: any, i: number) => (
        <Asteroid 
           key={i} 
           a={ast.a} 
           e={ast.e} 
           i={ast.i}
           om={ast.om}
           w={ast.w}
           ma={ast.ma}
           epoch={ast.epoch}
           diameter={ast.diameter}
           onClick={() => onSelect(ast)}
        />
      ))}
    </>
  );
}

export default function AsteroidCanvas({ asteroids, onSelect }: { asteroids: any[], onSelect: (ast: any) => void }) {
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* We strip typical color management parameters for starker reality */}
      <Canvas camera={{ position: [0, 30, 80], fov: 60, near: 0.1, far: 2000 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <color attach="background" args={["#000000"]} />
        
        {/* We constrain the maxDistance safely inside the Starfield! */}
        <MapControls enableDamping={true} panSpeed={2} zoomSpeed={1.5} maxDistance={350} minDistance={2} />
        
        <Suspense fallback={null}>
          <SceneObjects asteroids={asteroids} onSelect={onSelect} />
        </Suspense>

        <EffectComposer>
          {/* Tone down the bloom so the planets can punch through visually */}
          <Bloom luminanceThreshold={0.8} mipmapBlur intensity={0.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
