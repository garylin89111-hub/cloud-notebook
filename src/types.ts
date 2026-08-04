export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DrawingData {
  id: string;
  dataUrl: string; // Base64 PNG image
  title?: string;
  createdAt: string;
}

export interface AudioRecording {
  id: string;
  dataUrl: string; // Base64 webm/mp3
  durationSeconds: number;
  name: string;
  createdAt: string;
}

export interface PdfAttachment {
  id: string;
  name: string;
  dataUrl: string;
  sizeBytes?: number;
  pageCount?: number;
  createdAt: string;
}

export interface ImageAttachment {
  id: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export type NoteFolder = string; // Standard or custom folders (e.g. '工作', '個人', '靈感', '隨記', '待辦事項', etc.)

export interface Note {
  id: string;
  title: string;
  content: string;
  folder: NoteFolder;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string; // ISO timestamp when note was moved to trash
  isLocked?: boolean;
  pinCode?: string;
  createdAt: string;
  updatedAt: string;
  drawings: DrawingData[];
  audioRecordings: AudioRecording[];
  pdfAttachments?: PdfAttachment[];
  images?: ImageAttachment[];
  tasks: TaskItem[];
  colorPreset?: string; // Optional card accent color
  paperStyle?: 'white' | 'dark' | 'grid' | 'lines'; // Paper background style for Samsung Notes canvas
}

export interface SyncSettings {
  googleClientId: string;
  googleApiKey: string;
  isAutoSync: boolean;
  mode: 'demo' | 'google_drive';
  lastSyncedAt: string | null;
  securityPin?: string;
}

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  accessToken: string;
}

export type ActiveTab = 'all' | 'favorites' | 'pinned' | 'drawings' | 'audio' | 'locked' | 'trash' | string;

export type GalleryViewMode = 'grid' | 'small-grid' | 'list';

export type SPenToolMode = 'text' | 'pen' | 'highlighter' | 'eraser' | 'lasso';
