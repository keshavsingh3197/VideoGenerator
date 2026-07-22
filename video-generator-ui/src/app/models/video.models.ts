export interface VideoProject {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  duration: string;
  aspectRatio: string;
  resolution: string;
  language: string;
  voiceOver: string;
  backgroundMusic: string;
  characterStyle: string;
  status: VideoStatus;
  previewUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  youTubeVideoId?: string;
  youTubeUrl?: string;
  tags: string[];
  aiConfig?: AiGenerationConfig;
  createdAt: string;
  updatedAt: string;
}

export type VideoStatus =
  | 'Draft'
  | 'Configuring'
  | 'GeneratingPreview'
  | 'PreviewReady'
  | 'GeneratingFinal'
  | 'Ready'
  | 'Uploading'
  | 'Published'
  | 'Failed';

export interface AiGenerationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  useVoiceOver: boolean;
  addSubtitles: boolean;
  subtitleLanguage: string;
  videoType: string;
}

export interface CreateVideoProjectRequest {
  title: string;
  description: string;
  prompt: string;
  style?: string;
  duration?: string;
  aspectRatio?: string;
  resolution?: string;
  language?: string;
  voiceOver?: string;
  backgroundMusic?: string;
  characterStyle?: string;
  videoType?: string;
  tags?: string[];
  aiConfig?: AiGenerationConfig;
}

export interface TitleSuggestion {
  title: string;
  description: string;
  seoScore: number;
}

export interface GenerateTitlesResponse {
  titles: TitleSuggestion[];
}

export interface GenerateScriptResponse {
  script: string;
  suggestedTitles: string[];
  suggestedTags: string[];
  estimatedDuration: string;
}

export interface AiChatResponse {
  response: string;
  suggestions?: string[];
  updatedConfig?: Record<string, string>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  projectId?: string;
  actionUrl?: string;
  createdAt: string;
}

export type NotificationType = 'Info' | 'Success' | 'Warning' | 'Error' | 'VideoReady' | 'UploadComplete' | 'AiProcessing';

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const VIDEO_STYLES = [
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'anime', label: 'Anime' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'vlog', label: 'Vlog' },
  { value: 'educational', label: 'Educational' },
  { value: 'horror', label: 'Horror' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'sci-fi', label: 'Sci-Fi' }
];

export const VIDEO_DURATIONS = [
  { value: '15s', label: '15 seconds (Short)' },
  { value: '30s', label: '30 seconds' },
  { value: '60s', label: '60 seconds (Short)' },
  { value: '3m', label: '3 minutes' },
  { value: '5m', label: '5 minutes' },
  { value: '10m', label: '10 minutes' },
  { value: '15m', label: '15 minutes' }
];

export const ASPECT_RATIOS = [
  { value: '9:16', label: '9:16 (Vertical / Shorts)' },
  { value: '16:9', label: '16:9 (Landscape)' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3 (Classic)' }
];

export const CHARACTER_STYLES = [
  { value: 'none', label: 'None (Keep Original)' },
  { value: 'anime', label: 'Anime Character' },
  { value: 'cartoon', label: 'Cartoon Character' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'claymation', label: 'Claymation' },
  { value: 'watercolor', label: 'Watercolor Painting' },
  { value: 'oil-painting', label: 'Oil Painting' },
  { value: 'comic-book', label: 'Comic Book' },
  { value: 'cyberpunk', label: 'Cyberpunk' }
];
