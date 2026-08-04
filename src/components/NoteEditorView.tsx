import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronDown,
  Check,
  Lock, 
  Unlock, 
  Plus, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Search, 
  MoreVertical, 
  Folder, 
  FileUp, 
  Image as ImageIcon, 
  Mic, 
  PenTool, 
  CheckSquare, 
  Download, 
  Trash2, 
  Clock, 
  Tag, 
  X,
  Eye,
  Edit3,
  Palette,
  FileText
} from 'lucide-react';
import { Note, SPenToolMode, DrawingData, AudioRecording, PdfAttachment, ImageAttachment, TaskItem } from '../types';
import { RightFloatingToolbar } from './RightFloatingToolbar';
import { VoiceRecorder } from './VoiceRecorder';

const DEFAULT_FOLDERS = ['未分類', '工作', '個人', '靈感', '隨記', '待辦事項'];

interface NoteEditorViewProps {
  note: Note;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (id: string) => void;
  onBackToGallery: () => void;
  autoSaveStatus: 'saved' | 'saving' | 'idle';
  folders?: string[];
  onCreateFolder?: (folderName: string) => void;
}

export const NoteEditorView: React.FC<NoteEditorViewProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onBackToGallery,
  autoSaveStatus,
  folders,
  onCreateFolder,
}) => {
  // Read mode / Edit mode switch
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Folder dropdown states
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  const availableFolders = Array.from(
    new Set(['未分類', ...(folders || []), ...DEFAULT_FOLDERS, note.folder || '未分類'])
  ).filter(Boolean);

  // S-Pen tool & canvas state
  const [toolMode, setToolMode] = useState<SPenToolMode>('text');
  const [penColor, setPenColor] = useState('#FFFFFF');
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState('#FDE047');
  const [highlighterWidth, setHighlighterWidth] = useState(16);
  const [eraserMode, setEraserMode] = useState<'stroke' | 'selection'>('stroke');
  const [eraserWidth, setEraserWidth] = useState(30);

  // Selection Eraser / Area Selection State
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<{ x: number; y: number } | null>(null);
  const canvasSnapshotRef = useRef<ImageData | null>(null);

  // Zoom controller state (50% - 200%)
  const [zoomScale, setZoomScale] = useState<number>(100);

  // Menus and Modal Popovers
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inNoteSearchQuery, setInNoteSearchQuery] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  // Paper Canvas & Drawing History
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paperContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRecorderRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Auto-expand textarea to fit all content on page surface without scrollbar
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(300, textareaRef.current.scrollHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [note.content, adjustTextareaHeight]);

  // Unified Note State Snapshot Interface for Undo/Redo
  interface HistorySnapshot {
    title: string;
    content: string;
    tasks: TaskItem[];
    canvasData: ImageData | null;
  }

  // Unified Undo/Redo History Stack
  const historyStackRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const textDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const initializedNoteIdRef = useRef<string | null>(null);

  const updateUndoRedoState = useCallback(() => {
    const hasPendingText = textDebounceTimerRef.current !== null;
    setCanUndo(historyIndexRef.current > 0 || hasPendingText);
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
  }, []);

  // Record text field change (content, title, tasks) with debounced history snapshot
  const handleFieldChange = (fields: Partial<Note>) => {
    const updated: Note = {
      ...note,
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    onUpdateNote(updated);

    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
    }

    textDebounceTimerRef.current = setTimeout(() => {
      textDebounceTimerRef.current = null;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      let currentCanvasData: ImageData | null = null;
      if (canvas && ctx) {
        try {
          currentCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          // ignore
        }
      } else if (historyIndexRef.current >= 0 && historyStackRef.current[historyIndexRef.current]) {
        currentCanvasData = historyStackRef.current[historyIndexRef.current].canvasData;
      }

      const newSnapshot: HistorySnapshot = {
        title: fields.title !== undefined ? fields.title : note.title,
        content: fields.content !== undefined ? fields.content : note.content,
        tasks: fields.tasks !== undefined ? fields.tasks : (note.tasks || []),
        canvasData: currentCanvasData,
      };

      const topSnapshot = historyStackRef.current[historyIndexRef.current];
      if (
        !topSnapshot ||
        topSnapshot.title !== newSnapshot.title ||
        topSnapshot.content !== newSnapshot.content ||
        JSON.stringify(topSnapshot.tasks) !== JSON.stringify(newSnapshot.tasks)
      ) {
        const nextIndex = historyIndexRef.current + 1;
        const newHistory = historyStackRef.current.slice(0, nextIndex);
        newHistory.push(newSnapshot);
        if (newHistory.length > 50) newHistory.shift();
        historyStackRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
      }
      updateUndoRedoState();
    }, 350);

    updateUndoRedoState();
  };

  const flushPendingTextHistory = useCallback(() => {
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
      textDebounceTimerRef.current = null;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      let currentCanvasData: ImageData | null = null;
      if (canvas && ctx) {
        try {
          currentCanvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          // ignore
        }
      } else if (historyIndexRef.current >= 0 && historyStackRef.current[historyIndexRef.current]) {
        currentCanvasData = historyStackRef.current[historyIndexRef.current].canvasData;
      }

      const currentSnapshot: HistorySnapshot = {
        title: note.title,
        content: note.content,
        tasks: note.tasks || [],
        canvasData: currentCanvasData,
      };

      const topSnapshot = historyStackRef.current[historyIndexRef.current];
      if (
        !topSnapshot ||
        topSnapshot.title !== currentSnapshot.title ||
        topSnapshot.content !== currentSnapshot.content ||
        JSON.stringify(topSnapshot.tasks) !== JSON.stringify(currentSnapshot.tasks)
      ) {
        const nextIndex = historyIndexRef.current + 1;
        const newHistory = historyStackRef.current.slice(0, nextIndex);
        newHistory.push(currentSnapshot);
        if (newHistory.length > 50) newHistory.shift();
        historyStackRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
      }
    }
  }, [note.title, note.content, note.tasks]);

  const handleAddTask = useCallback(() => {
    const trimmed = newTaskInput.trim();
    if (!trimmed) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      completed: false,
    };
    const updated = [...(note.tasks || []), newTask];
    handleFieldChange({ tasks: updated });
    setNewTaskInput('');
  }, [newTaskInput, note.tasks]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const updated = (note.tasks || []).filter((t) => t.id !== taskId);
    handleFieldChange({ tasks: updated });
  }, [note.tasks]);

  const saveCanvasState = useCallback(() => {
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
      textDebounceTimerRef.current = null;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const newSnapshot: HistorySnapshot = {
        title: note.title,
        content: note.content,
        tasks: note.tasks || [],
        canvasData: imgData,
      };

      const nextIndex = historyIndexRef.current + 1;
      const newHistory = historyStackRef.current.slice(0, nextIndex);
      newHistory.push(newSnapshot);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      historyStackRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      updateUndoRedoState();

      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl) {
        const drawingItem: DrawingData = {
          id: 'draw-overlay',
          dataUrl,
          createdAt: new Date().toISOString(),
        };
        onUpdateNote({
          ...note,
          drawings: [drawingItem],
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error saving canvas state:', err);
    }
  }, [note, onUpdateNote, updateUndoRedoState]);

  const restoreSnapshot = useCallback((snapshot: HistorySnapshot) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (snapshot.canvasData) {
        ctx.putImageData(snapshot.canvasData, 0, 0);
      }
    }

    const dataUrl = canvas ? canvas.toDataURL('image/png') : '';
    const drawings = dataUrl ? [{ id: 'draw-overlay', dataUrl, createdAt: new Date().toISOString() }] : [];

    onUpdateNote({
      ...note,
      title: snapshot.title,
      content: snapshot.content,
      tasks: snapshot.tasks,
      drawings,
      updatedAt: new Date().toISOString(),
    });

    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  }, [note, onUpdateNote, adjustTextareaHeight]);

  const handleUndo = useCallback(() => {
    flushPendingTextHistory();
    if (historyIndexRef.current > 0) {
      const prevIndex = historyIndexRef.current - 1;
      historyIndexRef.current = prevIndex;
      const snapshot = historyStackRef.current[prevIndex];
      if (snapshot) {
        restoreSnapshot(snapshot);
      }
      updateUndoRedoState();
    }
  }, [flushPendingTextHistory, restoreSnapshot, updateUndoRedoState]);

  const handleRedo = useCallback(() => {
    flushPendingTextHistory();
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      const nextIndex = historyIndexRef.current + 1;
      historyIndexRef.current = nextIndex;
      const snapshot = historyStackRef.current[nextIndex];
      if (snapshot) {
        restoreSnapshot(snapshot);
      }
      updateUndoRedoState();
    }
  }, [flushPendingTextHistory, restoreSnapshot, updateUndoRedoState]);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y / Cmd+Z / Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (
        (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, isReadOnly]);

  // Setup Canvas Layer over Paper Page
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const paper = paperContainerRef.current;
    if (!canvas || !paper) return;

    const rect = paper.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(Math.max(950, paper.scrollHeight || 0, paper.offsetHeight || 0));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (initializedNoteIdRef.current !== note.id) {
      initializedNoteIdRef.current = note.id;
      historyStackRef.current = [];
      historyIndexRef.current = -1;

      const createInitialSnapshot = (canvasData: ImageData | null) => {
        const initialSnapshot: HistorySnapshot = {
          title: note.title,
          content: note.content,
          tasks: note.tasks || [],
          canvasData,
        };
        historyStackRef.current = [initialSnapshot];
        historyIndexRef.current = 0;
        updateUndoRedoState();
      };

      if (note.drawings && note.drawings.length > 0 && note.drawings[0].dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0);
          const initialData = ctx.getImageData(0, 0, width, height);
          createInitialSnapshot(initialData);
        };
        img.src = note.drawings[0].dataUrl;
      } else {
        ctx.clearRect(0, 0, width, height);
        const initialData = ctx.getImageData(0, 0, width, height);
        createInitialSnapshot(initialData);
      }
    } else if (
      historyIndexRef.current >= 0 &&
      historyStackRef.current[historyIndexRef.current] &&
      historyStackRef.current[historyIndexRef.current].canvasData
    ) {
      ctx.putImageData(historyStackRef.current[historyIndexRef.current].canvasData!, 0, 0);
    }
  }, [note.id, note.title, note.content, note.tasks, note.drawings, updateUndoRedoState]);

  useEffect(() => {
    setupCanvas();
    const paper = paperContainerRef.current;
    if (!paper) return;

    const observer = new ResizeObserver(() => {
      setupCanvas();
    });
    observer.observe(paper);

    window.addEventListener('resize', setupCanvas);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setupCanvas);
    };
  }, [setupCanvas]);

  // Pointer drawing handlers for S-Pen / Mouse
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = zoomScale / 100;
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const startPointerDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (toolMode === 'text' || isReadOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const { x, y } = getCanvasCoords(e);

    // If selection eraser OR lasso tool mode
    if ((toolMode === 'eraser' && eraserMode === 'selection') || toolMode === 'lasso') {
      canvasSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setSelectionStart({ x, y });
      setSelectionCurrent({ x, y });
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (toolMode === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserWidth;
    } else if (toolMode === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = highlighterColor + '60'; // 35% opacity
      ctx.lineWidth = highlighterWidth;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penWidth;
    }
  };

  const movePointerDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || toolMode === 'text' || isReadOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    // Selection eraser or lasso mode
    if ((toolMode === 'eraser' && eraserMode === 'selection') || toolMode === 'lasso') {
      if (!canvasSnapshotRef.current || !selectionStart) return;
      setSelectionCurrent({ x, y });

      // Restore clean canvas state before rendering box preview
      ctx.putImageData(canvasSnapshotRef.current, 0, 0);

      // Draw dashed selection rectangle preview
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#0381FE';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(3, 129, 254, 0.15)';

      const minX = Math.min(selectionStart.x, x);
      const minY = Math.min(selectionStart.y, y);
      const width = Math.abs(x - selectionStart.x);
      const height = Math.abs(y - selectionStart.y);

      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);
      ctx.restore();
      return;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopPointerDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
    setIsDrawing(false);

    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if ((toolMode === 'eraser' && eraserMode === 'selection') || toolMode === 'lasso') {
          if (canvasSnapshotRef.current && selectionStart && selectionCurrent) {
            // First restore clean canvas without dashed preview
            ctx.putImageData(canvasSnapshotRef.current, 0, 0);

            const minX = Math.min(selectionStart.x, selectionCurrent.x);
            const minY = Math.min(selectionStart.y, selectionCurrent.y);
            const width = Math.abs(selectionCurrent.x - selectionStart.x);
            const height = Math.abs(selectionCurrent.y - selectionStart.y);

            // Erase selected area if valid size
            if (width > 2 && height > 2) {
              ctx.clearRect(minX, minY, width, height);
            }
          }
          canvasSnapshotRef.current = null;
          setSelectionStart(null);
          setSelectionCurrent(null);
        }
      }
    }

    saveCanvasState();
  };

  // PDF File Upload Handler
  const handlePDFUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const pdfAttachment: PdfAttachment = {
          id: 'pdf-' + Date.now(),
          name: file.name,
          dataUrl: base64,
          sizeBytes: file.size,
          createdAt: new Date().toISOString(),
        };
        const updatedPdfs = [...(note.pdfAttachments || []), pdfAttachment];
        handleFieldChange({ pdfAttachments: updatedPdfs });
      };
      reader.readAsDataURL(file);
      setIsInsertMenuOpen(false);
    }
  };

  // Migration effect: extract base64 images embedded in note.content into note.images array
  useEffect(() => {
    if (note.content && (note.content.includes('![') || note.content.includes('data:image/'))) {
      const extractedImages: ImageAttachment[] = [...(note.images || [])];
      let hasExtracted = false;

      // Match markdown images like ![filename](data:image...)
      const regex = /!\[(.*?)\]\((data:image\/[a-zA-Z]+;base64,[^\)]+)\)/g;
      let match;
      while ((match = regex.exec(note.content)) !== null) {
        const name = match[1] || 'Inserted Image';
        const dataUrl = match[2];
        if (!extractedImages.some((img) => img.dataUrl === dataUrl)) {
          extractedImages.push({
            id: 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name,
            dataUrl,
            createdAt: new Date().toISOString(),
          });
          hasExtracted = true;
        }
      }

      // Also clean orphan ![filename] without valid url or leftover base64 strings
      const cleanedContent = note.content
        .replace(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g, '')
        .replace(/!\[.*?\]/g, '')
        .replace(/data:image\/[a-zA-Z]+;base64,[^\s]+/g, '')
        .trim();

      if (hasExtracted || cleanedContent !== note.content) {
        handleFieldChange({
          images: extractedImages,
          content: cleanedContent,
        });
      }
    }
  }, [note.id]);

  // Image Insert Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgUrl = event.target?.result as string;
        const newImg: ImageAttachment = {
          id: 'img-' + Date.now(),
          name: file.name,
          dataUrl: imgUrl,
          createdAt: new Date().toISOString(),
        };
        const updatedImages = [...(note.images || []), newImg];
        const cleanedContent = note.content
          .replace(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g, '')
          .replace(/!\[.*?\]/g, '')
          .replace(/data:image\/[a-zA-Z]+;base64,[^\s]+/g, '')
          .trim();

        handleFieldChange({
          images: updatedImages,
          content: cleanedContent,
        });
      };
      reader.readAsDataURL(file);
      setIsInsertMenuOpen(false);
    }
  };

  const handleDeleteImage = (id: string) => {
    if (note.images) {
      handleFieldChange({ images: note.images.filter((img) => img.id !== id) });
    }
  };

  // Audio Recording handler
  const handleAddAudio = (rec: AudioRecording) => {
    handleFieldChange({ audioRecordings: [...note.audioRecordings, rec] });
  };

  const handleDeleteAudio = (id: string) => {
    handleFieldChange({ audioRecordings: note.audioRecordings.filter(a => a.id !== id) });
  };

  // Export note to text / json
  const handleExportText = () => {
    const textData = `標題: ${note.title}\n建立時間: ${new Date(note.createdAt).toLocaleString()}\n\n${note.content}`;
    const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Paper styling class helper
  const paperBgClass =
    note.paperStyle === 'dark'
      ? 'bg-white dark:bg-[#18181A] text-slate-900 dark:text-white border-slate-300 dark:border-[#333338]'
      : note.paperStyle === 'lines'
      ? 'bg-[#222225] text-slate-900 dark:text-white border-slate-300 dark:border-[#333338] bg-[linear-gradient(to_bottom,#333338_1px,transparent_1px)] bg-[size:100%_28px]'
      : note.paperStyle === 'grid'
      ? 'bg-[#222225] text-slate-900 dark:text-white border-slate-300 dark:border-[#333338] bg-[linear-gradient(to_right,#333338_1px,transparent_1px),linear-gradient(to_bottom,#333338_1px,transparent_1px)] bg-[size:20px_20px]'
      : 'bg-[#222225] text-slate-900 dark:text-white border-slate-300 dark:border-[#333338] shadow-2xl'; // Dark gray paper sheet with white text

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#0B0B0C] flex flex-col overflow-hidden select-none">
      {/* Hidden inputs for PDF & Images */}
      <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePDFUpload} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {/* Top Header Bar - Samsung Notes PC Header */}
      <header className="h-14 px-4 bg-white dark:bg-[#1F1F22] border-b border-slate-200 dark:border-[#2C2C30] flex items-center justify-between shrink-0 text-slate-900 dark:text-white z-40">
        {/* Left: Back Button & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToGallery}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-xs font-bold text-slate-900 dark:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回圖庫</span>
          </button>

          <input
            type="text"
            value={note.title}
            disabled={isReadOnly}
            onChange={(e) => handleFieldChange({ title: e.target.value })}
            placeholder="請輸入筆記標題..."
            className="text-base font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none truncate max-w-xs sm:max-w-md"
          />

          {/* Interactive Folder Selection Dropdown */}
          <div className="relative inline-block">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-[#2E2E33] hover:bg-slate-200 dark:bg-[#38383F] text-slate-200 hover:text-slate-900 dark:text-white transition-all cursor-pointer border border-[#3A3A42] focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              title="變更資料夾"
            >
              <Folder className="w-3.5 h-3.5 text-[#0381FE]" />
              <span>{note.folder || '未分類'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isFolderMenuOpen && (
              <div className="absolute left-0 top-9 w-52 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-2 shadow-2xl z-50 text-xs animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-slate-500 dark:text-[#A0A0A0] px-2.5 py-1.5 flex items-center justify-between border-b border-slate-200 dark:border-[#2C2C30] mb-1">
                  <span>選擇資料夾</span>
                  <button
                    type="button"
                    onClick={() => setIsFolderMenuOpen(false)}
                    className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white p-0.5 rounded-lg hover:bg-slate-200 dark:bg-[#2C2C30]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 py-1 scrollbar-thin">
                  {availableFolders.map((fName) => {
                    const isSelected = (note.folder || '未分類') === fName;
                    return (
                      <button
                        key={fName}
                        type="button"
                        onClick={() => {
                          handleFieldChange({ folder: fName });
                          setIsFolderMenuOpen(false);
                          setIsAddingFolder(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors text-left ${
                          isSelected
                            ? 'bg-[#0381FE]/20 text-[#0381FE] font-bold'
                            : 'text-slate-300 hover:bg-slate-200 dark:bg-[#2C2C30] hover:text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0381FE]' : 'text-slate-400'}`} />
                          <span className="truncate">{fName}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0381FE] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Add New Folder inside Menu */}
                <div className="pt-1 mt-1 border-t border-slate-200 dark:border-[#2C2C30]">
                  {!isAddingFolder ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingFolder(true)}
                      className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[#0381FE] hover:bg-[#0381FE]/10 font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增資料夾...</span>
                    </button>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = newFolderNameInput.trim();
                        if (trimmed) {
                          if (onCreateFolder) {
                            onCreateFolder(trimmed);
                          }
                          handleFieldChange({ folder: trimmed });
                          setNewFolderNameInput('');
                          setIsAddingFolder(false);
                          setIsFolderMenuOpen(false);
                        }
                      }}
                      className="flex items-center gap-1 px-1 py-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newFolderNameInput}
                        onChange={(e) => setNewFolderNameInput(e.target.value)}
                        placeholder="資料夾名稱"
                        className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-[#333338] rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#0381FE]"
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-[#0381FE] text-white text-xs font-bold rounded-lg shrink-0"
                      >
                        確定
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Read/Edit Mode Toggle (🔒 閱讀模式 / ✍️ 編輯模式) */}
          <button
            type="button"
            onClick={() => setIsReadOnly(!isReadOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isReadOnly
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-[#0381FE]/20 text-[#0381FE] border border-[#0381FE]/40'
            }`}
          >
            {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isReadOnly ? '閱讀模式' : '編輯模式'}</span>
          </button>

          {/* Insert (+ 插入) Dropdown */}
          {!isReadOnly && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-xs font-bold text-slate-900 dark:text-white transition-colors"
              >
                <Plus className="w-4 h-4 text-[#0381FE]" />
                <span>插入</span>
              </button>

              {isInsertMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-2 shadow-2xl z-50 text-xs space-y-1">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-200 dark:bg-[#2C2C30] hover:text-slate-900 dark:text-white"
                  >
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    插入圖片
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-200 dark:bg-[#2C2C30] hover:text-slate-900 dark:text-white"
                  >
                    <FileUp className="w-4 h-4 text-rose-400" />
                    插入 PDF 文件
                  </button>
                  <button
                    onClick={() => {
                      setToolMode('pen');
                      setIsInsertMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-200 dark:bg-[#2C2C30] hover:text-slate-900 dark:text-white"
                  >
                    <PenTool className="w-4 h-4 text-purple-400" />
                    手寫 / S-Pen 畫布
                  </button>
                  <button
                    onClick={() => {
                      setIsInsertMenuOpen(false);
                      voiceRecorderRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-200 dark:bg-[#2C2C30] hover:text-slate-900 dark:text-white"
                  >
                    <Mic className="w-4 h-4 text-emerald-400" />
                    語音備忘錄錄音
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Export / Share */}
          <button
            type="button"
            onClick={handleExportText}
            className="p-2 rounded-xl text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
            title="匯出筆記內文 (.txt)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
            title="移至回收桶"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Editing Stage */}
      <div className="flex-1 relative overflow-auto bg-[#F8F9FA] dark:bg-[#0B0B0C] flex justify-center items-start p-6 no-scrollbar">
        {/* Central Vertical Paper Sheet Canvas Container */}
        <div
          ref={paperContainerRef}
          style={{ transform: `scale(${zoomScale / 100})`, transformOrigin: 'top center' }}
          className={`relative w-full max-w-4xl min-h-[950px] h-auto rounded-3xl p-8 md:p-12 shadow-2xl transition-transform duration-200 flex flex-col ${paperBgClass}`}
        >
          {/* Paper Canvas Interaction Layer for S-Pen */}
          <canvas
            ref={canvasRef}
            onPointerDown={startPointerDraw}
            onPointerMove={movePointerDraw}
            onPointerUp={stopPointerDraw}
            onPointerCancel={stopPointerDraw}
            className={`absolute inset-0 z-20 rounded-3xl ${
              toolMode !== 'text' && !isReadOnly ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
          />

          {/* Paper Content Layer */}
          <div className="relative z-10 space-y-6 w-full h-auto">
            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {note.tags.map((t) => (
                <span key={t} className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-[#2E2E33] text-slate-200 border border-slate-300 dark:border-[#3A3A40] font-semibold">
                  #{t}
                </span>
              ))}
            </div>

            {/* Interactive Checkbox / Todo List Section (Placed at top above content) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1D] border border-slate-300 dark:border-[#333338] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-[#0381FE]" />
                  <span>待辦事項</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({(note.tasks || []).filter((t) => t.completed).length}/{(note.tasks || []).length})
                  </span>
                </h4>
              </div>

              {/* Task Items */}
              {note.tasks && note.tasks.length > 0 ? (
                <div className="space-y-1.5">
                  {note.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-2 group py-1 border-b border-slate-200 dark:border-[#26262A] last:border-none">
                      <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer text-slate-200 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          disabled={isReadOnly}
                          checked={task.completed}
                          onChange={() => {
                            const updated = note.tasks.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t));
                            handleFieldChange({ tasks: updated });
                          }}
                          className="w-4 h-4 rounded border-[#3A3A42] text-[#0381FE] focus:ring-0 cursor-pointer accent-[#0381FE]"
                        />
                        <span className={`truncate text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.text}
                        </span>
                      </label>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
                          title="刪除待辦事項"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-0.5">
                  尚無待辦事項，在下方輸入即可新增
                </div>
              )}

              {/* Add Task Input Form */}
              {!isReadOnly && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddTask();
                  }}
                  className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-[#26262A]"
                >
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="新增待辦事項... (按 Enter 新增)"
                    className="flex-1 bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-[#333338] rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-[#0381FE] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newTaskInput.trim()}
                    className="px-3 py-1.5 rounded-xl bg-[#0381FE] hover:bg-[#026AD4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增</span>
                  </button>
                </form>
              )}
            </div>

            {/* Note Rich Content Textarea */}
            <textarea
              ref={textareaRef}
              value={note.content}
              disabled={isReadOnly}
              onChange={(e) => handleFieldChange({ content: e.target.value })}
              onInput={adjustTextareaHeight}
              placeholder="開始在此處輸入筆記內文，或使用右側 S-Pen 工具列直接手寫繪圖..."
              className="w-full min-h-[300px] bg-transparent focus:outline-none leading-relaxed text-sm md:text-base font-sans resize-none overflow-hidden text-slate-900 dark:text-white placeholder-slate-400 whitespace-pre-wrap break-words break-all"
            />

            {/* Inserted Images Viewer List */}
            {note.images && note.images.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-300 dark:border-[#333338]">
                <h4 className="text-xs font-bold text-[#0381FE] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  已插入圖片 ({note.images.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {note.images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-2xl bg-white dark:bg-[#1A1A1D] border border-slate-300 dark:border-[#333338] p-3 flex flex-col items-center"
                    >
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 text-slate-300 hover:text-rose-400 hover:bg-black transition-colors z-30"
                          title="刪除圖片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <img
                        src={img.dataUrl}
                        alt={img.name}
                        className="max-h-64 object-contain rounded-xl border border-slate-300 dark:border-[#333338] mb-2"
                      />
                      <span className="text-[11px] font-semibold text-slate-300 truncate max-w-full">
                        {img.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Attachments Viewer List */}
            {note.pdfAttachments && note.pdfAttachments.length > 0 && (
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                  <FileUp className="w-4 h-4" />
                  已附加 PDF 文件 ({note.pdfAttachments.length})
                </h4>
                {note.pdfAttachments.map((pdf) => (
                  <div key={pdf.id} className="p-4 rounded-2xl bg-white dark:bg-[#1A1A1D] border border-slate-300 dark:border-[#333338] flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                      <span className="truncate">{pdf.name}</span>
                      <a href={pdf.dataUrl} download={pdf.name} className="px-3 py-1 rounded-xl bg-rose-500 text-white text-[10px]">
                        下載 PDF
                      </a>
                    </div>
                    {/* Embedded PDF iframe / viewer */}
                    <iframe src={pdf.dataUrl} title={pdf.name} className="w-full h-80 rounded-xl border border-slate-300 dark:border-[#333338] bg-white" />
                  </div>
                ))}
              </div>
            )}

            {/* Voice Recorder Module */}
            <div ref={voiceRecorderRef} className="pt-4 border-t border-slate-300 dark:border-[#333338]">
              <VoiceRecorder
                recordings={note.audioRecordings}
                onAddRecording={handleAddAudio}
                onDeleteRecording={handleDeleteAudio}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Zoom Controller (- 100% +) at Bottom Right */}
      <div className="fixed bottom-6 right-24 z-40 bg-white dark:bg-[#1F1F22]/90 backdrop-blur-md border border-slate-300 dark:border-[#333338] rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 text-slate-900 dark:text-white text-xs font-bold">
        <button
          onClick={() => setZoomScale(Math.max(50, zoomScale - 10))}
          className="p-1 hover:bg-slate-200 dark:bg-[#2C2C30] rounded-md text-slate-300"
          title="縮小"
        >
          -
        </button>
        <span className="w-12 text-center text-[#0381FE]">{zoomScale}%</span>
        <button
          onClick={() => setZoomScale(Math.min(200, zoomScale + 10))}
          className="p-1 hover:bg-slate-200 dark:bg-[#2C2C30] rounded-md text-slate-300"
          title="放大"
        >
          +
        </button>
        <button
          onClick={() => setZoomScale(100)}
          className="text-[10px] text-slate-400 hover:text-slate-900 dark:text-white px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#2C2C30]"
        >
          重設
        </button>
      </div>

      {/* Right Floating Vertical Toolbar (S-Pen / Tools) */}
      {!isReadOnly && (
        <RightFloatingToolbar
          activeToolMode={toolMode}
          onSelectToolMode={setToolMode}
          penColor={penColor}
          onPenColorChange={setPenColor}
          penWidth={penWidth}
          onPenWidthChange={setPenWidth}
          highlighterColor={highlighterColor}
          onHighlighterColorChange={setHighlighterColor}
          highlighterWidth={highlighterWidth}
          onHighlighterWidthChange={setHighlighterWidth}
          eraserMode={eraserMode}
          onEraserModeChange={setEraserMode}
          eraserWidth={eraserWidth}
          onEraserWidthChange={setEraserWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      )}

      {/* Delete Note Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <h3>移至回收桶</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              確定要將「<span className="text-slate-900 dark:text-white font-semibold">{note.title || '無標題筆記'}</span>」移至回收桶嗎？
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(note.id);
                  setIsDeleteModalOpen(false);
                  onBackToGallery();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
