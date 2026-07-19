import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Globe, Wifi, WifiOff, RefreshCw, Star, Sparkles, BookOpen, Search } from "lucide-react";
import { OFFLINE_DICTIONARY, SUPPORTED_LANGUAGES } from "../data/offlineDictionary";
import { TranslationJob, TranslationResult } from "../types";

interface InterpreterProps {
  isOffline: boolean;
  onTalkingChange: (talking: boolean) => void;
  onSetJudyQuote: (quote: string) => void;
}

async function waitForTranslation(
  initialJob: TranslationJob,
  onStatus: (status: TranslationJob["status"]) => void,
): Promise<TranslationJob> {
  let job = initialJob;
  const deadline = Date.now() + 180_000;
  while (!["completed", "failed"].includes(job.status)) {
    if (Date.now() >= deadline) throw new Error("Hermes is still working; check the completion log shortly.");
    onStatus(job.status);
    await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    const response = await fetch(`/api/translation-requests/${encodeURIComponent(job.id)}`);
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Could not read translation status");
    job = body.job as TranslationJob;
  }
  onStatus(job.status);
  if (job.status === "failed") throw new Error(job.error || "Hermes translation failed");
  return job;
}

function formatJobStatus(status: TranslationJob["status"] | null): string {
  if (status === "queued") return "Queued";
  if (status === "submitted") return "Sent to Hermes";
  if (status === "processing") return "Translating";
  return "Starting";
}

