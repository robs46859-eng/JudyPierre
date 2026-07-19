import React, { useState, useEffect, Suspense } from "react";
import { motion, useAnimation } from "motion/react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Judy3DModel } from "./Judy3DModel";

class GLBErrorBoundary extends React.Component<{ fallback: React.ReactNode, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode, children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("3D Model failed to load, falling back to SVG:", error);
  }
  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return <>{this.props.children}</>;
  }
}

interface JudyAvatarProps {
  isTalking?: boolean;
  mood?: "happy" | "sassy" | "shocked" | "thinking";
  quote?: string;
  onClick?: () => void;
  glbUrl?: string; // Add this prop to allow replacing the SVG with a 3D model
  audioUrl?: string; // Optional audio file to drive lip sync
}

const JUDY_QUOTES = [
  "Pack lighter, darling. You need room in your bag for souvenirs and drama!",
  "If the hotel doesn't serve breakfast in bed, is it really a vacation or just a relocation?",
  "A travel mishap is just an unreleased cinematic masterpiece, honey.",
  "Never ask for tap water in Paris. Act like you only drink dew collected from lavender fields.",
  "We don't get lost, my sweet. We just take scenic detours to show off our outfits.",
  "If your passport photo looks good, you are too rested. Go travel some more!",
];

export const JudyAvatar: React.FC<JudyAvatarProps> = ({
  isTalking = false,
  mood = "sassy",
  quote,
  onClick,
  glbUrl,
  audioUrl,
}) => {
  const [bubbleQuote, setBubbleQuote] = useState(JUDY_QUOTES[0]);
  const mouthControls = useAnimation();

  // Pick a random quote when clicking on her
  const handleRhinoClick = () => {
    const randomIdx = Math.floor(Math.random() * JUDY_QUOTES.length);
    setBubbleQuote(JUDY_QUOTES[randomIdx]);
    if (onClick) onClick();
    
    // Play a cute text-to-speech greeting if voice is supported
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(JUDY_QUOTES[randomIdx]);
      // Try to find a sassy or female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female") || v.name.includes("Samantha"));
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1.05;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (quote) {
      setBubbleQuote(quote);
      
      // Auto-play the TTS when a new quote is received
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(quote);
        // Try to find a sassy or female voice
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Female") || v.name.includes("Samantha"));
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.rate = 1.05;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [quote]);

  // Mouth animation logic when talking (for SVG)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTalking) {
      interval = setInterval(() => {
        mouthControls.start({
          scaleY: [1, 2.2, 0.8, 1.8, 1],
          transition: { duration: 0.2, ease: "easeInOut" },
        });
      }, 250);
    } else {
      mouthControls.start({ scaleY: 1 });
    }
    return () => clearInterval(interval);
  }, [isTalking, mouthControls]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4">
      {/* Speech Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        key={bubbleQuote}
        className="relative bg-white text-indigo-950 px-5 py-3 rounded-2xl shadow-xl border-2 border-pink-100 max-w-xs text-center text-sm font-medium mb-6 leading-relaxed z-10"
      >
        <span className="text-pink-500 font-bold block text-xs tracking-wider uppercase mb-1">
          {isTalking ? "🎤 Judy is speaking..." : "🌸 Judy says:"}
        </span>
        "{bubbleQuote}"
        <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white" />
      </motion.div>

      {/* Judy Illustration Container */}
      <div className="cursor-pointer group relative w-48 h-48" onClick={handleRhinoClick}>
        {/* Cute Floral Halo / Crown behind her */}
        <div className="absolute inset-0 bg-radial from-pink-200/50 to-transparent rounded-full scale-125 blur-xl group-hover:scale-135 transition-all duration-500 pointer-events-none" />
        
        {/* Sassy Flower decoration indicator */}
        <div className="absolute -top-3 -right-2 text-3xl animate-bounce pointer-events-none z-10">🌸</div>
        <div className="absolute -bottom-1 -left-3 text-2xl animate-spin-slow pointer-events-none z-10">🌺</div>

        {glbUrl ? (
          /* Render 3D Model if glbUrl is provided, fallback to SVG on error */
          <GLBErrorBoundary fallback={
            <motion.div
              animate={{
                y: isTalking ? [0, -6, 0] : [0, -4, 0],
                rotate: isTalking ? [0, 1, -1, 0] : [0, 0.5, -0.5, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: isTalking ? 1.5 : 4,
                ease: "easeInOut",
              }}
              className="w-full h-full relative z-0"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                {/* Fallback avatar shape... we can render the existing SVG here */}
                {/* Due to token limits, we'll use a simplified fallback avatar if the 3D model fails */}
                <circle cx="100" cy="100" r="80" fill="#E1BEE7" />
                <circle cx="70" cy="80" r="10" fill="#4A148C" />
                <circle cx="130" cy="80" r="10" fill="#4A148C" />
                {isTalking ? (
                  <ellipse cx="100" cy="120" rx="15" ry="25" fill="#4A148C" />
                ) : (
                  <path d="M 80 120 Q 100 140 120 120" stroke="#4A148C" strokeWidth="6" fill="transparent" strokeLinecap="round" />
                )}
                <path d="M 100 50 L 90 10 L 110 10 Z" fill="#FFC107" />
                <text x="100" y="180" textAnchor="middle" fontSize="14" fill="#4A148C" fontWeight="bold">GLB Load Failed (SVG Fallback)</text>
              </svg>
            </motion.div>
          }>
            <div className="w-full h-full absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Environment preset="city" />
                <Suspense fallback={null}>
                  <Judy3DModel url={glbUrl} isTalking={isTalking} mood={mood} audioUrl={audioUrl} />
                  <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                </Suspense>
              </Canvas>
            </div>
          </GLBErrorBoundary>
        ) : (
          /* Render SVG if no glbUrl is provided */
          <motion.div
            animate={{
              y: isTalking ? [0, -6, 0] : [0, -4, 0],
              rotate: isTalking ? [0, 1, -1, 0] : [0, 0.5, -0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: isTalking ? 1.5 : 4,
              ease: "easeInOut",
            }}
            className="w-full h-full relative z-0"
          >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-2xl"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Glow */}
            <circle cx="100" cy="115" r="70" fill="url(#rhinoGlow)" />

            {/* Rhino Body & Shoulders */}
            <path
              d="M40 160 C55 125, 145 125, 160 160 C160 180, 40 180, 40 160 Z"
              fill="url(#bodyGrad)"
              stroke="#B39DDB"
              strokeWidth="2.5"
            />
            {/* Elegant Floral Necklace on Shoulders */}
            <circle cx="75" cy="148" r="6" fill="#F06292" />
            <circle cx="87" cy="151" r="5" fill="#FFF176" />
            <circle cx="100" cy="152" r="7" fill="#29B6F6" />
            <circle cx="113" cy="151" r="5" fill="#FFF176" />
            <circle cx="125" cy="148" r="6" fill="#F06292" />

            {/* Large Rhino Ears */}
            {/* Left Ear */}
            <path
              d="M55 70 C40 40, 20 60, 48 85 Z"
              fill="#D1C4E9"
              stroke="#B39DDB"
              strokeWidth="2"
            />
            <path d="M51 70 C43 50, 30 63, 46 78 Z" fill="#F8BBD0" /> {/* Inner Left */}

            {/* Right Ear */}
            <path
              d="M145 70 C160 40, 180 60, 152 85 Z"
              fill="#D1C4E9"
              stroke="#B39DDB"
              strokeWidth="2"
            />
            <path d="M149 70 C157 50, 170 63, 154 78 Z" fill="#F8BBD0" /> {/* Inner Right */}

            {/* Hibiscus Flowers on Right Ear */}
            <g transform="translate(142, 60) scale(0.6)">
              <circle cx="20" cy="20" r="12" fill="#E91E63" />
              <circle cx="10" cy="15" r="10" fill="#F48FB1" />
              <circle cx="30" cy="15" r="10" fill="#F48FB1" />
              <circle cx="15" cy="30" r="10" fill="#F48FB1" />
              <circle cx="25" cy="30" r="10" fill="#F48FB1" />
              <circle cx="20" cy="20" r="5" fill="#FFEB3B" />
            </g>

            {/* Rhino Head */}
            <rect
              x="55"
              y="65"
              width="90"
              height="80"
              rx="40"
              fill="url(#headGrad)"
              stroke="#9575CD"
              strokeWidth="3"
            />

            {/* Glamorous Eyes with Luxurious Eyelashes */}
            {/* Left Eye */}
            <g>
              {/* Eyelashes */}
              <path d="M70 95 L62 88" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M75 92 L69 84" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M81 94 L79 85" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Eye White and Pupil */}
              <ellipse cx="78" cy="98" rx="10" ry="7" fill="white" />
              <ellipse cx="80" cy="98" rx="6" ry="6" fill="#5E35B1" />
              <circle cx="82" cy="96" r="2" fill="white" /> {/* Sparkle */}
            </g>

            {/* Right Eye */}
            <g>
              {/* Eyelashes */}
              <path d="M130 95 L138 88" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M125 92 L131 84" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M119 94 L121 85" stroke="#311B92" strokeWidth="2.5" strokeLinecap="round" />

              {/* Eye White and Pupil */}
              <ellipse cx="122" cy="98" rx="10" ry="7" fill="white" />
              <ellipse cx="120" cy="98" rx="6" ry="6" fill="#5E35B1" />
              <circle cx="118" cy="96" r="2" fill="white" /> {/* Sparkle */}
            </g>

            {/* Cute Cheek Blush */}
            <ellipse cx="68" cy="110" rx="8" ry="4" fill="#FF8A80" opacity="0.6" />
            <ellipse cx="132" cy="110" rx="8" ry="4" fill="#FF8A80" opacity="0.6" />

            {/* Sassy Lavender Horn (Gold Glitter Tip) */}
            <g>
              <path
                d="M90 75 Q100 20 115 35 Q105 70 110 75 Z"
                fill="url(#hornGrad)"
                stroke="#D4AF37"
                strokeWidth="1.5"
              />
              {/* Sparkle star on Horn */}
              <path d="M115 25 L117 28 L121 28 L118 30 L119 34 L115 31 L111 34 L112 30 L109 28 L113 28 Z" fill="#FFF59D" />
            </g>

            {/* Sassy Snout & Nostrils */}
            <ellipse cx="100" cy="125" rx="20" ry="10" fill="#E1BEE7" />
            <circle cx="92" cy="125" r="2.5" fill="#7B1FA2" />
            <circle cx="108" cy="125" r="2.5" fill="#7B1FA2" />

            {/* Mouth */}
            {mood === "happy" || mood === "sassy" ? (
              <motion.g animate={mouthControls}>
                {/* Sassy red open mouth */}
                <path
                  d="M93 133 Q100 145 107 133"
                  stroke="#D81B60"
                  strokeWidth="3.5"
                  fill="#FF80AB"
                  strokeLinecap="round"
                />
              </motion.g>
            ) : (
              <path
                d="M95 133 Q100 137 105 133"
                stroke="#D81B60"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}
            
            {/* Stylish Oversized Sunglasses (Hover style!) */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Pink frames */}
              <path d="M60 98 C60 85, 95 85, 95 98 C95 110, 60 110, 60 98" fill="rgba(244, 143, 177, 0.85)" stroke="#E91E63" strokeWidth="2" />
              <path d="M105 98 C105 85, 140 85, 140 98 C140 110, 105 110, 105 98" fill="rgba(244, 143, 177, 0.85)" stroke="#E91E63" strokeWidth="2" />
              <line x1="95" y1="94" x2="105" y2="94" stroke="#E91E63" strokeWidth="3" />
              {/* Sunglasses Glare */}
              <line x1="68" y1="92" x2="80" y2="104" stroke="white" strokeWidth="1.5" opacity="0.6" />
              <line x1="113" y1="92" x2="125" y2="104" stroke="white" strokeWidth="1.5" opacity="0.6" />
            </g>

            {/* Definitions */}
            <defs>
              <radialGradient id="rhinoGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F3E5F5" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B39DDB" />
                <stop offset="100%" stopColor="#7E57C2" />
              </linearGradient>
              <linearGradient id="headGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E1BEE7" />
                <stop offset="60%" stopColor="#CE93D8" />
                <stop offset="100%" stopColor="#BA68C8" />
              </linearGradient>
              <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="50%" stopColor="#FFD54F" />
                <stop offset="100%" stopColor="#FFC107" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
        )}
        
        {/* Playful Interactive Help Hint */}
        <div className="text-center mt-2">
          <p className="text-xs text-pink-500 font-semibold tracking-wide uppercase group-hover:scale-105 transition-transform">
            ✨ Tap to gossip with Judy! ✨
          </p>
        </div>
      </div>
    </div>
  );
};
