
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Center } from '@react-three/drei';
import * as THREE from 'three';

type StructureType = 'laje' | 'viga' | 'coluna' | 'fundacao' | 'trelica' | 'sapata';

interface VisualizerProps {
  type: StructureType;
  width?: number; // Comprimento ou Largura
  height?: number; // Altura ou Comprimento
  depth?: number; // Largura (para Laje)
  mainGauge: number; // Bitola Principal
  stirrupSpacing?: number; // Espaçamento estribo/malha (cm)
  useMesh?: boolean; // Para Laje com Malha Pop
}

function Loading() {
  return (
    <mesh visible position={[0, 0, 0]} rotation={[0, 0, 0]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="hotpink" transparent opacity={0.6} roughness={1} metalness={0} />
    </mesh>
  );
}

// Colors Palette
const COLORS = {
  concrete: "#e2e8f0",
  concreteEdges: "#cbd5e1",
  vigaMain: "#1e3a8a", // Dark Blue
  vigaStirrup: "#ef4444", // Red
  colunaMain: "#166534", // Green
  colunaStirrup: "#eab308", // Yellow
  lajeMesh: "#f97316", // Orange
  lajeBar: "#334155", // Slate
  fundacaoMain: "#78350f", // Brown
  fundacaoStirrup: "#94a3b8", // Slate Light
  trelicaTop: "#3b82f6", // Blue
  trelicaBot: "#1d4ed8", // Darker Blue
  trelicaZigZag: "#64748b", // Slate
  sapataMain: "#581c87", // Purple
  sapataMesh: "#d8b4fe" // Light Purple
};

// Reusable Components
const GroundPlane = ({ width, depth }: { width: number, depth: number }) => (
  <mesh position={[0, -0.01, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
    <planeGeometry args={[width, depth]} />
    <meshStandardMaterial color="#d6d3d1" side={THREE.DoubleSide} roughness={0.8} />
    <gridHelper args={[Math.max(width, depth), 10, "#a8a29e", "#e5e5e5"]} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]} />
  </mesh>
);

const ConcreteBlock = ({ position, args, color = COLORS.concrete, opacity = 0.3 }: any) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={args} />
    <meshStandardMaterial color={color} transparent opacity={opacity} roughness={0.5} />
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(...args)]} />
      <lineBasicMaterial color={COLORS.concreteEdges} />
    </lineSegments>
  </mesh>
);

const SteelBar = ({ start, end, radius, color }: any) => {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const orientation = new THREE.Matrix4();
  orientation.lookAt(start, end, new THREE.Object3D().up);
  orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  return (
    <mesh position={midPoint} quaternion={new THREE.Quaternion().setFromRotationMatrix(orientation)} castShadow>
      <cylinderGeometry args={[radius, radius, length, 16]} />
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
    </mesh>
  );
};


const Stirrup = ({ position, width, height, radius, color }: any) => {
  // Simple rectangular stirrup representation using 4 bars
  const halfW = width / 2;
  const halfH = height / 2;
  
  return (
    <group position={position}>
      {/* Top */}
      <SteelBar start={new THREE.Vector3(-halfW, halfH, 0)} end={new THREE.Vector3(halfW, halfH, 0)} radius={radius} color={color} />
      {/* Bottom */}
      <SteelBar start={new THREE.Vector3(-halfW, -halfH, 0)} end={new THREE.Vector3(halfW, -halfH, 0)} radius={radius} color={color} />
      {/* Left */}
      <SteelBar start={new THREE.Vector3(-halfW, -halfH, 0)} end={new THREE.Vector3(-halfW, halfH, 0)} radius={radius} color={color} />
      {/* Right */}
      <SteelBar start={new THREE.Vector3(halfW, -halfH, 0)} end={new THREE.Vector3(halfW, halfH, 0)} radius={radius} color={color} />
    </group>
  );
};

