export type NavigationTab = 'assistant' | 'hotline' | 'schedule' | 'visitor' | 'videos' | 'admin';

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

// Center Public Experiences & Exhibition Types
export interface CenterExperience {
  id: string;
  title: string;
  category: 'tour' | 'garden' | 'exhibition' | 'architecture' | 'cultural' | 'spiritual';
  shortDescription: string;
  fullDescription: string;
  schedule: string;
  duration: string;
  admission: string;
  officialBookingUrl: string;
  badge?: string;
  highlights: string[];
  isActive: boolean;
  updatedAt: string;
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

// Lifespan User History Types
export type LifespanEventType = 'voice_call' | 'ai_chat' | 'tour_booking' | 'caller_message' | 'setting_change' | 'navigation' | 'admin_action';

export interface LifespanEvent {
  id: string;
  timestamp: string;
  isoDate: string;
  type: LifespanEventType;
  title: string;
  summary: string;
  userIdentifier?: string;
  status?: string;
  duration?: string;
  details?: Record<string, any>;
}

export interface AdminAnnouncement {
  id: string;
  enabled: boolean;
  message: string;
  type: 'info' | 'alert' | 'event';
  updatedAt: string;
}

// Anonymous Call Log & Verbatim Direct Transcript for Administrative Auditing
export interface CallTranscriptTurn {
  id: string;
  speaker: 'Anonymous Caller' | 'AI Phonebot' | 'System';
  text: string;
  timestamp: string;
  intent?: string;
}

export interface AnonymousCallRecord {
  id: string;
  callNumber: number;
  anonymousCallerId: string; // e.g. "Anonymous Caller #001"
  startTime: string;
  endTime: string;
  durationSeconds: number;
  formattedDuration: string;
  outcome: 'completed' | 'escalated_to_staff' | 'voicemail_recorded' | 'abandoned';
  outcomeLabel: string;
  turnsCount: number;
  finalIntent: string;
  topicsDetected: string[];
  transcript: CallTranscriptTurn[];
  telemetry: {
    roundtripLatencyMs: number;
    sttEngine: string;
    llmEngine: string;
    ttsEngine: string;
    telephonyCodec: string;
  };
}
