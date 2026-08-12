import { Note, SyncSettings } from '../types';
import { indexedDBService } from './db';

const STORAGE_KEY = 'samsung_notes_pc_v1';
const SETTINGS_KEY = 'samsung_notes_settings_v1';
const FOLDERS_KEY = 'samsung_notes_folders_v1';
const FOLDER_COLORS_KEY = 'samsung_notes_folder_colors_v1';

export const DEFAULT_FOLDERS = ['工作', '個人', '靈感', '隨記', '待辦事項'];

export const FOLDER_COLOR_PRESETS = [
  '#0381FE', // Samsung Blue
  '#10B981', // Emerald Green
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#84CC16', // Lime
];

export const DEFAULT_FOLDER_COLORS: Record<string, string> = {
  '工作': '#0381FE',
  '個人': '#10B981',
  '靈感': '#8B5CF6',
  '隨記': '#F59E0B',
  '待辦事項': '#EC4899',
};

export function getStoredFolderColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FOLDER_COLORS_KEY);
    if (!raw) return DEFAULT_FOLDER_COLORS;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...DEFAULT_FOLDER_COLORS, ...parsed } : DEFAULT_FOLDER_COLORS;
  } catch {
    return DEFAULT_FOLDER_COLORS;
  }
}

export function saveStoredFolderColors(colors: Record<string, string>): void {
  try {
    localStorage.setItem(FOLDER_COLORS_KEY, JSON.stringify(colors));
  } catch (err) {
    console.error('Failed to save folder colors:', err);
  }
}

export function getStoredFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) return DEFAULT_FOLDERS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FOLDERS;
  } catch {
    return DEFAULT_FOLDERS;
  }
}

export function saveStoredFolders(folders: string[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders:', err);
  }
}

export const DEFAULT_SETTINGS: SyncSettings = {
  googleClientId: '',
  googleApiKey: '',
  isAutoSync: true,
  mode: 'demo',
  lastSyncedAt: null,
  securityPin: '000',
};

export const INITIAL_SEED_NOTES: Note[] = [
  {
    id: 'samsung-welcome-1',
    title: '📱 歡迎使用 Samsung Notes (PC 版 Web SPA)',
    content: `# Samsung Notes PC 版核心架構

這是一款 100% 忠實復刻 **Samsung Notes (PC 版)** 經典黑魂風格與雙畫面切換架構的全功能雲端筆記 SPA。

### 🎨 經典視覺與切換規範
1. **極致暗黑畫風 (Dark Mode)**：
   - 主背景色：純黑深色 \`#0B0B0C\`
   - 卡片與側邊欄背景：暗灰 \`#1F1F22\` / \`#262629\`
   - 高對比文字：純白 \`#FFFFFF\` 與質感灰 \`#A0A0A0\`
2. **圖庫主頁 (Gallery View)**：
   - 左側邊欄 ≡ 可切換「完整展開」與「極簡 Icon 欄」。
   - 頂部工具列：包含 **建立筆記**、**匯入 PDF**、**檢視切換** (大網格/小網格/清單) 與搜尋。
   - 大網格繪圖與內文卡片預覽。
3. **獨立全螢幕編輯頁 (Editor View)**：
   - 點擊卡片全螢幕切換至編輯模式。
   - 頂部列：< 返回鍵、閱讀/編輯模式、插入 (+ 圖片/PDF/語音)、分享匯出。
   - 中央直向 Samsung Notes 筆記紙張 (帶有 **- 100% +** 縮放控制器)。
   - 右側懸浮垂直工具列：鍵盤文字 mode、S-Pen 鋼筆、螢光筆、橡皮擦、套索選擇、撤銷/重做。

### ☁️ 儲存與同步 API
- 預設整合 **IndexedDB** 本地持久化資料庫 (支援 PDF 與大型圖檔)。
- 可前往「設定」開啟 Google Drive API v3 同步 (\`CloudNotes_WebData\` 資料夾)。`,
    folder: '個人',
    tags: ['Samsung Notes', '教學', 'PC版'],
    isPinned: true,
    isFavorite: true,
    isDeleted: false,
    isLocked: false,
    paperStyle: 'white',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    drawings: [],
    audioRecordings: [],
    tasks: [
      { id: 't1', text: '試用右側 S-Pen 懸浮繪圖工具列', completed: true },
      { id: 't2', text: '切換側邊欄 ≡ 極簡 Icon 模式', completed: true },
      { id: 't3', text: '嘗試「匯入 PDF」或開啟獨立全螢幕編輯頁', completed: false },
    ],
    colorPreset: '#0381FE',
  },
  {
    id: 'samsung-demo-2',
    title: '🎨 S-Pen 手寫與繪圖靈感草稿',
    content: `## 會議簡報與繪圖紀錄

- **專案進度**：Samsung Notes PC 介面開發 complete
- **重點工具**：
  1. 鋼筆 / 水彩筆觸平滑化
  2. 螢光筆半透明標記
  3. 套索工具自由選取與移動
  
> 「在網頁上重現如同 Galaxy Tab & Galaxy Book 上的極致流暢手寫體驗。」`,
    folder: '靈感',
    tags: ['S-Pen', '繪圖', '靈感'],
    isPinned: false,
    isFavorite: true,
    isDeleted: false,
    isLocked: false,
    paperStyle: 'lines',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    drawings: [],
    audioRecordings: [],
    tasks: [
      { id: 't-1', text: '調整筆劃半透明疊加效果', completed: true },
      { id: 't-2', text: '支援全螢幕 100% 畫布縮放', completed: true },
    ],
  }
];

export async function getLocalNotes(userEmail?: string): Promise<Note[]> {
  try {
    const dbName = userEmail ? `SamsungNotes_PC_DB_${userEmail}` : 'SamsungNotes_PC_DB_local';
    await indexedDBService.init(dbName);
    const dbNotes = await indexedDBService.getAllNotes();

    if (dbNotes && dbNotes.length > 0) {
      return dbNotes;
    }

    // Fallback to localStorage if IndexedDB is empty
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await indexedDBService.saveAllNotes(parsed);
          return parsed;
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    // Seed notes
    await indexedDBService.saveAllNotes(INITIAL_SEED_NOTES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_NOTES));
    } catch {
      // Ignore quota errors
    }
    return INITIAL_SEED_NOTES;
  } catch (err) {
    console.error('Failed to get notes from DB:', err);
    return INITIAL_SEED_NOTES;
  }
}

export async function saveLocalNotes(notes: Note[], userEmail?: string): Promise<void> {
  try {
    const dbName = userEmail ? `SamsungNotes_PC_DB_${userEmail}` : 'SamsungNotes_PC_DB_local';
    await indexedDBService.init(dbName);
    await indexedDBService.saveAllNotes(notes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Safely ignore localStorage quota errors (5MB limit) when storing large images/PDF attachments.
      // IndexedDB handles full persistence cleanly.
    }
  } catch (err) {
    console.error('Failed to save notes:', err);
  }
}

export function getSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