// Scene Components
const VigaScene = ({ width, mainGauge, stirrupSpacing }: any) => {
  const beamH = 0.4;
  const beamW = 0.2;
  const length = Math.min(width, 10);
  const barRadius = (mainGauge / 1000) / 2 * 5;
  const stirrupRadius = 0.003;

  const numStirrups = Math.floor((width * 100) / stirrupSpacing);
  const stirrupPositions = Array.from({ length: numStirrups }).map((_, i) => {
    return -length / 2 + (length / (numStirrups + 1)) * (i + 1);
  });

  return (
    <group>
      <group position={[0, -beamH/2, 0]}>
        <GroundPlane width={length + 2} depth={4} />
      </group>
      <ConcreteBlock position={[0, 0, 0]} args={[length, beamH, beamW]} />
      <group>
         <SteelBar start={new THREE.Vector3(-length/2, beamH/2 - 0.04, -beamW/2 + 0.04)} end={new THREE.Vector3(length/2, beamH/2 - 0.04, -beamW/2 + 0.04)} radius={barRadius} color={COLORS.vigaMain} />
         <SteelBar start={new THREE.Vector3(-length/2, beamH/2 - 0.04, beamW/2 - 0.04)} end={new THREE.Vector3(length/2, beamH/2 - 0.04, beamW/2 - 0.04)} radius={barRadius} color={COLORS.vigaMain} />
         <SteelBar start={new THREE.Vector3(-length/2, -beamH/2 + 0.04, -beamW/2 + 0.04)} end={new THREE.Vector3(length/2, -beamH/2 + 0.04, -beamW/2 + 0.04)} radius={barRadius} color={COLORS.vigaMain} />
         <SteelBar start={new THREE.Vector3(-length/2, -beamH/2 + 0.04, beamW/2 - 0.04)} end={new THREE.Vector3(length/2, -beamH/2 + 0.04, beamW/2 - 0.04)} radius={barRadius} color={COLORS.vigaMain} />
      </group>
      {stirrupPositions.map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
           <Stirrup position={[0,0,0]} width={beamW - 0.06} height={beamH - 0.06} radius={stirrupRadius} color={COLORS.vigaStirrup} />
        </group>
      ))}
      <Center position={[0, -beamH/2 - 0.2, 0]}>
        <Text color="black" fontSize={0.15}>Viga {width}m</Text>
      </Center>
    </group>
  );
};

const ColunaScene = ({ height, mainGauge, stirrupSpacing }: any) => {
  const colW = 0.2;
  const colD = 0.2;
  const h = Math.min(height, 5);
  const barRadius = (mainGauge / 1000) / 2 * 5;
  const stirrupRadius = 0.003;
  const numStirrups = Math.floor((height * 100) / stirrupSpacing);
  const stirrupPositions = Array.from({ length: numStirrups }).map((_, i) => {
    return -h / 2 + (h / (numStirrups + 1)) * (i + 1);
  });

  return (
    <group>
      <group position={[0, -h/2, 0]}>
        <GroundPlane width={4} depth={4} />
      </group>
      <ConcreteBlock position={[0, 0, 0]} args={[colW, h, colD]} />
      <SteelBar start={new THREE.Vector3(-colW/2 + 0.04, -h/2, -colD/2 + 0.04)} end={new THREE.Vector3(-colW/2 + 0.04, h/2, -colD/2 + 0.04)} radius={barRadius} color={COLORS.colunaMain} />
      <SteelBar start={new THREE.Vector3(colW/2 - 0.04, -h/2, -colD/2 + 0.04)} end={new THREE.Vector3(colW/2 - 0.04, h/2, -colD/2 + 0.04)} radius={barRadius} color={COLORS.colunaMain} />
      <SteelBar start={new THREE.Vector3(-colW/2 + 0.04, -h/2, colD/2 - 0.04)} end={new THREE.Vector3(-colW/2 + 0.04, h/2, colD/2 - 0.04)} radius={barRadius} color={COLORS.colunaMain} />
      <SteelBar start={new THREE.Vector3(colW/2 - 0.04, -h/2, colD/2 - 0.04)} end={new THREE.Vector3(colW/2 - 0.04, h/2, colD/2 - 0.04)} radius={barRadius} color={COLORS.colunaMain} />
      {stirrupPositions.map((y, i) => (
         <group key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <Stirrup position={[0,0,0]} width={colW - 0.06} height={colD - 0.06} radius={stirrupRadius} color={COLORS.colunaStirrup} />
         </group>
      ))}
      <Center position={[0, -h/2 - 0.2, 0]}>
        <Text color="black" fontSize={0.15}>Coluna {height}m</Text>
      </Center>
    </group>
  );
};

