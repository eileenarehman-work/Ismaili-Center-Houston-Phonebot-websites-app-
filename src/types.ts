export type NavigationTab = 'assistant' | 'hotline' | 'schedule' | 'visitor' | 'videos';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'gemini-server' | 'gemini-client' | 'knowledge-engine' | 'offline' | 'offline-fallback';
  suggestedFollowUps?: string[];
}

export interface VideoItem {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  description: string;
  thumbnailUrl: string;
}

export interface PrayerSessionInfo {
  name: string;
  timeRange: string;
  description: string;
  iconName: 'sun' | 'moon' | 'pray';
  days?: string;
}

// AI Phonebot Core Components & Task Execution Types
export interface CallerMessage {
  id: string;
  callerName: string;
  callerPhone: string;
  department: string;
  messageText: string;
  urgency: 'routine' | 'urgent';
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface TourReservation {
  id: string;
  confirmationCode: string;
  visitorName: string;
  partySize: number;
  tourDate: string;
  timeSlot: string;
  contactEmailOrPhone: string;
  createdAt: string;
  status: 'confirmed' | 'checked-in' | 'cancelled';
}

export interface PhonebotCallMetrics {
  totalCalls: number;
  inquiriesResolved: number;
  toursBooked: number;
  messagesRecorded: number;
  handoffsEscalated: number;
  minutesSaved: number;
}

export interface TelephonyPipelineTelemetry {
  sttEngine: string;
  sttLatencyMs: number;
  llmEngine: string;
  llmLatencyMs: number;
  ttsEngine: string;
  ttsLatencyMs: number;
  telephonyCodec: string;
  roundtripLatencyMs: number;
  currentIntent: string;
}

// Display & Accessibility Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high' | 'yellow-black';
export type CursorSize = 'normal' | 'large' | 'extra-large';

export interface AccessibilitySettings {
  theme: ThemeMode;
  contrast: ContrastMode;
  cursorSize: CursorSize;
  zoomLevel: number; // e.g. 90, 100, 110, 125, 150
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  highlightLinks: boolean;
  enhancedFocus: boolean;
  readingGuide: boolean;
  textToSpeech: boolean;
}
