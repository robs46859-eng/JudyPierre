import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Judy3DModelProps {
  url: string;
  isTalking: boolean;
  mood: string;
}

export function Judy3DModel({ url, isTalking, mood }: Judy3DModelProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load the GLB file
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  // Play idle animation by default if available
  useEffect(() => {
    if (names.length > 0) {
      const idleAnim = actions[names.find((n) => n.toLowerCase().includes("idle")) || names[0]];
      if (idleAnim) {
        idleAnim.reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  // Handle facial syncing / mouth movement
  useFrame((state) => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            // Check for common mouth open morph targets
            const mouthOpenIdx = 
              mesh.morphTargetDictionary['mouthOpen'] ?? 
              mesh.morphTargetDictionary['jawOpen'] ??
              mesh.morphTargetDictionary['v_aa'];

            if (mouthOpenIdx !== undefined) {
              if (isTalking) {
                // Procedural lip sync: modulate the morph target if talking
                // In a production app, you would drive this from audio frequency data (e.g. using Web Audio API analyzer)
                mesh.morphTargetInfluences[mouthOpenIdx] = Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.8;
              } else {
                // Reset mouth when not talking
                mesh.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(
                  mesh.morphTargetInfluences[mouthOpenIdx],
                  0,
                  0.2
                );
              }
            }
          }
        }
      });
    }
  });

  return (
    <group ref={group} dispose={null}>
      {/* Adjust scale and position based on your specific GLB */}
      <primitive object={scene} scale={1.5} position={[0, -1.2, 0]} />
    </group>
  );
}

// Preload the model to prevent popping (if a URL is provided)
// useGLTF.preload("/path/to/your/avatar.glb");
