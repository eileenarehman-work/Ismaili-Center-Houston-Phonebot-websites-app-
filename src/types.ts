export type NavigationTab = 'assistant' | 'hotline' | 'schedule' | 'visitor' | 'videos';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'offline' | 'offline-fallback';
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