const LajeScene = ({ width, depth, mainGauge, stirrupSpacing, useMesh }: any) => {
  const thickness = 0.12;
  const w = Math.min(width, 6);
  const d = Math.min(depth, 6);
  const barRadius = useMesh ? 0.002 : (mainGauge / 1000) / 2 * 4;
  const spacing = stirrupSpacing / 100;
  const barColor = useMesh ? COLORS.lajeMesh : COLORS.lajeBar;
  const numX = Math.floor(w / spacing);
  const numZ = Math.floor(d / spacing);

  return (
    <group>
      <group position={[0, -thickness/2, 0]}>
        <GroundPlane width={w + 2} depth={d + 2} />
      </group>
      <ConcreteBlock position={[0, 0, 0]} args={[w, thickness, d]} opacity={0.2} />
      {Array.from({ length: numZ }).map((_, i) => {
        const z = -d/2 + (d/(numZ+1)) * (i+1);
        return <SteelBar key={`x-${i}`} start={new THREE.Vector3(-w/2 + 0.05, 0, z)} end={new THREE.Vector3(w/2 - 0.05, 0, z)} radius={barRadius} color={barColor} />;
      })}
      {Array.from({ length: numX }).map((_, i) => {
         const x = -w/2 + (w/(numX+1)) * (i+1);
         return <SteelBar key={`z-${i}`} start={new THREE.Vector3(x, 0.01, -d/2 + 0.05)} end={new THREE.Vector3(x, 0.01, d/2 - 0.05)} radius={barRadius} color={barColor} />;
      })}
      <Center position={[0, -thickness/2 - 0.2, d/2]}>
        <Text color="black" fontSize={0.15}>Laje {width}x{depth}m</Text>
      </Center>
    </group>
  );
};

const FundacaoScene = ({ width, mainGauge, stirrupSpacing }: any) => {
  const h = 0.4;
  const w = 0.25;
  const l = Math.min(width, 8);
  const stirrupRadius = 0.003;
  const barRadius = (mainGauge / 1000) / 2 * 5;
  
  const numStirrups = Math.floor((width * 100) / stirrupSpacing);
  const stirrupPositions = Array.from({ length: numStirrups }).map((_, i) => {
    return -l / 2 + (l / (numStirrups + 1)) * (i + 1);
  });

  return (
    <group>
      <group position={[0, -h/2, 0]}>
        <GroundPlane width={l + 2} depth={4} />
      </group>
      <ConcreteBlock position={[0, 0, 0]} args={[l, h, w]} />
      <group>
        <SteelBar start={new THREE.Vector3(-l/2, h/2 - 0.04, -w/2 + 0.04)} end={new THREE.Vector3(l/2, h/2 - 0.04, -w/2 + 0.04)} radius={barRadius} color={COLORS.fundacaoMain} />
        <SteelBar start={new THREE.Vector3(-l/2, h/2 - 0.04, w/2 - 0.04)} end={new THREE.Vector3(l/2, h/2 - 0.04, w/2 - 0.04)} radius={barRadius} color={COLORS.fundacaoMain} />
        <SteelBar start={new THREE.Vector3(-l/2, -h/2 + 0.04, -w/2 + 0.04)} end={new THREE.Vector3(l/2, -h/2 + 0.04, -w/2 + 0.04)} radius={barRadius} color={COLORS.fundacaoMain} />
        <SteelBar start={new THREE.Vector3(-l/2, -h/2 + 0.04, w/2 - 0.04)} end={new THREE.Vector3(l/2, -h/2 + 0.04, w/2 - 0.04)} radius={barRadius} color={COLORS.fundacaoMain} />
      </group>
      {stirrupPositions.map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
           <Stirrup position={[0,0,0]} width={w - 0.06} height={h - 0.06} radius={stirrupRadius} color={COLORS.fundacaoStirrup} />
        </group>
      ))}
      <Center position={[0, h/2 + 0.2, 0]}>
         <Text color="black" fontSize={0.15}>Baldrame {width}m</Text>
      </Center>
    </group>
  );
};

