import React, { useState } from 'react';
import { 
  Pin, 
  Star, 
  Lock, 
  FileUp, 
  PenTool, 
  Mic, 
  CheckSquare, 
  MoreVertical, 
  FileText,
  Trash2,
  Unlock,
  RotateCcw,
  Info,
  Check
} from 'lucide-react';
import { Note, GalleryViewMode } from '../types';

interface GalleryViewProps {
  notes: Note[];
  viewMode: GalleryViewMode;
  onSelectNote: (note: Note) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onToggleLock: (id: string, e: React.MouseEvent) => void;
  onToggleChecklist?: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onRestoreNote?: (id: string, e?: React.MouseEvent) => void;
  onCreateNote: () => void;
  isTrashView?: boolean;
  selectedNoteIds?: string[];
  onToggleSelectNote?: (id: string, e?: React.MouseEvent) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  notes,
  viewMode,
  onSelectNote,
  onTogglePin,
  onToggleFavorite,
  onToggleLock,
  onToggleChecklist,
  onDeleteNote,
  onRestoreNote,
  onCreateNote,
  isTrashView,
  selectedNoteIds = [],
  onToggleSelectNote,
}) => {
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
  const [noteInTrashSelected, setNoteInTrashSelected] = useState<Note | null>(null);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getTrashRemainingText = (deletedAt?: string, updatedAt?: string) => {
    const deleteTime = deletedAt ? new Date(deletedAt).getTime() : new Date(updatedAt || Date.now()).getTime();
    const expireTime = deleteTime + 3 * 24 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, expireTime - Date.now());
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    if (remainingHours >= 24) {
      const days = Math.ceil(remainingHours / 24);
      return `剩餘 ${days} 天`;
    }
    if (remainingHours > 0) {
      return `剩餘 ${remainingHours} 小時`;
    }
    return '即將清除';
  };

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-[#F8F9FA] dark:bg-[#0B0B0C]">
        <div className="w-20 h-20 rounded-3xl bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] flex items-center justify-center text-slate-500 mb-4 shadow-xl">
          <FileText className="w-10 h-10 text-[#0381FE]" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">沒有找到筆記</h3>
        <p className="text-xs text-slate-500 dark:text-[#A0A0A0] max-w-sm mb-6">
          目前這個資料夾或分類下尚未有任何筆記。點擊上方「建立筆記」或「匯入 PDF」開始使用！
        </p>
        <button
          type="button"
          onClick={onCreateNote}
          className="px-5 py-2.5 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-white font-bold text-xs shadow-lg transition-transform active:scale-95"
        >
          + 建立第一份筆記
        </button>
      </div>
    );
  }

  // Grid layout styles depending on viewMode
  const gridContainerStyle =
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5'
      : viewMode === 'small-grid'
      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4'
      : 'flex flex-col space-y-2.5';

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F8F9FA] dark:bg-[#0B0B0C] select-none no-scrollbar">
      {/* Trash View Info Banner */}
      {isTrashView && (
        <div className="mb-6 p-4 rounded-2xl bg-[#1D1B18] border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-relaxed">
              回收桶中的筆記將於 <strong className="text-amber-300">3 天後自動永久刪除</strong>。您可以還原筆記回到原資料夾，或手動點擊永久刪除。
            </span>
          </div>
        </div>
      )}

      <div className={gridContainerStyle}>
        {notes.map((note) => {
          const hasDrawing = note.drawings && note.drawings.length > 0;
          const hasPdf = note.pdfAttachments && note.pdfAttachments.length > 0;
          const hasAudio = note.audioRecordings && note.audioRecordings.length > 0;
          const hasTasks = Boolean(note.tasks && note.tasks.length > 0);

          // Extract image preview URL from note.images or note.content
          const imagePreview = (() => {
            if (note.images && note.images.length > 0) return note.images[0].dataUrl;
            if (note.content) {
              const match = note.content.match(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/);
              if (match && match[1]) return match[1];
            }
            return null;
          })();

          // Clean text content by stripping raw markdown images and base64 strings
          const cleanText = note.content
            ? note.content
                .replace(/!\[.*?\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g, '')
                .replace(/!\[.*?\]/g, '')
                .replace(/data:image\/[a-zA-Z]+;base64,[^\s]+/g, '')
                .replace(/[#*`>-]/g, '')
                .trim()
            : '';

          const isSelected = selectedNoteIds.includes(note.id);
          const inSelectionMode = selectedNoteIds.length > 0;

          const handleCardClick = (e: React.MouseEvent) => {
            if (inSelectionMode) {
              onToggleSelectNote?.(note.id, e);
            } else if (isTrashView) {
              setNoteInTrashSelected(note);
            } else {
              onSelectNote(note);
            }
          };

          if (viewMode === 'list') {
            // Samsung Notes List Item View Mode
            return (
              <div
                key={note.id}
                onClick={handleCardClick}
                className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#1D2B3A] border-2 border-[#0381FE]'
                    : 'bg-white dark:bg-[#1F1F22] hover:bg-slate-100 dark:bg-[#262629] border border-slate-200 dark:border-[#2C2C30]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Selection Check Circle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectNote?.(note.id, e);
                    }}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      isSelected || inSelectionMode
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 transition-opacity'
                    } ${
                      isSelected
                        ? 'bg-[#0381FE] text-white shadow-md'
                        : 'bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] border border-white/30 text-transparent'
                    }`}
                    title={isSelected ? '取消勾選' : '勾選筆記'}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-transparent" />
                    )}
                  </button>

                  {/* 📌 藍色圖釘 (手動選擇/切換) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(note.id, e);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      note.isPinned ? 'text-[#0381FE]' : 'text-slate-500 hover:text-[#0381FE] opacity-0 group-hover:opacity-100'
                    }`}
                    title={note.isPinned ? '取消釘選' : '釘選筆記'}
                  >
                    <Pin className={`w-4 h-4 ${note.isPinned ? 'text-[#0381FE] fill-[#0381FE]' : ''}`} />
                  </button>

                  {/* ☑️ 綠色打勾方框 (手動選擇/切換待辦清單) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleChecklist?.(note.id, e);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      hasTasks ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100'
                    }`}
                    title={hasTasks ? '待辦事項 (點擊管理)' : '新增待辦清單'}
                  >
                    <CheckSquare className={`w-4 h-4 ${hasTasks ? 'text-emerald-400' : ''}`} />
                  </button>

                  {/* 🔒 鎖定狀態 */}
                  {note.isLocked && <Lock className="w-4 h-4 text-amber-400 shrink-0" />}

                  {/* 🖊️ 紫色鋼筆 & 🎙️ 藍色麥克風 (保持原樣，有資料才自動顯示) */}
                  {hasDrawing && <PenTool className="w-4 h-4 text-purple-400 shrink-0" title="包含手繪" />}
                  {hasAudio && <Mic className="w-4 h-4 text-blue-400 shrink-0" title="包含錄音" />}
                  
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {note.isLocked ? '🔒 鎖定的筆記' : note.title || '無標題筆記'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-[#A0A0A0] truncate max-w-md">
                      {note.isLocked ? '請解鎖後檢視內文' : cleanText || '尚無內文...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {isTrashView ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                      {getTrashRemainingText(note.deletedAt, note.updatedAt)}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-200 dark:bg-[#2C2C30] text-slate-500 dark:text-[#A0A0A0]">
                      {note.folder}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 dark:text-[#A0A0A0]">{formatDate(note.updatedAt)}</span>

                  {isTrashView ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote?.(note.id, e);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#0381FE]/20 hover:bg-[#0381FE] text-[#0381FE] hover:text-white transition-colors"
                        title="還原至原資料夾"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>還原</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete({ id: note.id, title: note.title || '無標題筆記' });
                        }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="永久刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => onToggleFavorite(note.id, e)}
                        className="text-slate-500 dark:text-[#A0A0A0] hover:text-amber-400 p-1 rounded-md transition-colors"
                        title="我的最愛"
                      >
                        <Star className={`w-4 h-4 ${note.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onToggleLock(note.id, e)}
                        className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white p-1 rounded-md hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
                        title={note.isLocked ? '解鎖筆記' : '加密鎖定筆記'}
                      >
                        {note.isLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete({ id: note.id, title: note.title || '無標題筆記' });
                        }}
                        className="text-slate-500 dark:text-[#A0A0A0] hover:text-rose-400 hover:bg-rose-500/20 rounded-md p-1 transition-colors"
                        title="移至回收桶"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }

          const isSmallGrid = viewMode === 'small-grid';

          // Card View Mode (grid or small-grid)
          return (
            <div
              key={note.id}
              onClick={handleCardClick}
              className={`group relative flex flex-col rounded-2xl bg-white dark:bg-[#1F1F22] cursor-pointer overflow-hidden transition-all duration-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 ${
                isSelected
                  ? 'border-2 border-[#0381FE] ring-2 ring-[#0381FE]/30'
                  : 'border border-slate-200 dark:border-[#2C2C30] hover:border-[#0381FE]/50'
              }`}
            >
              {/* Card Preview Area */}
              <div className={`${isSmallGrid ? 'h-36 p-2.5' : 'h-48 p-3.5'} bg-slate-50 dark:bg-[#171719] border-b border-slate-200 dark:border-[#2C2C30] relative overflow-hidden flex flex-col justify-between`}>
                {/* Top-Left Group: Selection Circle Checkbox & Folder Badge */}
                <div className={`absolute ${isSmallGrid ? 'top-1.5 left-1.5' : 'top-2 left-2'} z-30 flex items-center gap-1.5 max-w-[70%]`}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectNote?.(note.id, e);
                    }}
                    className={`${isSmallGrid ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center shrink-0 transition-all focus:outline-none focus:ring-0 focus-visible:outline-none ${
                      isSelected || inSelectionMode
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 transition-opacity'
                    } ${
                      isSelected
                        ? 'bg-[#0381FE] text-white shadow-md ring-2 ring-[#0381FE]/40 scale-105'
                        : 'bg-black/60 hover:bg-black/80 text-slate-900 dark:text-white/60 border border-white/40 hover:border-[#0381FE] backdrop-blur-sm'
                    }`}
                    title={isSelected ? '取消勾選' : '勾選筆記'}
                  >
                    {isSelected ? (
                      <Check className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} stroke-[3]`} />
                    ) : (
                      <div className={`${isSmallGrid ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full border border-white/60`} />
                    )}
                  </button>

                  {!isTrashView && (
                    <span className={`px-2 py-0.5 rounded-md bg-[#F8F9FA] dark:bg-[#0B0B0C]/85 backdrop-blur-md text-slate-700 dark:text-slate-200 font-medium ${isSmallGrid ? 'text-[10px]' : 'text-[11px]'} border border-slate-200 dark:border-[#2C2C30] shadow-sm truncate`}>
                      {note.folder}
                    </span>
                  )}
                </div>

                {/* Attached Badges Pill Floating at top right (ONLY show selected/active ones) */}
                {(note.isPinned || hasTasks || hasDrawing || hasAudio) && (
                  <div className={`absolute ${isSmallGrid ? 'top-1.5 right-1.5 px-1.5 py-0.5 gap-1' : 'top-2 right-2 px-2 py-1 gap-1.5'} flex items-center bg-white dark:bg-[#0B0B0C]/85 backdrop-blur-md rounded-full border border-slate-200 dark:border-[#2C2C30] shadow-sm z-20`}>
                    {/* 📌 藍色圖釘 (有釘選才顯示) */}
                    {note.isPinned && (
                      <button
                        type="button"
                        onClick={(e) => onTogglePin(note.id, e)}
                        className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="取消釘選"
                      >
                        <Pin className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#0381FE] fill-[#0381FE]`} />
                      </button>
                    )}

                    {/* ☑️ 綠色打勾方框 (有待辦事項才顯示) */}
                    {hasTasks && (
                      <button
                        type="button"
                        onClick={(e) => onToggleChecklist?.(note.id, e)}
                        className="p-0.5 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="管理待辦事項"
                      >
                        <CheckSquare className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400`} />
                      </button>
                    )}

                    {/* 🖊️ 紫色鋼筆 (有手繪時顯示) */}
                    {hasDrawing && <PenTool className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-purple-400`} title="包含手繪" />}

                    {/* 🎙️ 藍色麥克風 (有錄音時顯示) */}
                    {hasAudio && <Mic className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-blue-400`} title="包含錄音" />}
                  </div>
                )}

                {/* Main Content Body Preview */}
                <div className="flex-1 mt-7 mb-1 overflow-hidden flex flex-col justify-center">
                  {note.isLocked ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                      <Lock className={`${isSmallGrid ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-2'} text-amber-400/80`} />
                      <span className={`${isSmallGrid ? 'text-[11px]' : 'text-xs'} font-bold text-slate-500 dark:text-[#A0A0A0]`}>已加密鎖定</span>
                    </div>
                  ) : hasDrawing ? (
                    /* Drawing Canvas Image Preview */
                    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-[#222225] p-1">
                      <img
                        src={note.drawings[0].dataUrl}
                        alt="Drawing Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : imagePreview ? (
                    /* Inserted Image Preview */
                    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-[#222225] p-1">
                      <img
                        src={imagePreview}
                        alt="Image Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : hasPdf ? (
                    /* PDF Document Badge Preview */
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-rose-950/20 rounded-lg border border-rose-900/40 text-rose-400">
                      <FileUp className={`${isSmallGrid ? 'w-6 h-6 mb-1' : 'w-8 h-8 mb-1.5'} text-rose-400`} />
                      <span className="text-xs font-bold truncate max-w-full">
                        {note.pdfAttachments![0].name}
                      </span>
                      <span className="text-[10px] text-rose-300/70 mt-0.5">PDF 文件</span>
                    </div>
                  ) : (
                    /* Text Content Preview Sheet */
                    <div className={`${isSmallGrid ? 'text-[11px] line-clamp-3' : 'text-xs line-clamp-4'} text-slate-500 dark:text-[#A0A0A0] leading-relaxed font-sans select-none whitespace-pre-wrap`}>
                      {cleanText || '無內容...'}
                    </div>
                  )}
                </div>

                {/* Title at Bottom of Card Preview Area (圖1 下方處) */}
                <div className="pt-1.5 border-t border-[#2A2A2E]/60 shrink-0">
                  <h3 className={`${isSmallGrid ? 'text-xs' : 'text-sm'} font-bold text-slate-900 dark:text-white truncate group-hover:text-[#0381FE] transition-colors`}>
                    {note.isLocked ? '🔒 鎖定的筆記' : note.title || '無標題筆記'}
                  </h3>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className={`${isSmallGrid ? 'p-2 py-1.5' : 'p-3 py-2'} flex items-center justify-between gap-2 bg-white dark:bg-[#1F1F22]`}>
                <div className={`flex items-center ${isSmallGrid ? 'gap-0.5' : 'gap-1'} shrink-0 opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {isTrashView ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestoreNote?.(note.id, e);
                        }}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-[#0381FE]/20 text-[#0381FE] transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="還原筆記"
                      >
                        <RotateCcw className={isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete({ id: note.id, title: note.title || '無標題筆記' });
                        }}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-rose-500/20 text-slate-500 dark:text-[#A0A0A0] hover:text-rose-400 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="永久刪除"
                      >
                        <Trash2 className={isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* 📌 藍色圖釘 */}
                      <button
                        type="button"
                        onClick={(e) => onTogglePin(note.id, e)}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-slate-200 dark:bg-[#2C2C30] text-slate-500 dark:text-[#A0A0A0] hover:text-[#0381FE] transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title={note.isPinned ? '取消釘選' : '釘選筆記'}
                      >
                        <Pin className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${note.isPinned ? 'text-[#0381FE] fill-[#0381FE]' : ''}`} />
                      </button>

                      {/* ☑️ 綠色打勾方框 */}
                      <button
                        type="button"
                        onClick={(e) => onToggleChecklist?.(note.id, e)}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-slate-200 dark:bg-[#2C2C30] text-slate-500 dark:text-[#A0A0A0] hover:text-emerald-400 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title={hasTasks ? '切換/管理待辦事項' : '開啟待辦清單'}
                      >
                        <CheckSquare className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${hasTasks ? 'text-emerald-400' : ''}`} />
                      </button>

                      {/* ⭐ 我的最愛 */}
                      <button
                        type="button"
                        onClick={(e) => onToggleFavorite(note.id, e)}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-slate-200 dark:bg-[#2C2C30] text-slate-500 dark:text-[#A0A0A0] hover:text-amber-400 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="我的最愛"
                      >
                        <Star className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${note.isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onToggleLock(note.id, e)}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-slate-200 dark:bg-[#2C2C30] text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title={note.isLocked ? '解鎖筆記' : '加密鎖定筆記'}
                      >
                        {note.isLocked ? <Lock className={`${isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-400`} /> : <Unlock className={isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNoteToDelete({ id: note.id, title: note.title || '無標題筆記' });
                        }}
                        className="p-0.5 sm:p-1 rounded-md hover:bg-rose-500/20 text-slate-500 dark:text-[#A0A0A0] hover:text-rose-400 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none"
                        title="移至回收桶"
                      >
                        <Trash2 className={isSmallGrid ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                      </button>
                    </>
                  )}
                </div>

                {/* Right: Timestamp */}
                <div className="text-[10px] text-slate-500 dark:text-[#A0A0A0] shrink-0 font-medium">
                  {isTrashView ? (
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300">
                      {getTrashRemainingText(note.deletedAt, note.updatedAt)}
                    </span>
                  ) : (
                    <span>{formatDate(note.updatedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trash Card Click Action Modal */}
      {noteInTrashSelected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setNoteInTrashSelected(null)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Info className="w-5 h-5" />
              <h3>回收桶中的筆記</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              「<span className="text-slate-900 dark:text-white font-semibold">{noteInTrashSelected.title || '無標題筆記'}</span>」目前處於回收桶。您要還原這份筆記還是永久刪除？
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteInTrashSelected(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = noteInTrashSelected;
                  setNoteInTrashSelected(null);
                  setNoteToDelete({ id: target.id, title: target.title || '無標題筆記' });
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 transition-colors"
              >
                永久刪除
              </button>
              <button
                type="button"
                onClick={(e) => {
                  onRestoreNote?.(noteInTrashSelected.id, e);
                  setNoteInTrashSelected(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0381FE] hover:bg-blue-600 text-white transition-colors"
              >
                還原筆記
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Note Modal Confirmation */}
      {noteToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setNoteToDelete(null)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <h3>{isTrashView ? '永久刪除筆記' : '移至回收桶'}</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              {isTrashView ? (
                <>
                  確定要永久刪除「<span className="text-slate-900 dark:text-white font-semibold">{noteToDelete.title}</span>」嗎？<span className="text-rose-400 font-semibold">此操作無法復原。</span>
                </>
              ) : (
                <>
                  確定要將「<span className="text-slate-900 dark:text-white font-semibold">{noteToDelete.title}</span>」筆記移至回收桶嗎？可在回收桶保留 3 天並自由還原。
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={(e) => {
                  onDeleteNote(noteToDelete.id, e);
                  setNoteToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                {isTrashView ? '確定永久刪除' : '確定刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
