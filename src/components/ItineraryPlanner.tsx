import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Compass, Clipboard, Trash2, Heart, Sparkles, Smile, Landmark, Save, AlertCircle } from "lucide-react";
import { TRAVEL_STYLES } from "../data/offlineDictionary";
import { Itinerary } from "../types";

interface ItineraryPlannerProps {
  onSetJudyQuote: (quote: string) => void;
}

const LOADING_MESSAGES = [
  "Dusting off my leopard print suitcases...",
  "Consulting the oracle of mimosas...",
  "Drafting dramatic coffee shops to hide in...",
  "Mapping out locations where lighting is 10/10...",
  "Calculating the optimal gossip-to-sightseeing ratio...",
  "Refusing to add hiking trails to the plans...",
];

export const ItineraryPlanner: React.FC<ItineraryPlannerProps> = ({ onSetJudyQuote }) => {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [travelStyle, setTravelStyle] = useState("glamour");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "saved">("create");

  // Load saved itineraries
  useEffect(() => {
    const loaded = localStorage.getItem("judy_saved_itineraries");
    if (loaded) {
      try {
        setSavedItineraries(JSON.parse(loaded));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Loading message rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!destination.trim()) return;

    setIsGenerating(true);
    setLoadingMsgIdx(0);
    onSetJudyQuote("Hold on, gorgeous! Designing the ultimate dramatic getaway for you...");

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          travelStyle: TRAVEL_STYLES.find((s) => s.id === travelStyle)?.name || travelStyle,
        }),
      });

      const data = await response.json();
      setCurrentItinerary(data);
      onSetJudyQuote(`Ooh la la! Your custom itinerary for ${destination} is ready, darling!`);
    } catch (e) {
      console.error(e);
      onSetJudyQuote("Oops, planning got too exhausting. Order a prosecco while I recalibrate!");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveItinerary = () => {
    if (!currentItinerary) return;

    // Check if already saved
    if (savedItineraries.some((i) => i.id === currentItinerary.id)) {
      onSetJudyQuote("You already saved this trip, gorgeous! It's secure offline!");
      return;
    }

    const updated = [currentItinerary, ...savedItineraries];
    setSavedItineraries(updated);
    localStorage.setItem("judy_saved_itineraries", JSON.stringify(updated));
    onSetJudyQuote("Trip secured! You can access this offline in any jungle or remote beach, my sweet.");
  };

  const deleteItinerary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedItineraries.filter((i) => i.id !== id);
    setSavedItineraries(updated);
    localStorage.setItem("judy_saved_itineraries", JSON.stringify(updated));
    
    if (currentItinerary?.id === id) {
      setCurrentItinerary(null);
    }
    onSetJudyQuote("Itinerary deleted! Moving on to fresher gossip.");
  };

  const copyToClipboard = () => {
    if (!currentItinerary) return;

    let text = `✨ ${currentItinerary.title} ✨\n`;
    text += `Destination: ${currentItinerary.destination}\n`;
    text += `Style: ${currentItinerary.travelStyle}\n\n`;
    text += `${currentItinerary.overview}\n\n`;

    currentItinerary.daysList.forEach((day) => {
      text += `📅 DAY ${day.day}: ${day.title}\n`;
      text += `☀️ Morning: ${day.morning}\n`;
      text += `🌤️ Afternoon: ${day.afternoon}\n`;
      text += `🌙 Evening: ${day.evening}\n`;
      text += `🦏 Judy's Diva Tip: ${day.judysTip}\n\n`;
    });

    text += "Created with 💖 by Judy the Lavender Rhino interpreter companion.";

    navigator.clipboard.writeText(text);
    onSetJudyQuote("Itinerary copied! Send it to your group chat and start packing those sunglasses.");
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex bg-pink-100/50 p-1 rounded-2xl border border-pink-100">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer ${
            activeTab === "create"
              ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
              : "text-purple-950 hover:text-pink-600"
          }`}
        >
          ✨ Plan New Escape
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === "saved"
              ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
              : "text-purple-950 hover:text-pink-600"
          }`}
        >
          💾 Offline Trips ({savedItineraries.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "create" ? (
          <motion.div
            key="create-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Input Configurator */}
            <div className="bg-white rounded-3xl p-6 border-2 border-pink-100 shadow-md space-y-5">
              <div className="flex items-center gap-2 border-b border-pink-50 pb-3">
                <Compass className="w-5 h-5 text-pink-500 animate-spin-slow" />
                <h3 className="font-bold text-gray-800 text-base">Design Your Custom Escape</h3>
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Mykonos, Tokyo, Amalfi Coast, Paris..."
                  className="w-full text-gray-800 placeholder-gray-400 font-bold bg-pink-50/20 hover:bg-pink-50/40 focus:bg-white border-2 border-pink-100 focus:border-pink-300 rounded-2xl px-4 py-3 focus:outline-none transition-all"
                />
              </div>

              {/* Days Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 tracking-wider uppercase">Trip Length</label>
                  <span className="bg-pink-100 text-pink-700 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {days} Days of Glamour
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full accent-pink-500 h-2 bg-pink-100 rounded-lg cursor-pointer"
                />
              </div>

              {/* Travel Style Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 tracking-wider uppercase block">Your Vibe / Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {TRAVEL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setTravelStyle(style.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                        travelStyle === style.id
                          ? "bg-gradient-to-tr from-pink-50 to-purple-50/50 border-pink-400 shadow-sm"
                          : "bg-white hover:bg-pink-50/20 border-pink-100"
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.icon}</div>
                      <h4 className="text-xs font-bold text-purple-950">{style.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{style.description}</p>
                      
                      {travelStyle === style.id && (
                        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-pink-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !destination.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:shadow-pink-100 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Judy is drafting...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Draft My Humorous Itinerary
                  </>
                )}
              </button>
            </div>

            {/* Loading Overlay */}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 border-2 border-pink-100 text-center space-y-4 shadow-xl"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-pink-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-pink-500 border-l-purple-500 animate-spin" />
                  <span className="absolute inset-0 flex items-center justify-center text-3xl">🦏</span>
                </div>
                <h3 className="font-black text-indigo-950 text-base">Sipping espresso and planning...</h3>
                <p className="text-sm font-semibold text-pink-500 animate-pulse">
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </p>
              </motion.div>
            )}

            {/* Generated Itinerary Output */}
            {currentItinerary && !isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border-2 border-pink-150 shadow-xl overflow-hidden"
              >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6 relative">
                  <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 select-none pointer-events-none">✨</div>
                  <h3 className="text-xl font-black leading-tight mb-2">{currentItinerary.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      📍 {currentItinerary.destination}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      👑 {currentItinerary.travelStyle}
                    </span>
                  </div>
                  <p className="text-xs text-pink-50 font-medium leading-relaxed bg-black/10 rounded-xl p-3">
                    💬 "{currentItinerary.overview}"
                  </p>
                </div>

                {/* Day List */}
                <div className="p-6 space-y-6">
                  {currentItinerary.daysList.map((day) => (
                    <div key={day.day} className="border-b border-pink-50 last:border-0 pb-6 last:pb-0 space-y-3.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-pink-500 text-white font-extrabold w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm">
                          {day.day}
                        </span>
                        <h4 className="font-bold text-indigo-950 text-sm">{day.title}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs text-gray-700 pl-9">
                        <div className="bg-pink-50/30 p-2.5 rounded-xl border border-pink-100/30">
                          <span className="font-extrabold text-pink-600 block mb-0.5">☀️ MORNING</span>
                          {day.morning}
                        </div>
                        <div className="bg-pink-50/30 p-2.5 rounded-xl border border-pink-100/30">
                          <span className="font-extrabold text-pink-600 block mb-0.5">🌤️ AFTERNOON</span>
                          {day.afternoon}
                        </div>
                        <div className="bg-pink-50/30 p-2.5 rounded-xl border border-pink-100/30">
                          <span className="font-extrabold text-pink-600 block mb-0.5">🌙 EVENING</span>
                          {day.evening}
                        </div>
                      </div>

                      {/* Day Tip */}
                      <div className="bg-purple-50 text-purple-950 rounded-2xl p-4 pl-12 relative text-xs font-semibold leading-relaxed ml-9 shadow-sm">
                        <span className="absolute left-4 top-4 text-lg">🦏</span>
                        <p className="text-purple-900 italic">"{day.judysTip}"</p>
                      </div>
                    </div>
                  ))}

                  {/* Action Bar */}
                  <div className="flex gap-3 pt-4 border-t border-pink-50">
                    <button
                      onClick={saveItinerary}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Offline
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Clipboard className="w-4 h-4" /> Share Trip
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* Saved Itineraries Tab */
          <motion.div
            key="saved-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {savedItineraries.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-1">
                  Saved Trips (Fully accessible offline in flight mode!)
                </p>

                {savedItineraries.map((itinerary) => (
                  <div
                    key={itinerary.id}
                    onClick={() => {
                      setCurrentItinerary(itinerary);
                      setActiveTab("create");
                      onSetJudyQuote(`Loading up your saved escape to ${itinerary.destination}, sweetie!`);
                    }}
                    className="bg-white hover:bg-pink-50/20 border-2 border-pink-100 hover:border-pink-300 rounded-3xl p-5 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📍</span>
                        <h4 className="font-extrabold text-indigo-950 text-sm truncate">{itinerary.destination}</h4>
                        <span className="bg-pink-100 text-pink-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {itinerary.days} Days
                        </span>
                      </div>
                      <p className="text-xs text-purple-900 font-bold truncate italic">"{itinerary.title}"</p>
                      <p className="text-[10px] text-gray-400 font-medium">Saved: {new Date(itinerary.timestamp).toLocaleDateString()}</p>
                    </div>

                    <button
                      onClick={(e) => deleteItinerary(itinerary.id, e)}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                      title="Delete Saved Trip"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-10 bg-white rounded-3xl border-2 border-pink-100 space-y-4">
                <div className="text-4xl">👜</div>
                <h4 className="font-bold text-gray-800 text-sm">No saved escapes yet!</h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Plan a new trip and tap "Save Offline" to keep it stored safe and sound for remote destinations, gorgeous!
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Create One Now
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
