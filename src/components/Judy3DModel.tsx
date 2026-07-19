import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface Judy3DModelProps {
  url: string;
  isTalking: boolean;
  mood: string;
  audioUrl?: string;
}

const FRONT_FACING_YAW = Math.PI;

export function Judy3DModel({ url, isTalking, mood, audioUrl }: Judy3DModelProps) {
  const group = useRef<THREE.Group>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);
  const animationNames = useMemo(() => Object.keys(actions), [actions]);

  useEffect(() => {
    const preferredName = isTalking
      ? animationNames.find((name) => /talk|speak|voice/i.test(name))
      : animationNames.find((name) => /idle|breath|stand/i.test(name));
    const action = preferredName ? actions[preferredName] : undefined;
    Object.values(actions).forEach((candidate) => candidate?.fadeOut(0.2));
    action?.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, animationNames, isTalking]);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isTalking) void audio.play().catch(() => undefined);
    else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isTalking]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const time = clock.elapsedTime;
    const energy = isTalking ? 1 : 0.35;
    const baseScale = 2.05;
    const breathing = Math.sin(time * 2.2) * 0.012;
    const targetScale = baseScale + breathing;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(delta * 4, 1));
    group.current.position.y = -0.12 + Math.sin(time * (isTalking ? 3.4 : 1.5)) * 0.035 * energy;
    group.current.rotation.y = FRONT_FACING_YAW + Math.sin(time * 0.8) * 0.045;
    group.current.rotation.z = Math.sin(time * (isTalking ? 2.8 : 0.7)) * 0.018 * energy;

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.morphTargetDictionary || !child.morphTargetInfluences) return;
      const mouthIndex =
        child.morphTargetDictionary.mouthOpen ??
        child.morphTargetDictionary.jawOpen ??
        child.morphTargetDictionary.Mouth_Open;
      if (mouthIndex !== undefined) {
        const target = isTalking ? 0.15 + Math.abs(Math.sin(time * 13)) * 0.55 : 0;
        child.morphTargetInfluences[mouthIndex] = THREE.MathUtils.lerp(
          child.morphTargetInfluences[mouthIndex],
          target,
          0.25,
        );
      }
    });
  });

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/my-rigged-avatar.glb");