const TrelicaScene = ({ width }: any) => {
  const h = 0.15; // 15cm height
  const w = 0.10; // 10cm base width
  const l = Math.min(width, 6);
  const topColor = COLORS.trelicaTop;
  const botColor = COLORS.trelicaBot;
  const zigColor = COLORS.trelicaZigZag;
  const barRadius = 0.004;

  const numZigZags = Math.floor(l / 0.2); // 20cm spacing zigzags

  return (
    <group>
      <group position={[0, 0, 0]}>
         <GroundPlane width={l + 1} depth={3} />
      </group>
      
      {/* Top Bar */}
      <SteelBar start={new THREE.Vector3(-l/2, h, 0)} end={new THREE.Vector3(l/2, h, 0)} radius={barRadius} color={topColor} />
      {/* Bottom Bars */}
      <SteelBar start={new THREE.Vector3(-l/2, 0, -w/2)} end={new THREE.Vector3(l/2, 0, -w/2)} radius={barRadius} color={botColor} />
      <SteelBar start={new THREE.Vector3(-l/2, 0, w/2)} end={new THREE.Vector3(l/2, 0, w/2)} radius={barRadius} color={botColor} />

      {/* ZigZags */}
      {Array.from({ length: numZigZags }).map((_, i) => {
        const xStart = -l/2 + (l/numZigZags) * i;
        const xEnd = -l/2 + (l/numZigZags) * (i + 1);
        
        // Left side zig
        return (
          <group key={i}>
            <SteelBar start={new THREE.Vector3(xStart, 0, -w/2)} end={new THREE.Vector3((xStart+xEnd)/2, h, 0)} radius={0.003} color={zigColor} />
            <SteelBar start={new THREE.Vector3((xStart+xEnd)/2, h, 0)} end={new THREE.Vector3(xEnd, 0, -w/2)} radius={0.003} color={zigColor} />
            
            <SteelBar start={new THREE.Vector3(xStart, 0, w/2)} end={new THREE.Vector3((xStart+xEnd)/2, h, 0)} radius={0.003} color={zigColor} />
            <SteelBar start={new THREE.Vector3((xStart+xEnd)/2, h, 0)} end={new THREE.Vector3(xEnd, 0, w/2)} radius={0.003} color={zigColor} />
          </group>
        );
      })}
      
      <Center position={[0, -0.3, 0]}>
        <Text color="black" fontSize={0.15}>Treliça {width}m</Text>
      </Center>
    </group>
  );
};

