import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FolderInput, 
  Share2, 
  Trash2, 
  Copy, 
  FileText, 
  Download, 
  Check, 
  X, 
  FolderPlus,
  Lock,
  RotateCcw,
  FolderMinus
} from 'lucide-react';
import { Note, SyncSettings, GoogleUser, GalleryViewMode, PdfAttachment } from './types';
import { getLocalNotes, saveLocalNotes, getSettings, saveSettings, getStoredFolders, saveStoredFolders, getStoredFolderColors, saveStoredFolderColors, FOLDER_COLOR_PRESETS } from './services/storage';
import { driveService } from './services/googleDrive';
import { Sidebar } from './components/Sidebar';
import { GalleryHeader } from './components/GalleryHeader';
import { GalleryView } from './components/GalleryView';
import { NoteEditorView } from './components/NoteEditorView';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { ChangelogModal } from './components/ChangelogModal';
import { PasswordModal } from './components/PasswordModal';

export default function App() {
  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'gallery' | 'editor'>('gallery');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [galleryViewMode, setGalleryViewMode] = useState<GalleryViewMode>('grid');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark as per original
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Folders State
  const [folders, setFolders] = useState<string[]>(getStoredFolders());
  const [folderColors, setFolderColors] = useState<Record<string, string>>(getStoredFolderColors());

  const handleChangeFolderColor = (folderName: string, color: string) => {
    const updated = { ...folderColors, [folderName]: color };
    setFolderColors(updated);
    saveStoredFolderColors(updated);
  };

  // Notes & Active Note State
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Settings & OAuth User State
  const [settings, setSyncSettingsState] = useState<SyncSettings>(getSettings());
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Latest notes ref for beforeunload saving
  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Status & Modals
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  // Security Lock Modal State
  const [pendingUnlockAction, setPendingUnlockAction] = useState<
    | { type: 'open'; noteId: string }
    | { type: 'unlock_note'; noteId: string }
    | { type: 'batch_unlock'; noteIds: string[] }
    | null
  >(null);

  // Batch Selection State & Modals
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false);
  const [isBatchShareOpen, setIsBatchShareOpen] = useState(false);
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const [targetBatchFolder, setTargetBatchFolder] = useState<string>('個人');
  const [newBatchFolderInput, setNewBatchFolderInput] = useState<string>('');
  const [copiedBatchToast, setCopiedBatchToast] = useState(false);

  // Initial Load from IndexedDB
  useEffect(() => {
    async function loadData() {
      const loadedNotes = await getLocalNotes(user?.email);
      setNotes(loadedNotes);
    }
    loadData();
  }, [user?.email]);

