import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Upload, Sparkles, Sliders, RefreshCw, Star, Download, Share2, Clipboard, Heart, AlertCircle, X } from "lucide-react";
import { FUNNY_STICKERS } from "../data/offlineDictionary";

interface CameraStudioProps {
  onSetJudyQuote: (quote: string) => void;
  isOffline: boolean;
}

interface PlacedSticker {
  id: string;
  stickerId: string;
  text: string;
  color: string;
  x: number; // percentage
  y: number; // percentage
  scale: number;
}

interface AIResult {
  cinematicTitle: string;
  judysCritique: string;
  rescuePlan: string[];
  stickerRecommendation: string[];
}

export const CameraStudio: React.FC<CameraStudioProps> = ({ onSetJudyQuote, isOffline }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("none");
  const [customCaption, setCustomCaption] = useState("");
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerIdx, setSelectedStickerIdx] = useState<number | null>(null);
  
  // AI review states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  // Webcam variables
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCamActive, setIsCamActive] = useState(false);
  const [camError, setCamError] = useState("");

  const FILTERS = [
    { id: "none", name: "No Filter", cssClass: "" },
    { id: "cinematic", name: "🎬 Cinematic Disaster", cssClass: "sepia contrast-125 saturate-150 brightness-95" },
    { id: "lavender", name: "🦏 Lavender Oasis", cssClass: "hue-rotate-[290deg] saturate-150 contrast-110" },
    { id: "drama", name: "🎭 Total Drama Grayscale", cssClass: "grayscale contrast-150 brightness-90" },
    { id: "vintage", name: "🎞️ Vintage Vacation", cssClass: "contrast-115 brightness-105 sepia-[0.35]" },
  ];

  // Stop camera feed when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCamError("");
    setIsCamActive(true);
    setImgSrc(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCamError("Camera permission blocked, darling! Try uploading a photo instead.");
      setIsCamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCamActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Mirror the webcam image for natural selfie feel
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Reset scale/translate
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const dataUrl = canvas.toDataURL("image/jpeg");
        setImgSrc(dataUrl);
        stopCamera();
        onSetJudyQuote("Fabulous shot, sweetheart! Let's apply some disaster magic.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result as string);
        stopCamera();
        onSetJudyQuote("Photo uploaded! I'm ready to review your life choices, honey.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Click-to-place sticker helper
  const addSticker = (stickerId: string) => {
    if (!imgSrc) return;
    const stickerDef = FUNNY_STICKERS.find((s) => s.id === stickerId);
    if (!stickerDef) return;

    const newSticker: PlacedSticker = {
      id: `sticker-${Date.now()}`,
      stickerId,
      text: stickerDef.text,
      color: stickerDef.color,
      x: 35 + Math.random() * 20, // offset randomly in center area
      y: 35 + Math.random() * 20,
      scale: 1.0,
    };

    setPlacedStickers([...placedStickers, newSticker]);
    setSelectedStickerIdx(placedStickers.length);
    onSetJudyQuote(`Ooh, added the '${stickerDef.label}' sticker! Place it exactly where the crisis is.`);
  };

  const removeSticker = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = placedStickers.filter((_, i) => i !== idx);
    setPlacedStickers(updated);
    setSelectedStickerIdx(null);
  };

  const updateStickerScale = (factor: number) => {
    if (selectedStickerIdx === null) return;
    const updated = [...placedStickers];
    updated[selectedStickerIdx].scale = Math.min(Math.max(updated[selectedStickerIdx].scale + factor, 0.5), 2.5);
    setPlacedStickers(updated);
  };

  const updateStickerPosition = (axis: "x" | "y", change: number) => {
    if (selectedStickerIdx === null) return;
    const updated = [...placedStickers];
    if (axis === "x") {
      updated[selectedStickerIdx].x = Math.min(Math.max(updated[selectedStickerIdx].x + change, 5), 90);
    } else {
      updated[selectedStickerIdx].y = Math.min(Math.max(updated[selectedStickerIdx].y + change, 5), 90);
    }
    setPlacedStickers(updated);
  };

  // AI analysis via Gemini
  const handleAiEnhance = async () => {
    if (!imgSrc) return;
    setIsEnhancing(true);
    setAiResult(null);
    onSetJudyQuote("Analyzing the composition of your travel tragedy, darling... Hold your breath!");

    try {
      const response = await fetch("/api/enhance-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: imgSrc,
          mishapDescription: customCaption || "Hilarious vacation mishap",
        }),
      });

      const data = await response.json();
      setAiResult(data);
      onSetJudyQuote(`Behold: "${data.cinematicTitle}"! A pure work of dramatic art, honey.`);
    } catch (err) {
      console.error(err);
      onSetJudyQuote("My AI fashion critique broke. But trust me, you still look incredible.");
    } finally {
      setIsEnhancing(false);
    }
  };

  // Compile final polaroid canvas and download
  const handleDownload = () => {
    if (!imgSrc) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set canvas size for high-fidelity polaroid card output
      const polaroidPadding = 40;
      const textSpace = 120;
      canvas.width = img.width + polaroidPadding * 2;
      canvas.height = img.height + polaroidPadding * 2 + textSpace;

      if (ctx) {
        // Draw elegant floral lavender background card
        ctx.fillStyle = "#F3E5F5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Polaroid White frame shadow
        ctx.fillStyle = "white";
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 15;
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
        ctx.shadowColor = "transparent"; // Reset shadow

        // Apply CSS filters on the image before drawing on canvas
        // (Simulate selected filter via Canvas Filter API if supported)
        if (activeFilter === "cinematic") {
          ctx.filter = "sepia(0.8) contrast(1.2) saturate(1.3)";
        } else if (activeFilter === "lavender") {
          ctx.filter = "hue-rotate(290deg) saturate(1.4)";
        } else if (activeFilter === "drama") {
          ctx.filter = "grayscale(1) contrast(1.4)";
        } else if (activeFilter === "vintage") {
          ctx.filter = "sepia(0.3) contrast(1.1) brightness(1.05)";
        }

        // Draw image
        ctx.drawImage(img, polaroidPadding, polaroidPadding, img.width, img.height);
        ctx.filter = "none"; // reset

        // Draw cinematic letterboxes if cinematic filter
        if (activeFilter === "cinematic") {
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(polaroidPadding, polaroidPadding, img.width, img.height * 0.12);
          ctx.fillRect(polaroidPadding, polaroidPadding + img.height * 0.88, img.width, img.height * 0.12);
        }

        // Draw custom caption text
        ctx.fillStyle = "#311B92";
        ctx.textAlign = "center";
        
        const titleText = aiResult?.cinematicTitle || "A Beautiful Vacation Disaster";
        ctx.font = "bold 26px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText(titleText, canvas.width / 2, canvas.height - textSpace + 30);

        if (customCaption) {
          ctx.font = "italic 18px 'Helvetica Neue', Arial, sans-serif";
          ctx.fillStyle = "#4A148C";
          ctx.fillText(`"${customCaption}"`, canvas.width / 2, canvas.height - textSpace + 65);
        }

        ctx.font = "bold 14px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillStyle = "#EC407A";
        ctx.fillText("🦏 JUDY THE LAVENDER RHINO APPROVED", canvas.width / 2, canvas.height - 30);

        // Draw placed stickers
        placedStickers.forEach((st) => {
          ctx.save();
          const targetX = polaroidPadding + (st.x / 100) * img.width;
          const targetY = polaroidPadding + (st.y / 100) * img.height;
          
          ctx.translate(targetX, targetY);
          ctx.scale(st.scale, st.scale);

          // Render sticker label badge shape
          ctx.fillStyle = st.color === "bg-red-500" ? "#EF5350" : st.color === "bg-pink-500" ? "#EC407A" : "#8C9EFF";
          ctx.beginPath();
          ctx.roundRect(-80, -20, 160, 40, 10);
          ctx.fill();

          ctx.fillStyle = "white";
          ctx.font = "bold 13px 'Helvetica Neue', Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(st.text, 0, 0);

          ctx.restore();
        });

        // Trigger download
        const link = document.createElement("a");
        link.download = `judy_disaster_${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        onSetJudyQuote("Downloaded! Post it on your socials instantly, gorgeous!");
      }
    };
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
  };

  const copyJudyReview = () => {
    if (!aiResult) return;
    const reviewText = `🎬 "${aiResult.cinematicTitle}"\n\n🦏 Judy's Critique: "${aiResult.judysCritique}"\n\n🆘 Rescue Plan:\n${aiResult.rescuePlan.join("\n")}`;
    navigator.clipboard.writeText(reviewText);
    onSetJudyQuote("Judy's review copied! Time to make your followers laugh, honey.");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Camera className="w-5 h-5 text-pink-500" />
          Mishap Filter & AI Studio
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Document your beautiful travel mishaps in style! Mirror your camera feed, add funny stickers, or ask Judy to "AI-Enhance" your disaster into a theatrical masterpiece.
        </p>

        {/* Action Buttons */}
        {!imgSrc && !isCamActive && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startCamera}
              className="flex flex-col items-center justify-center p-6 bg-pink-50 hover:bg-pink-100/70 border-2 border-dashed border-pink-200 hover:border-pink-300 rounded-2xl transition-all gap-2 text-pink-700 cursor-pointer"
            >
              <Camera className="w-8 h-8" />
              <span className="text-xs font-bold uppercase tracking-wider">Use Camera</span>
            </button>

            <label className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100/70 border-2 border-dashed border-purple-200 hover:border-purple-300 rounded-2xl transition-all gap-2 text-purple-700 cursor-pointer">
              <Upload className="w-8 h-8" />
              <span className="text-xs font-bold uppercase tracking-wider">Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Cam Stream View */}
      {isCamActive && (
        <div className="bg-black rounded-3xl overflow-hidden relative shadow-lg border-2 border-pink-200 aspect-video flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={capturePhoto}
              className="bg-pink-500 hover:bg-pink-600 text-white font-bold p-4 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Capture Photo"
            >
              <Camera className="w-6 h-6" />
            </button>
            <button
              onClick={stopCamera}
              className="bg-gray-800/80 hover:bg-gray-900/80 text-white font-semibold py-2.5 px-4 rounded-xl text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {camError && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs font-semibold text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {camError}
        </div>
      )}

      {/* Main Studio Editor */}
      {imgSrc && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Polaroid Preview Stage */}
          <div className="bg-white rounded-3xl p-5 border-2 border-pink-100 shadow-xl space-y-4">
            <div className="relative overflow-hidden rounded-2xl border-2 border-pink-100 shadow-sm bg-purple-50">
              {/* Polaroid Photo Wrapper */}
              <div className="relative">
                <img
                  src={imgSrc}
                  alt="Mishap Preview"
                  className={`w-full h-auto object-cover rounded-xl transition-all duration-300 ${
                    FILTERS.find((f) => f.id === activeFilter)?.cssClass || ""
                  }`}
                />
                
                {/* Cinematic Letterbox overlay option */}
                {activeFilter === "cinematic" && (
                  <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none">
                    <div className="h-[12%] bg-black/90" />
                    <div className="h-[12%] bg-black/90" />
                  </div>
                )}

                {/* Live rendered placement of stickers */}
                {placedStickers.map((st, idx) => (
                  <motion.div
                    key={st.id}
                    onClick={() => setSelectedStickerIdx(idx)}
                    style={{ left: `${st.x}%`, top: `${st.y}%`, scale: st.scale }}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 shadow-lg px-3 py-1.5 rounded-lg text-white font-extrabold text-[11px] tracking-wider uppercase cursor-move select-none flex items-center gap-1.5 border border-white/20 whitespace-nowrap ${st.color} ${
                      selectedStickerIdx === idx ? "ring-2 ring-yellow-400 scale-[1.1]" : ""
                    }`}
                  >
                    {st.text}
                    {selectedStickerIdx === idx && (
                      <button
                        onClick={(e) => removeSticker(idx, e)}
                        className="bg-black/40 hover:bg-black/60 rounded-full p-0.5 cursor-pointer"
                        title="Remove Sticker"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Title Card under photo inside Polaroid */}
              <div className="p-4 bg-pink-50/50 border-t border-pink-50 text-center space-y-1.5">
                <h4 className="font-black text-purple-950 text-sm">
                  {aiResult?.cinematicTitle || "📸 A Beautiful Travel Misfortune"}
                </h4>
                {customCaption && (
                  <p className="text-xs text-purple-800 italic">"{customCaption}"</p>
                )}
              </div>
            </div>

            {/* Sticker controls (only if a sticker is selected) */}
            {selectedStickerIdx !== null && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-yellow-800 uppercase tracking-wide">Sticker Controls</span>
                  <button onClick={() => setSelectedStickerIdx(null)} className="text-yellow-600 font-bold hover:underline">
                    Deselect
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => updateStickerScale(0.1)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    🔍 Bigger
                  </button>
                  <button
                    onClick={() => updateStickerScale(-0.1)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    🔍 Smaller
                  </button>
                  <button
                    onClick={() => updateStickerPosition("x", -5)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    ⬅️ Left
                  </button>
                  <button
                    onClick={() => updateStickerPosition("x", 5)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    ➡️ Right
                  </button>
                  <button
                    onClick={() => updateStickerPosition("y", -5)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    ⬆️ Up
                  </button>
                  <button
                    onClick={() => updateStickerPosition("y", 5)}
                    className="bg-white hover:bg-yellow-100 text-yellow-800 border border-yellow-200 px-2.5 py-1.5 rounded-xl font-bold cursor-pointer"
                  >
                    ⬇️ Down
                  </button>
                </div>
              </div>
            )}

            {/* Captions & Filter selection Controls */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">What happened? (Add Vibe Caption)</label>
                <input
                  type="text"
                  value={customCaption}
                  onChange={(e) => setCustomCaption(e.target.value)}
                  placeholder="e.g. 'Dropping my gelato into a canal' or 'Lost in a Parisian alleyway'"
                  className="w-full text-xs font-semibold text-gray-800 bg-pink-50/20 hover:bg-pink-50/40 border-2 border-pink-100 focus:border-pink-300 rounded-xl px-4 py-2.5 focus:outline-none"
                />
              </div>

              {/* Filters Carousel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Cinematic Filter</label>
                <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border-2 shrink-0 transition-all cursor-pointer ${
                        activeFilter === f.id
                          ? "bg-pink-500 text-white border-pink-500"
                          : "bg-white text-gray-700 border-pink-50 hover:bg-pink-50/30"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stickers Carousel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Apply Funny Stickers</label>
                <div className="flex gap-2 overflow-x-auto pb-1.5 max-w-full">
                  {FUNNY_STICKERS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addSticker(s.id)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl text-white shadow-sm shrink-0 transition-transform active:scale-95 cursor-pointer ${s.color}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Studio Action Triggers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-pink-50">
              <button
                onClick={handleAiEnhance}
                disabled={isEnhancing || isOffline}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isEnhancing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Judy is analyzing drama...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ask Judy to AI-Enhance
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Postcard
              </button>

              <button
                onClick={() => {
                  setImgSrc(null);
                  setAiResult(null);
                  setPlacedStickers([]);
                  setSelectedStickerIdx(null);
                  setCustomCaption("");
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Reset Studio
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          <AnimatePresence>
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-gradient-to-br from-indigo-950 to-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4"
              >
                <div className="absolute top-0 right-0 text-9xl opacity-[0.05] select-none pointer-events-none transform translate-x-12 translate-y-12">🦏</div>

                <div className="flex items-center justify-between border-b border-indigo-800/40 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">🏆</span>
                    <div>
                      <h4 className="text-[10px] text-pink-400 font-black tracking-widest uppercase">JUDY'S CINEMATIC VERDICT</h4>
                      <h3 className="font-bold text-white text-base">"{aiResult.cinematicTitle}"</h3>
                    </div>
                  </div>
                  <button
                    onClick={copyJudyReview}
                    className="p-2 bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-200 hover:text-white rounded-xl transition-colors cursor-pointer"
                    title="Copy AI Verdict"
                  >
                    <Clipboard className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h5 className="text-[10px] text-pink-300 font-black tracking-wider uppercase">Judy's Sassy Critique</h5>
                    <p className="text-xs text-indigo-100 leading-relaxed italic">"{aiResult.judysCritique}"</p>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[10px] text-pink-300 font-black tracking-wider uppercase">Emergency Rescue Plan</h5>
                    <div className="space-y-2 text-xs">
                      {aiResult.rescuePlan.map((step, idx) => (
                        <div key={idx} className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/30">
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Hidden static canvas used for rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
