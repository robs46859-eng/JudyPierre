export interface TranslationResult {
  originalText: string;
  translatedText: string;
  culturalInsight: string;
  languageCode: string;
  timestamp: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  judysTip: string;
}

export interface Itinerary {
  id: string;
  destination: string;
  days: number;
  travelStyle: string;
  title: string;
  overview: string;
  daysList: ItineraryDay[];
  timestamp: number;
}

export interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface CameraFilter {
  id: string;
  name: string;
  cssClass: string;
  description: string;
  overlayText?: string;
}

export interface OfflinePhrase {
  category: string;
  english: string;
  translated: string;
  pronunciation: string;
  insight: string;
}