// Helper to merge local notes and remote notes by updatedAt timestamp (Never overwrite newer edits with older remote copies)
const mergeNotesWithRemote = (localNotes: Note[], remoteNotes: Note[]): Note[] => {
  const map = new Map<string, Note>();

  // Place remote notes in map first
  remoteNotes.forEach((n) => {
    map.set(n.id, n);
  });

  // Compare with local notes
  localNotes.forEach((local) => {
    const remote = map.get(local.id);
    if (!remote) {
      // Local note does not exist on remote yet -> KEEP LOCAL!
      map.set(local.id, local);
    } else {
      const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime();
      const remoteTime = new Date(remote.updatedAt || remote.createdAt || 0).getTime();
      if (localTime >= remoteTime) {
        // Local note was modified more recently -> KEEP LOCAL!
        map.set(local.id, local);
      }
    }
  });

  return Array.from(map.values());
};

  // Sync to Google Drive
  const handleSyncToDrive = useCallback(async (latestNotes: Note[], overrideUser = user, overrideMode = settings.mode) => {
    if (!overrideUser || overrideMode !== 'google_drive') return;
    setIsSyncing(true);
    try {
      await driveService.syncNotesToDrive(latestNotes);
      setSyncSettingsState((prev) => {
        const updated = {
          ...prev,
          lastSyncedAt: new Date().toISOString(),
        };
        saveSettings(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to sync to Drive:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, settings.mode]);

  // Sync from Google Drive (下載雲端最新筆記)
  const handleSyncFromDrive = useCallback(async (overrideUser = user, overrideMode = settings.mode) => {
    if (!overrideUser || overrideMode !== 'google_drive') return;
    setIsSyncing(true);
    try {
      const driveNotes = await driveService.fetchNotesFromDrive();
      if (driveNotes && driveNotes.length > 0) {
        const merged = mergeNotesWithRemote(notesRef.current, driveNotes);
        setNotes(merged);
        saveLocalNotes(merged, overrideUser?.email);
      } else if (notesRef.current && notesRef.current.length > 0) {
        // 如果雲端是空的但本地有筆記，才將本地筆記推上雲端
        await handleSyncToDrive(notesRef.current, overrideUser, overrideMode);
      }
      // 更新最後同步時間
      setSyncSettingsState((prev) => {
        const updated = { ...prev, lastSyncedAt: new Date().toISOString() };
        saveSettings(updated);
        return updated;
      });
    } catch (err) {
      console.error('Failed to fetch from Drive:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, settings.mode, handleSyncToDrive]);

  const hasRestoredSessionRef = useRef(false);

  // Restore Google Session on mount
  // 流程：讀取 Session -> 立刻載入 IndexedDB 本地筆記 -> 關閉載入畫面 -> 背景拉取 Drive 並 merge
  useEffect(() => {
    if (hasRestoredSessionRef.current) return;
    hasRestoredSessionRef.current = true;

    async function restoreSession() {
      const savedSessionStr = localStorage.getItem('cloudnotes_google_session');
      let sessionUser: GoogleUser | null = null;

      if (savedSessionStr) {
        try {
          const session = JSON.parse(savedSessionStr);
          if (session.user && session.expiresAt > Date.now()) {
            sessionUser = session.user;
            setUser(session.user);
          } else {
            localStorage.removeItem('cloudnotes_google_session');
          }
        } catch (err) {
          console.error('Failed to parse saved session', err);
        }
      }

      // ⚡ 步驟一：先從 IndexedDB 載入本地筆記（必須在關閉載入畫面之前完成）
      if (sessionUser) {
        try {
          const { getLocalNotes: loadNotes } = await import('./services/storage');
          const localNotes = await loadNotes(sessionUser.email);
          if (localNotes && localNotes.length > 0) {
            setNotes(localNotes);
            notesRef.current = localNotes;
          }
        } catch (e) {
          console.error('Failed to load local notes on mount:', e);
        }
      }

      // ⚡ 步驟二：立刻關閉全螢幕載入畫面，讓使用者瞬間看到本地筆記
      setIsInitializing(false);

      // ☁️ 步驟三：背景靜默連線 Google Drive，拉取最新資料後 merge
      if (sessionUser) {
        (async () => {
          try {
            await driveService.initClient();
            driveService.restoreSession(sessionUser.accessToken);
            setIsSyncing(true);
            const driveNotes = await driveService.fetchNotesFromDrive();
            if (driveNotes && driveNotes.length > 0) {
              // 此時 notesRef.current 已包含本地資料，merge 才正確
              const merged = mergeNotesWithRemote(notesRef.current, driveNotes);
              setNotes(merged);
              saveLocalNotes(merged, sessionUser.email);
            } else if (notesRef.current.length > 0) {
              // Drive 是空的，把本機資料推上去
              await driveService.syncNotesToDrive(notesRef.current);
            }
          } catch (e) {
            console.error('Background initial sync error:', e);
          } finally {
            setIsSyncing(false);
          }
        })();
      }
    }

    restoreSession();
  }, []);

  // Update Settings helper
  const handleUpdateSettings = (newSettings: SyncSettings) => {
    setSyncSettingsState(newSettings);
    saveSettings(newSettings);

    if (newSettings.mode === 'google_drive') {
      driveService.initClient();
    }
  };

  // Connect Google OAuth
  const handleConnectGoogle = async () => {
    try {
      await driveService.initClient();
      const token = await driveService.requestAccessToken();
      const profile = await driveService.getUserProfile(token);
      if (profile) {
        setUser(profile);
        localStorage.setItem('cloudnotes_google_session', JSON.stringify({
          user: profile,
          expiresAt: Date.now() + 3500 * 1000, // almost 1 hour
        }));
        const newSettings = { ...settings, mode: 'google_drive' as const };
        handleUpdateSettings(newSettings);
        // 登入後立刻從雲端拉取其他裝置建立的筆記
        await handleSyncFromDrive(profile, 'google_drive');
      }
    } catch (err) {
      console.error('Google Connect Error:', err);
      alert('授權失敗，系統已自動維持 IndexedDB 本地模式。');
    }
  };

  const handleDisconnectGoogle = async () => {
    // 徹底清除當前使用者的本地 IndexedDB 快取
    await saveLocalNotes([], user?.email);
    
    // 清除 Session
    setUser(null);
    localStorage.removeItem('cloudnotes_google_session');
    handleUpdateSettings({ ...settings, mode: 'demo' });
    
    // 強制重新載入網頁，徹底重置所有 React State (notes, selections 等)，確保最乾淨的登出狀態
    window.location.reload();
  };

  // Debounced Auto-save to IndexedDB (1.5s)
  useEffect(() => {
    if (notes.length === 0) return;
    setAutoSaveStatus('saving');

    const timer = setTimeout(() => {
      saveLocalNotes(notes, user?.email);
      setAutoSaveStatus('saved');

      if (settings.mode === 'google_drive' && settings.isAutoSync && user) {
        handleSyncToDrive(notes);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [notes, settings.mode, settings.isAutoSync, user]);

  // Flush pending changes on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveStatus === 'saving') {
        saveLocalNotes(notesRef.current, user?.email);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSaveStatus, user?.email]);

  // Active Note Memo
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Update Note Handler
  const handleUpdateNote = useCallback((updatedNote: Note) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }, []);

  // 3-day Auto Cleanup for Trash Notes
  useEffect(() => {
    if (notes.length === 0) return;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let hasExpired = false;
    const updatedNotes = notes.filter((note) => {
      if (!note.isDeleted) return true;
      const deleteTimestamp = note.deletedAt
        ? new Date(note.deletedAt).getTime()
        : new Date(note.updatedAt || note.createdAt).getTime();

      if (now - deleteTimestamp > THREE_DAYS_MS) {
        hasExpired = true;
        return false;
      }
      return true;
    });

    if (hasExpired) {
      setNotes(updatedNotes);
      saveLocalNotes(updatedNotes, user?.email);
    }
  }, [notes]);

  // Create New Note
  const handleCreateNewNote = useCallback(() => {
    const targetFolder = folders.includes(selectedCategory) ? selectedCategory : '未分類';
    const newNote: Note = {
      id: 'samsung-note-' + Date.now(),
      title: '無標題筆記',
      content: '',
      folder: targetFolder,
      tags: ['新筆記'],
      isPinned: false,
      isFavorite: false,
      isDeleted: false,
      isLocked: false,
      paperStyle: 'white',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      drawings: [],
      audioRecordings: [],
      pdfAttachments: [],
      tasks: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setCurrentView('editor');
  }, [selectedCategory, folders]);

  // Import PDF as New Note
  const handleImportPDF = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const pdfAttachment: PdfAttachment = {
        id: 'pdf-' + Date.now(),
        name: file.name,
        dataUrl: base64,
        sizeBytes: file.size,
        createdAt: new Date().toISOString(),
      };

      const newNote: Note = {
        id: 'samsung-pdf-' + Date.now(),
        title: file.name.replace(/\.pdf$/i, ''),
        content: `## 📄 PDF 筆記文件: ${file.name}\n\n這是一份匯入的 PDF 文件筆記。`,
        folder: folders.includes(selectedCategory) ? selectedCategory : '未分類',
        tags: ['PDF文件'],
        isPinned: false,
        isFavorite: false,
        isDeleted: false,
        isLocked: false,
        paperStyle: 'white',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        drawings: [],
        audioRecordings: [],
        pdfAttachments: [pdfAttachment],
        tasks: [],
      };

      setNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
      setCurrentView('editor');
    };
    reader.readAsDataURL(file);
  }, [selectedCategory, folders]);

  // Create Custom Folder
  const handleCreateFolder = (folderName: string, color?: string) => {
    if (!folders.includes(folderName)) {
      const updated = [...folders, folderName];
      setFolders(updated);
      saveStoredFolders(updated);

      const chosenColor = color || FOLDER_COLOR_PRESETS[updated.length % FOLDER_COLOR_PRESETS.length];
      const updatedColors = { ...folderColors, [folderName]: chosenColor };
      setFolderColors(updatedColors);
      saveStoredFolderColors(updatedColors);

      setSelectedCategory(folderName);
    }
  };

  // Delete Custom Folder
  const handleDeleteFolder = (folderName: string) => {
    const updated = folders.filter((f) => f !== folderName);
    setFolders(updated);
    saveStoredFolders(updated);

    if (selectedCategory === folderName) {
      setSelectedCategory('all');
    }

    // Move notes in the deleted folder to default '個人' folder
    setNotes((prev) =>
      prev.map((n) => (n.folder === folderName ? { ...n, folder: '個人' } : n))
    );
  };

  // Note Card Click Action
  const handleSelectNote = (note: Note) => {
    if (note.isLocked) {
      setPendingUnlockAction({ type: 'open', noteId: note.id });
    } else {
      setActiveNoteId(note.id);
      setCurrentView('editor');
    }
  };

  // Pin / Favorite / Lock / Delete Toggles
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isFavorite: !n.isFavorite } : n))
    );
  };

  const handleToggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetNote = notes.find((n) => n.id === id);
    if (!targetNote) return;

    if (targetNote.isLocked) {
      setPendingUnlockAction({ type: 'unlock_note', noteId: id });
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isLocked: true } : n))
      );
    }
  };

  const handleToggleChecklist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const hasTasks = n.tasks && n.tasks.length > 0;
          if (hasTasks) {
            const allCompleted = n.tasks.every((t) => t.completed);
            if (allCompleted) {
              return { ...n, tasks: [] };
            } else {
              return {
                ...n,
                tasks: n.tasks.map((t) => ({ ...t, completed: true })),
              };
            }
          } else {
            return {
              ...n,
              tasks: [
                { id: 'task-' + Date.now(), text: '待辦事項', completed: false },
              ],
            };
          }
        }
        return n;
      })
    );
  };

  const handleDeleteNote = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev
        .map((n) => {
          if (n.id === id) {
            if (n.isDeleted) return null; // Permanent delete if already in trash
            return {
              ...n,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
            };
          }
          return n;
        })
        .filter(Boolean) as Note[]
    );

    if (activeNoteId === id) {
      setActiveNoteId(null);
      setCurrentView('gallery');
    }
  }, [activeNoteId]);

  const handleRestoreNote = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, isDeleted: false, deletedAt: undefined } : n
      )
    );
  }, []);

  const handleEmptyTrash = useCallback(() => {
    setNotes((prev) => prev.filter((n) => !n.isDeleted));
  }, []);

  // Reset selection on category/search change
  useEffect(() => {
    setSelectedNoteIds([]);
  }, [selectedCategory, searchQuery]);

  // Toggle single note selection
  const handleToggleSelectNote = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedNoteIds([]);
  }, []);

  // Batch Move Notes
  const handleBatchMoveNotes = useCallback(() => {
    const finalFolder = newBatchFolderInput.trim() || targetBatchFolder;
    if (!finalFolder || selectedNoteIds.length === 0) return;

    if (newBatchFolderInput.trim() && !folders.includes(newBatchFolderInput.trim())) {
      const updatedFolders = [...folders, newBatchFolderInput.trim()];
      setFolders(updatedFolders);
      saveStoredFolders(updatedFolders);
    }

    setNotes((prev) =>
      prev.map((n) => (selectedNoteIds.includes(n.id) ? { ...n, folder: finalFolder } : n))
    );
    setSelectedNoteIds([]);
    setIsBatchMoveOpen(false);
    setNewBatchFolderInput('');
  }, [selectedNoteIds, targetBatchFolder, newBatchFolderInput, folders]);

  // Batch Lock / Unlock Notes
  const handleBatchLockNotes = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    const allLocked = selectedNotes.every((n) => n.isLocked);

    if (allLocked) {
      setPendingUnlockAction({ type: 'batch_unlock', noteIds: selectedNoteIds });
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          selectedNoteIds.includes(n.id) ? { ...n, isLocked: true } : n
        )
      );
      setSelectedNoteIds([]);
    }
  }, [selectedNoteIds, notes]);

  // Batch Remove Notes From Folder (Move to 未分類)
  const handleBatchRemoveFromFolder = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    setNotes((prev) =>
      prev.map((n) => (selectedNoteIds.includes(n.id) ? { ...n, folder: '未分類' } : n))
    );
    setSelectedNoteIds([]);
  }, [selectedNoteIds]);

  // Batch Delete / Permanent Delete
  const handleBatchDeleteNotes = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    const isTrash = selectedCategory === 'trash';
    if (isTrash) {
      setNotes((prev) => prev.filter((n) => !selectedNoteIds.includes(n.id)));
    } else {
      setNotes((prev) =>
        prev.map((n) =>
          selectedNoteIds.includes(n.id)
            ? { ...n, isDeleted: true, deletedAt: new Date().toISOString() }
            : n
        )
      );
    }
    setSelectedNoteIds([]);
    setIsBatchDeleteConfirmOpen(false);
  }, [selectedNoteIds, selectedCategory]);

  // Batch Restore Notes from Trash
  const handleBatchRestoreNotes = useCallback(() => {
    if (selectedNoteIds.length === 0) return;
    setNotes((prev) =>
      prev.map((n) =>
        selectedNoteIds.includes(n.id) ? { ...n, isDeleted: false, deletedAt: undefined } : n
      )
    );
    setSelectedNoteIds([]);
  }, [selectedNoteIds]);

  // Export / Copy Batch Selected Notes Text
  const getSelectedNotesCombinedText = useCallback(() => {
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    return selectedNotes
      .map(
        (n, i) =>
          `======== 筆記 ${i + 1}: ${n.title || '無標題筆記'} ========\n資料夾: ${
            n.folder
          }\n建立時間: ${n.createdAt}\n\n${n.content || '(無內文)'}\n`
      )
      .join('\n\n');
  }, [notes, selectedNoteIds]);

  const handleDownloadBatchTxt = useCallback(() => {
    const text = getSelectedNotesCombinedText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samsung_notes_export_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getSelectedNotesCombinedText]);

  const handleDownloadBatchJson = useCallback(() => {
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    const jsonStr = JSON.stringify(selectedNotes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samsung_notes_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [notes, selectedNoteIds]);

  const handleCopyBatchToClipboard = useCallback(() => {
    const text = getSelectedNotesCombinedText();
    navigator.clipboard.writeText(text);
    setCopiedBatchToast(true);
    setTimeout(() => setCopiedBatchToast(false), 2000);
  }, [getSelectedNotesCombinedText]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (selectedCategory === 'trash') return note.isDeleted;
        if (note.isDeleted) return false;

        if (selectedCategory === 'favorites') return note.isFavorite;
        if (selectedCategory === 'locked') return note.isLocked;
        if (selectedCategory === 'all') {
          // All non-deleted notes
        } else if (folders.includes(selectedCategory)) {
          if (note.folder !== selectedCategory) return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = note.title.toLowerCase().includes(q);
          const matchesContent = note.content.toLowerCase().includes(q);
          const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
          return matchesTitle || matchesContent || matchesTags;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, selectedCategory, searchQuery, sortBy, folders]);

  // Select all / Deselect all
  const handleSelectAllNotesToggle = useCallback(() => {
    if (filteredNotes.length === 0) return;
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]);
    } else {
      setSelectedNoteIds(filteredNotes.map((n) => n.id));
    }
  }, [filteredNotes, selectedNoteIds]);

  // Note counts map
  const noteCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notes.filter((n) => !n.isDeleted).length,
      favorites: notes.filter((n) => !n.isDeleted && n.isFavorite).length,
      locked: notes.filter((n) => !n.isDeleted && n.isLocked).length,
      trash: notes.filter((n) => n.isDeleted).length,
    };

    folders.forEach((f) => {
      counts[f] = notes.filter((n) => !n.isDeleted && n.folder === f).length;
    });

    return counts;
  }, [notes, folders]);

  const categoryTitleMap: Record<string, string> = {
    all: '所有筆記',
    favorites: '我的最愛',
    locked: '鎖定筆記',
    trash: '回收桶',
  };

  const currentCategoryTitle = categoryTitleMap[selectedCategory] || selectedCategory;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#0381FE]/20 border-t-[#0381FE] rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-[#A0A0A0] animate-pulse">
            載入專屬空間中...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleConnectGoogle} />;
  }

  return (
    <div className={`w-screen h-screen bg-transparent text-current font-sans antialiased overflow-hidden flex select-none ${isDarkMode ? 'dark' : ''}`}>
      {/* VIEW 1: GALLERY HOME VIEW (圖庫主頁) */}
      {currentView === 'gallery' && (
        <div className="w-full h-full flex overflow-hidden relative">
          {/* Desktop Left Sidebar (Visible only on lg screen and larger) */}
          <div className="hidden lg:flex h-full shrink-0">
            <Sidebar
              isExpanded={isSidebarExpanded}
              onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              folders={folders}
              folderColors={folderColors}
              onChangeFolderColor={handleChangeFolderColor}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              user={user}
              settings={settings}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onConnectGoogle={handleConnectGoogle}
              onDisconnectGoogle={handleDisconnectGoogle}
              onOpenChangelog={() => setIsChangelogOpen(true)}
              noteCounts={noteCounts}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          </div>

          {/* Mobile / Tablet Overlay Drawer Backdrop */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Mobile / Tablet Slide-out Sidebar Drawer */}
          <div
            className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 transform ${
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              isExpanded={true}
              onToggleExpand={() => setIsMobileSidebarOpen(false)}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setIsMobileSidebarOpen(false);
              }}
              folders={folders}
              folderColors={folderColors}
              onChangeFolderColor={handleChangeFolderColor}
              onCreateFolder={handleCreateFolder}
              onDeleteFolder={handleDeleteFolder}
              user={user}
              settings={settings}
              onOpenSettings={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onConnectGoogle={() => {
                handleConnectGoogle();
                setIsMobileSidebarOpen(false);
              }}
              onDisconnectGoogle={() => {
                handleDisconnectGoogle();
                setIsMobileSidebarOpen(false);
              }}
              onOpenChangelog={() => {
                setIsChangelogOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              noteCounts={noteCounts}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-transparent">
            {/* Top Toolbar Header */}
            <GalleryHeader
              title={currentCategoryTitle}
              count={filteredNotes.length}
              onToggleSidebar={() => setIsMobileSidebarOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              viewMode={galleryViewMode}
              onViewModeChange={setGalleryViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onCreateNote={handleCreateNewNote}
              onImportPDF={handleImportPDF}
              isTrashView={selectedCategory === 'trash'}
              onEmptyTrash={handleEmptyTrash}
              onSync={handleSyncFromDrive}
              isSyncing={isSyncing}
              lastSyncedAt={settings.lastSyncedAt}
              isGoogleConnected={settings.mode === 'google_drive' && !!user}
              selectedCount={selectedNoteIds.length}
              isAllSelected={
                filteredNotes.length > 0 && selectedNoteIds.length === filteredNotes.length
              }
              onClearSelection={handleClearSelection}
              onSelectAllToggle={handleSelectAllNotesToggle}
              onBatchMoveClick={() => setIsBatchMoveOpen(true)}
              onBatchRemoveFromFolderClick={handleBatchRemoveFromFolder}
              onBatchLockClick={handleBatchLockNotes}
              onBatchShareClick={() => setIsBatchShareOpen(true)}
              onBatchDeleteClick={() => setIsBatchDeleteConfirmOpen(true)}
              onBatchRestoreClick={handleBatchRestoreNotes}
            />

            {/* Note Cards Gallery Grid */}
            <GalleryView
              notes={filteredNotes}
              viewMode={galleryViewMode}
              onSelectNote={handleSelectNote}
              onTogglePin={handleTogglePin}
              onToggleFavorite={handleToggleFavorite}
              onToggleLock={handleToggleLock}
              onToggleChecklist={handleToggleChecklist}
              onDeleteNote={handleDeleteNote}
              onRestoreNote={handleRestoreNote}
              onCreateNote={handleCreateNewNote}
              isTrashView={selectedCategory === 'trash'}
              selectedNoteIds={selectedNoteIds}
              onToggleSelectNote={handleToggleSelectNote}
            />
          </main>
        </div>
      )}

      {/* VIEW 2: STANDALONE FULL-SCREEN EDITOR VIEW (獨立全螢幕編輯頁) */}
      {currentView === 'editor' && activeNote && (
        <NoteEditorView
          note={activeNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={(id) => handleDeleteNote(id)}
          onBackToGallery={() => setCurrentView('gallery')}
          autoSaveStatus={autoSaveStatus}
          folders={folders}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        user={user}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        onManualSync={handleSyncFromDrive}
        isSyncing={isSyncing}
        notes={notes}
        onImportBackup={(imported) => {
          setNotes(imported);
          saveLocalNotes(imported, user?.email);
        }}
      />

      {/* Changelog Modal */}
      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* Security Password Lock Modal */}
      <PasswordModal
        isOpen={!!pendingUnlockAction}
        onClose={() => setPendingUnlockAction(null)}
        title={
          pendingUnlockAction?.type === 'unlock_note' || pendingUnlockAction?.type === 'batch_unlock'
            ? '取消筆記鎖定'
            : '筆記安全加密保護'
        }
        subtitle={
          pendingUnlockAction?.type === 'unlock_note' || pendingUnlockAction?.type === 'batch_unlock'
            ? '請輸入解鎖密碼以取消筆記的加密鎖定。'
            : '這份筆記已被鎖定，請輸入解鎖密碼檢視內容。'
        }
        onSuccess={() => {
          if (!pendingUnlockAction) return;

          if (pendingUnlockAction.type === 'open') {
            setActiveNoteId(pendingUnlockAction.noteId);
            setPendingUnlockAction(null);
            setCurrentView('editor');
          } else if (pendingUnlockAction.type === 'unlock_note') {
            const targetId = pendingUnlockAction.noteId;
            setNotes((prev) =>
              prev.map((n) => (n.id === targetId ? { ...n, isLocked: false } : n))
            );
            setPendingUnlockAction(null);
          } else if (pendingUnlockAction.type === 'batch_unlock') {
            const targetIds = pendingUnlockAction.noteIds;
            setNotes((prev) =>
              prev.map((n) => (targetIds.includes(n.id) ? { ...n, isLocked: false } : n))
            );
            setSelectedNoteIds([]);
            setPendingUnlockAction(null);
          }
        }}
        correctPin={settings.securityPin || '000'}
      />

      {/* Batch Move Modal (移動至資料夾) */}
      {isBatchMoveOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBatchMoveOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2C2C30] pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <FolderInput className="w-5 h-5 text-blue-400" />
                <h3>移動 {selectedNoteIds.length} 份筆記至資料夾</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchMoveOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-[#A0A0A0]">選擇目標資料夾：</label>
              
              {/* 取消加入資料夾 / 移至未分類 按鈕 */}
              <button
                type="button"
                onClick={() => {
                  setTargetBatchFolder('未分類');
                  setNewBatchFolderInput('');
                }}
                className={`w-full p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                  targetBatchFolder === '未分類' && !newBatchFolderInput
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-[#171719] border-slate-200 dark:border-[#2C2C30] text-slate-300 hover:bg-[#252528]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderMinus className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>取消加入資料夾</span>
                </div>
                <span className="text-[11px] font-normal text-slate-400">(移至未分類)</span>
              </button>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                {folders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => {
                      setTargetBatchFolder(folder);
                      setNewBatchFolderInput('');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center gap-2 transition-all ${
                      targetBatchFolder === folder && !newBatchFolderInput
                        ? 'bg-[#0381FE]/20 border-[#0381FE] text-[#0381FE]'
                        : 'bg-[#171719] border-slate-200 dark:border-[#2C2C30] text-slate-300 hover:bg-[#252528]'
                    }`}
                  >
                    <FolderInput className="w-4 h-4 shrink-0" />
                    <span className="truncate">{folder}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-[#A0A0A0] block mb-1">或建立新資料夾：</label>
                <input
                  type="text"
                  value={newBatchFolderInput}
                  onChange={(e) => setNewBatchFolderInput(e.target.value)}
                  placeholder="輸入新資料夾名稱..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#171719] border border-slate-200 dark:border-[#2C2C30] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-[#0381FE]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#2C2C30]">
              <button
                type="button"
                onClick={() => setIsBatchMoveOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchMoveNotes}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0381FE] hover:bg-blue-600 text-white transition-colors"
              >
                確認移動
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Share / Export Modal */}
      {isBatchShareOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBatchShareOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2C2C30] pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3>分享與匯出 ({selectedNoteIds.length} 份筆記)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchShareOpen(false)}
                className="text-slate-400 hover:text-slate-900 dark:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDownloadBatchTxt}
                className="w-full p-3.5 rounded-xl bg-[#171719] hover:bg-[#252528] border border-slate-200 dark:border-[#2C2C30] flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <div className="text-left">
                    <div>匯出為文字檔 (.txt)</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A0A0A0] font-normal">合併所有選取筆記標題與內文</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleDownloadBatchJson}
                className="w-full p-3.5 rounded-xl bg-[#171719] hover:bg-[#252528] border border-slate-200 dark:border-[#2C2C30] flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-sky-400" />
                  <div className="text-left">
                    <div>匯出 JSON 備份檔 (.json)</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A0A0A0] font-normal">完整保存繪圖與附件結構</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={handleCopyBatchToClipboard}
                className="w-full p-3.5 rounded-xl bg-[#171719] hover:bg-[#252528] border border-slate-200 dark:border-[#2C2C30] flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-5 h-5 text-emerald-400" />
                  <div className="text-left">
                    <div>複製全部內容至剪貼簿</div>
                    <div className="text-[10px] text-slate-500 dark:text-[#A0A0A0] font-normal">方便直接貼上至 LINE 或 Email</div>
                  </div>
                </div>
                {copiedBatchToast ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> 已複製
                  </span>
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-200 dark:border-[#2C2C30]">
              <button
                type="button"
                onClick={() => setIsBatchShareOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsBatchDeleteConfirmOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <h3>{selectedCategory === 'trash' ? '永久刪除選取筆記' : '移至回收桶'}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              {selectedCategory === 'trash' ? (
                <>
                  確定要永久刪除已選取的 <strong className="text-slate-900 dark:text-white">{selectedNoteIds.length}</strong> 份筆記嗎？<span className="text-rose-400 font-semibold block mt-1">此操作無法復原。</span>
                </>
              ) : (
                <>
                  確定要將已選取的 <strong className="text-slate-900 dark:text-white">{selectedNoteIds.length}</strong> 份筆記移至回收桶嗎？可在回收桶保留 3 天並自由還原。
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#2C2C30]">
              <button
                type="button"
                onClick={() => setIsBatchDeleteConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchDeleteNotes}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {selectedCategory === 'trash' ? '確定永久刪除' : '確定移至回收桶'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