export const Interpreter: React.FC<InterpreterProps> = ({
  isOffline,
  onTalkingChange,
  onSetJudyQuote,
}) => {
  const [inputText, setInputText] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [jobStatus, setJobStatus] = useState<TranslationJob["status"] | null>(null);
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState("");
  const recognitionRef = useRef<any>(null);

  // Browse offline categories
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setRecognitionError("");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech Recognition Error", event);
        setRecognitionError("Mic took a nap. Try typing or tap again!");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setRecognitionError("Speech recognition not supported in this browser. Try Chrome, darling!");
      return;
    }
    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTranslate = async (textToTranslate = inputText) => {
    const text = textToTranslate.trim();
    if (!text) return;

    setIsTranslating(true);

    if (isOffline) {
      // 1. Offline Mode lookup
      setTimeout(() => {
        const offlinePhrases = OFFLINE_DICTIONARY[targetLang] || [];
        // Try to find a match or closest phrase
        const match = offlinePhrases.find(
          (p) =>
            p.english.toLowerCase().includes(text.toLowerCase()) ||
            text.toLowerCase().includes(p.english.toLowerCase())
        );

        if (match) {
          const res: TranslationResult = {
            originalText: match.english,
            translatedText: match.translated,
            culturalInsight: `[OFFLINE CACHE] ${match.insight}\n\n💡 Pronunciation: "${match.pronunciation}"`,
            languageCode: targetLang,
            timestamp: Date.now(),
          };
          setResult(res);
          onSetJudyQuote(`"${match.translated}" - That's how you say it, sweetie!`);
        } else {
          // No precise match - create a funny generic offline response
          const genericRes: TranslationResult = {
            originalText: text,
            translatedText: `[Offline Translation Mode]`,
            culturalInsight: `Darling, we are offline and my remote memory doesn't have a direct translation for this yet! Try browsing our loaded offline dictionary below or tap one of our pre-saved phrases. They are guaranteed to save you from social ruin!`,
            languageCode: targetLang,
            timestamp: Date.now(),
          };
          setResult(genericRes);
          onSetJudyQuote("No signal, honey! But you still look fabulous.");
        }
        setIsTranslating(false);
      }, 600);
    } else {
      // 2. Queue the request, then follow the Hermes job through completion.
      try {
        setJobStatus("queued");
        const response = await fetch("/api/translation-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, targetLanguage: targetLang, source: "judy-web" }),
        });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || "Translation request failed");

        const completedJob = await waitForTranslation(data.job as TranslationJob, setJobStatus);
        if (!completedJob.result) throw new Error("Hermes completed without a result");
        setResult(completedJob.result);
        onSetJudyQuote(`"${completedJob.result.translatedText}" — ready, darling!`);
      } catch (err: any) {
        console.error(err);
        setJobStatus("failed");
        setResult({
          originalText: text,
          translatedText: "Translation unavailable",
          culturalInsight: err.message || "Hermes could not complete this request. Try again in a moment.",
          languageCode: targetLang,
          timestamp: Date.now(),
        });
      } finally {
        setIsTranslating(false);
      }
    }
  };

  // Speaks using the browser's speechSynthesis API
  const speakTranslation = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      onTalkingChange(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Match voice language if possible
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Female"));
      
      // Attempt target language pronunciation for translated phrase
      if (text === result?.translatedText) {
        const langCodeMap: Record<string, string> = {
          Spanish: "es-ES",
          French: "fr-FR",
          Japanese: "ja-JP",
          Italian: "it-IT",
          German: "de-DE",
          Portuguese: "pt-PT",
          Thai: "th-TH",
          Greek: "el-GR"
        };
        const targetCode = langCodeMap[targetLang];
        if (targetCode) {
          const nativeVoice = voices.find(v => v.lang.startsWith(targetCode));
          if (nativeVoice) selectedVoice = nativeVoice;
          utterance.lang = targetCode;
        }
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.pitch = 1.15;
      utterance.rate = 0.95;
      
      utterance.onend = () => {
        onTalkingChange(false);
      };

      utterance.onerror = () => {
        onTalkingChange(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert("TTS not supported in your browser, sweetie!");
    }
  };

  // Get browsable offline phrases for the current language
  const currentLanguagePhrases = OFFLINE_DICTIONARY[targetLang] || [];
  const categories = ["All", ...Array.from(new Set(currentLanguagePhrases.map(p => p.category)))];

  const filteredOfflinePhrases = currentLanguagePhrases.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.english.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.translated.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Target Language Selection Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-pink-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-pink-100 text-pink-600 p-2 rounded-xl">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Target Language</h3>
            <p className="text-xs text-gray-500">Judy knows {SUPPORTED_LANGUAGES.length} romantic tongues!</p>
          </div>
        </div>

        <select
          value={targetLang}
          onChange={(e) => {
            setTargetLang(e.target.value);
            setResult(null);
            setSelectedCategory("All");
          }}
          className="bg-pink-50 hover:bg-pink-100 text-pink-700 text-sm font-bold py-2 px-4 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-3xl p-5 border-2 border-pink-100 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">What do you want to say?</span>
          <div className="flex items-center gap-2">
            {isOffline ? (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                <WifiOff className="w-3.5 h-3.5" /> Offline Mode
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1 border text-xs font-bold px-2.5 py-0.5 rounded-full ${
                jobStatus === "failed"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isTranslating
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}>
                {isTranslating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                {isTranslating ? formatJobStatus(jobStatus) : jobStatus === "failed" ? "Needs retry" : "Hermes ready"}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or tap the mic to speak, darling... (e.g. 'Where can I find more wine?')"
            rows={3}
            className="w-full text-gray-800 placeholder-gray-400 font-medium text-base bg-pink-50/30 hover:bg-pink-50/50 focus:bg-white border-2 border-pink-100 focus:border-pink-300 rounded-2xl p-4 focus:outline-none transition-all resize-none"
          />
          
          {/* Hands-free Speech Button */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            {recognitionError && (
              <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                {recognitionError}
              </span>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={startListening}
              className={`p-3 rounded-full shadow-md cursor-pointer transition-colors ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gradient-to-tr from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500"
              }`}
              title="Hands-free Voice Input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleTranslate()}
            disabled={isTranslating || !inputText.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isTranslating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Judy is gossiping...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Translate like a Diva
              </>
            )}
          </button>

          {inputText && (
            <button
              onClick={() => setInputText("")}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold p-3.5 rounded-2xl active:scale-[0.98] transition-all cursor-pointer"
              title="Clear text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Translation Result Card */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-white rounded-3xl p-6 border-2 border-pink-150 shadow-xl overflow-hidden relative"
          >
            {/* Elegant Floral background asset */}
            <div className="absolute top-0 right-0 text-7xl opacity-[0.06] select-none pointer-events-none transform translate-x-4 -translate-y-4">🌺</div>
            
            <div className="space-y-5">
              {/* Output Label */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-pink-500 uppercase flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-pink-500" /> Judy's Translation
                </span>
                <span className="text-xs font-bold text-gray-400">Target: {targetLang}</span>
              </div>

              {/* Translation with playback */}
              <div className="bg-pink-50/40 rounded-2xl p-4 border border-pink-100/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-wide">Pronounce this, darling:</p>
                  <p className="text-xl font-bold text-purple-950 leading-relaxed">{result.translatedText}</p>
                </div>
                <button
                  onClick={() => speakTranslation(result.translatedText)}
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-3 rounded-xl shadow-sm transition-all cursor-pointer"
                  title="Speak Translation"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Cultural Insight Card */}
              <div className="bg-gradient-to-br from-indigo-950 to-purple-900 text-white rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 text-8xl opacity-10">🦏</div>
                <div className="flex items-center gap-2">
                  <span className="bg-pink-500 text-white p-1.5 rounded-lg text-xs font-extrabold tracking-wider uppercase">Judy's Sassy Tip</span>
                </div>
                <p className="text-sm text-pink-100 font-medium leading-relaxed whitespace-pre-line">{result.culturalInsight}</p>
                
                <button
                  onClick={() => speakTranslation(result.culturalInsight.replace("[OFFLINE CACHE]", "").split("💡")[0])}
                  className="mt-2 text-xs font-bold text-pink-300 hover:text-pink-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Listen to Judy's gossip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browsable Offline Travel Cheat-sheet */}
      <div className="bg-white rounded-3xl p-5 border border-pink-100 shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-pink-50 pb-3">
          <BookOpen className="w-5 h-5 text-pink-500" />
          <h3 className="font-bold text-gray-800 text-base">Judy's Hand-Picked Offline Phrasebook</h3>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Stuck without signal on a remote beach? Browse my curated list of emergency phrases for <span className="font-semibold text-pink-600">{targetLang}</span> to stay out of trouble!
        </p>

        {currentLanguagePhrases.length > 0 ? (
          <div className="space-y-4">
            {/* Search and Categories bar */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search offline phrases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-pink-50/50 border border-pink-100 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:border-pink-300 text-gray-800"
                />
                <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>

              {/* Categorization chips */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-pink-500 text-white border-pink-500 shadow-sm"
                        : "bg-white text-pink-600 border-pink-100 hover:bg-pink-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Phrase List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {filteredOfflinePhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInputText(phrase.english);
                    handleTranslate(phrase.english);
                  }}
                  className="bg-pink-50/30 hover:bg-pink-50/60 border border-pink-100/50 p-3.5 rounded-xl cursor-pointer transition-all space-y-1.5 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="bg-pink-100 text-pink-700 text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-md">
                      {phrase.category}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">Tap to play 🌟</span>
                  </div>
                  <p className="text-xs font-bold text-gray-700">"{phrase.english}"</p>
                  <p className="text-sm font-extrabold text-purple-900">👉 {phrase.translated}</p>
                </div>
              ))}

              {filteredOfflinePhrases.length === 0 && (
                <p className="text-center text-xs text-gray-400 py-4 font-medium">
                  No emergency phrases found. Try searching something else, my sweet!
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-pink-50/20 rounded-2xl border border-pink-50">
            <p className="text-xs text-gray-400 font-bold">No custom offline dictionary found for {targetLang}.</p>
            <p className="text-[11px] text-gray-400 mt-1">Judy is drafting Spanish, French, Italian, and Japanese offline phrases. Give those a spin, gorgeous!</p>
          </div>
        )}
      </div>
    </div>
  );
};
