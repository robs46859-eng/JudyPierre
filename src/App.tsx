/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Calendar, Camera, Wifi, WifiOff, Heart, Sparkles } from "lucide-react";
import { JudyAvatar } from "./components/JudyAvatar";
import { Interpreter } from "./components/Interpreter";
import { ItineraryPlanner } from "./components/ItineraryPlanner";
import { CameraStudio } from "./components/CameraStudio";

export default function App() {
  const [activeTab, setActiveTab] = useState<"translate" | "itinerary" | "camera">("translate");
  const [isOffline, setIsOffline] = useState(false);
  const [isJudyTalking, setIsJudyTalking] = useState(false);
  const [judyQuote, setJudyQuote] = useState(
    "Hello gorgeous! I am Judy, your lavender rhino companion. Ready to turn some travel disasters into pure high-fashion drama?"
  );

  // Trigger speech synthesis welcoming the user when app loads
  useEffect(() => {
    // Small greeting delay for user interaction readiness
    const timer = setTimeout(() => {
      setJudyQuote("Let's plan your fabulous getaway, honey! Where are we flying to?");
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  const toggleOffline = () => {
    setIsOffline(!isOffline);
    if (!isOffline) {
      setJudyQuote("Flipping to offline mode! No signal, no problem, my sweet. I have everything loaded right here in my horn!");
    } else {
      setJudyQuote("Hooray! Connected back to the high-fashion cloud. Let's do some AI magic, gorgeous.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F5] via-[#FFF9FB] to-[#F3E5F5] text-slate-800 font-sans flex flex-col items-center justify-start overflow-x-hidden pb-12 relative selection:bg-pink-200">
      
      {/* Decorative Floating Floral Elements in Background */}
      <div className="absolute top-10 left-10 text-4xl opacity-15 pointer-events-none select-none animate-spin-slow">🌸</div>
      <div className="absolute top-40 right-10 text-4xl opacity-15 pointer-events-none select-none animate-bounce">🌺</div>
      <div className="absolute bottom-40 left-5 text-4xl opacity-10 pointer-events-none select-none animate-pulse">🍹</div>
      <div className="absolute bottom-20 right-5 text-4xl opacity-10 pointer-events-none select-none animate-spin-slow">🌻</div>

      {/* Main Responsive Mobile Frame */}
      <main className="w-full max-w-md px-4 pt-6 flex flex-col gap-6 relative z-10">
        
        {/* Header App Bar */}
        <header className="bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl filter drop-shadow">🦏</span>
            <div>
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-purple-700 to-pink-500 bg-clip-text text-transparent">
                JUDY
              </h1>
              <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                Gay Travel Companion
              </p>
            </div>
          </div>

          {/* Offline Toggle Badge */}
          <button
            onClick={toggleOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
              isOffline
                ? "bg-amber-500 text-white border-amber-400 shadow-sm shadow-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" /> Offline
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" /> Cloud Active
              </>
            )}
          </button>
        </header>

        {/* Central Heart Component: Animated Talking Judy */}
        {/* Note: To use a 3D animated GLB model instead of the SVG, simply pass the `glbUrl` prop. 
            Example: <JudyAvatar isTalking={isJudyTalking} quote={judyQuote} onClick={() => {}} glbUrl="/path/to/judy.glb" />
        */}
        <JudyAvatar isTalking={isJudyTalking} quote={judyQuote} onClick={() => {}} />

        {/* Navigation Tabs */}
        <nav className="grid grid-cols-3 bg-white/90 backdrop-blur shadow-md rounded-2xl p-1.5 border border-pink-100/50">
          <button
            onClick={() => {
              setActiveTab("translate");
              setJudyQuote("Want to gossip with the locals? I translate with class, sweetie.");
            }}
            className={`flex flex-col items-center justify-center py-3 rounded-xl gap-1 transition-all cursor-pointer ${
              activeTab === "translate"
                ? "bg-pink-500 text-white shadow-md shadow-pink-100 font-extrabold"
                : "text-purple-950/60 hover:text-pink-500 font-bold"
            }`}
          >
            <Globe className="w-4.5 h-4.5" />
            <span className="text-[10px] uppercase tracking-wider">Interpreter</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("itinerary");
              setJudyQuote("Let's draft an itinerary so dramatic, they'll make a film about it!");
            }}
            className={`flex flex-col items-center justify-center py-3 rounded-xl gap-1 transition-all cursor-pointer ${
              activeTab === "itinerary"
                ? "bg-pink-500 text-white shadow-md shadow-pink-100 font-extrabold"
                : "text-purple-950/60 hover:text-pink-500 font-bold"
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span className="text-[10px] uppercase tracking-wider">Itinerary</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("camera");
              setJudyQuote("Capture that glorious vacation meltdown and let's make it art, honey.");
            }}
            className={`flex flex-col items-center justify-center py-3 rounded-xl gap-1 transition-all cursor-pointer ${
              activeTab === "camera"
                ? "bg-pink-500 text-white shadow-md shadow-pink-100 font-extrabold"
                : "text-purple-950/60 hover:text-pink-500 font-bold"
            }`}
          >
            <Camera className="w-4.5 h-4.5" />
            <span className="text-[10px] uppercase tracking-wider">Mishap Filter</span>
          </button>
        </nav>

        {/* Main Feature Content Stage */}
        <div className="flex-1 min-h-[350px]">
          <AnimatePresence mode="wait">
            {activeTab === "translate" && (
              <motion.div
                key="translate"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Interpreter
                  isOffline={isOffline}
                  onTalkingChange={setIsJudyTalking}
                  onSetJudyQuote={setJudyQuote}
                />
              </motion.div>
            )}

            {activeTab === "itinerary" && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <ItineraryPlanner onSetJudyQuote={setJudyQuote} />
              </motion.div>
            )}

            {activeTab === "camera" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <CameraStudio isOffline={isOffline} onSetJudyQuote={setJudyQuote} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Humorous Humble Human footer */}
        <footer className="text-center space-y-1.5 mt-8 border-t border-pink-100/50 pt-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-pink-500 fill-pink-500" /> & lavender joy by Judy
          </p>
          <p className="text-[9px] text-gray-400 font-medium">
            Remember, gorgeous: a passport without a dramatic story is just an empty book!
          </p>
        </footer>

      </main>
    </div>
  );
}
