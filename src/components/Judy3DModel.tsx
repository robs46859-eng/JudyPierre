import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Judy3DModelProps {
  url: string;
  isTalking: boolean;
  mood: string;
  audioUrl?: string; // Optional audio file to drive lip sync
}

export function Judy3DModel({ url, isTalking, mood, audioUrl }: Judy3DModelProps) {
  const group = useRef<THREE.Group>(null);
  
  // Audio analyzer refs for realistic lip sync
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // Load the GLB file
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  // Setup Web Audio API for lip sync if an audioUrl is provided
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      return () => {
        audio.pause();
        audioCtx.close();
      };
    }
  }, [audioUrl]);

  // Handle Play/Pause of audio based on isTalking
  useEffect(() => {
    if (audioRef.current && audioContextRef.current) {
      if (isTalking) {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isTalking]);

  // Play idle or talking animation if available
  useEffect(() => {
    if (names.length > 0) {
      const idleAnim = actions[names.find((n) => n.toLowerCase().includes("idle")) || names[0]];
      const talkingAnim = actions[names.find((n) => n.toLowerCase().includes("talk") || n.toLowerCase().includes("speak")) || ""];
      
      // Stop all first
      Object.values(actions).forEach(action => action?.stop());

      if (isTalking && talkingAnim) {
        talkingAnim.reset().fadeIn(0.3).play();
      } else if (idleAnim) {
        idleAnim.reset().fadeIn(0.3).play();
      }
    }
  }, [actions, names, isTalking]);

  // Handle facial syncing / mouth movement
  useFrame((state) => {
    let volume = 0;
    
    // If we have an audio analyzer, get real volume data
    if (analyserRef.current && dataArrayRef.current && isTalking) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;
      volume = (average / 255) * 1.5; // Map to 0-1.5 range
    } else if (isTalking) {
      // Fallback: Procedural sine wave if no real audio is provided
      volume = Math.abs(Math.sin(state.clock.elapsedTime * 15)) * 0.8;
    }

    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
            // Check for common mouth open morph targets
            const mouthOpenIdx = 
              mesh.morphTargetDictionary['mouthOpen'] ?? 
              mesh.morphTargetDictionary['jawOpen'] ??
              mesh.morphTargetDictionary['v_aa'] ??
              mesh.morphTargetDictionary['Mouth_Open'];

            if (mouthOpenIdx !== undefined) {
              // Smoothly interpolate the morph target
              mesh.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[mouthOpenIdx],
                volume,
                0.3
              );
            }
            
            // Optional: drive a smile morph target based on mood
            const smileIdx = mesh.morphTargetDictionary['smile'] ?? mesh.morphTargetDictionary['Mouth_Smile'];
            if (smileIdx !== undefined) {
              const targetSmile = mood === "happy" || mood === "sassy" ? 0.7 : 0;
              mesh.morphTargetInfluences[smileIdx] = THREE.MathUtils.lerp(
                mesh.morphTargetInfluences[smileIdx],
                targetSmile,
                0.1
              );
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