const SapataScene = ({ width, depth, height }: any) => {
  const w = Math.min(width, 2);
  const d = Math.min(depth, 2);
  const h = Math.min(height, 1);
  const barRadius = 0.005;

  return (
    <group>
      <group position={[0, -0.05, 0]}>
        <GroundPlane width={w + 2} depth={d + 2} />
      </group>
      {/* Base Pad */}
      <ConcreteBlock position={[0, 0, 0]} args={[w, 0.1, d]} opacity={0.5} />
      {/* Column starter */}
      <ConcreteBlock position={[0, h/2, 0]} args={[0.3, h, 0.3]} opacity={0.3} />

      {/* Mesh Base */}
      <group position={[0, 0.05, 0]}>
         <SteelBar start={new THREE.Vector3(-w/2 + 0.1, 0, -d/2 + 0.1)} end={new THREE.Vector3(w/2 - 0.1, 0, -d/2 + 0.1)} radius={barRadius} color={COLORS.sapataMesh} />
         <SteelBar start={new THREE.Vector3(-w/2 + 0.1, 0, d/2 - 0.1)} end={new THREE.Vector3(w/2 - 0.1, 0, d/2 - 0.1)} radius={barRadius} color={COLORS.sapataMesh} />
         <SteelBar start={new THREE.Vector3(-w/2 + 0.1, 0, 0)} end={new THREE.Vector3(w/2 - 0.1, 0, 0)} radius={barRadius} color={COLORS.sapataMesh} />
         
         <SteelBar start={new THREE.Vector3(-w/2 + 0.1, 0, -d/2 + 0.1)} end={new THREE.Vector3(-w/2 + 0.1, 0, d/2 - 0.1)} radius={barRadius} color={COLORS.sapataMesh} />
         <SteelBar start={new THREE.Vector3(w/2 - 0.1, 0, -d/2 + 0.1)} end={new THREE.Vector3(w/2 - 0.1, 0, d/2 - 0.1)} radius={barRadius} color={COLORS.sapataMesh} />
         <SteelBar start={new THREE.Vector3(0, 0, -d/2 + 0.1)} end={new THREE.Vector3(0, 0, d/2 - 0.1)} radius={barRadius} color={COLORS.sapataMesh} />
      </group>
      
      {/* Column Starters */}
      <group position={[0, h/2, 0]}>
         <SteelBar start={new THREE.Vector3(-0.1, -h/2, -0.1)} end={new THREE.Vector3(-0.1, h/2, -0.1)} radius={0.008} color={COLORS.sapataMain} />
         <SteelBar start={new THREE.Vector3(0.1, -h/2, -0.1)} end={new THREE.Vector3(0.1, h/2, -0.1)} radius={0.008} color={COLORS.sapataMain} />
         <SteelBar start={new THREE.Vector3(-0.1, -h/2, 0.1)} end={new THREE.Vector3(-0.1, h/2, 0.1)} radius={0.008} color={COLORS.sapataMain} />
         <SteelBar start={new THREE.Vector3(0.1, -h/2, 0.1)} end={new THREE.Vector3(0.1, h/2, 0.1)} radius={0.008} color={COLORS.sapataMain} />
      </group>

      <Center position={[0, -0.4, 0]}>
        <Text color="black" fontSize={0.15}>Sapata {width}x{depth}</Text>
      </Center>
    </group>
  );
};

export default function StructureVisualizer({
  type,
  width = 3,
  height = 3,
  depth = 3,
  mainGauge,
  stirrupSpacing = 20,
  useMesh = false,
}: VisualizerProps) {
  
  return (
    <div className="w-full min-h-[400px] h-[400px] bg-slate-50 rounded-lg border border-slate-200 shadow-inner overflow-hidden relative resize-y group">
       <div className="absolute top-2 left-2 z-10 bg-white/80 p-2 rounded text-xs text-slate-500 pointer-events-none">
          Use o mouse para girar e zoom (3D)
       </div>
       <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-slate-400">
          ↕ Arraste para redimensionar
       </div>
      <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={<Loading />}>
          <group position={[0, 0, 0]} key={`${type}-${width}-${height}-${depth}-${mainGauge}-${stirrupSpacing}`}>
            {type === 'viga' && <VigaScene width={width} mainGauge={mainGauge} stirrupSpacing={stirrupSpacing} />}
            {type === 'coluna' && <ColunaScene height={height} mainGauge={mainGauge} stirrupSpacing={stirrupSpacing} />}
            {type === 'laje' && <LajeScene width={width} depth={depth} mainGauge={mainGauge} stirrupSpacing={stirrupSpacing} useMesh={useMesh} />}
            {type === 'fundacao' && <FundacaoScene width={width} mainGauge={mainGauge} stirrupSpacing={stirrupSpacing} />}
            {type === 'trelica' && <TrelicaScene width={width} />}
            {type === 'sapata' && <SapataScene width={width} depth={depth} height={height} />}
          </group>
          <OrbitControls makeDefault />
        </Suspense>
      </Canvas>
    </div>
  );
}
