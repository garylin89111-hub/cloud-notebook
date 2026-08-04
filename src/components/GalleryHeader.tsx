import React, { useRef, useState } from 'react';
import { 
  Plus, 
  FileUp, 
  Grid, 
  LayoutGrid, 
  List as ListIcon, 
  Search, 
  ArrowUpDown,
  FileText,
  Trash2,
  ChevronLeft,
  FolderInput,
  FolderMinus,
  Lock,
  Share2,
  RotateCcw,
  CheckCircle2,
  Menu
} from 'lucide-react';
import { GalleryViewMode } from '../types';

interface GalleryHeaderProps {
  title: string;
  count: number;
  onToggleSidebar?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: GalleryViewMode;
  onViewModeChange: (mode: GalleryViewMode) => void;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  onSortChange: (sort: 'updatedAt' | 'createdAt' | 'title') => void;
  onCreateNote: () => void;
  onImportPDF: (file: File) => void;
  isTrashView?: boolean;
  onEmptyTrash?: () => void;
  // Selection Mode Props
  selectedCount?: number;
  isAllSelected?: boolean;
  onClearSelection?: () => void;
  onSelectAllToggle?: () => void;
  onBatchMoveClick?: () => void;
  onBatchRemoveFromFolderClick?: () => void;
  onBatchLockClick?: () => void;
  onBatchShareClick?: () => void;
  onBatchDeleteClick?: () => void;
  onBatchRestoreClick?: () => void;
}

export const GalleryHeader: React.FC<GalleryHeaderProps> = ({
  title,
  count,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onCreateNote,
  onImportPDF,
  isTrashView,
  onEmptyTrash,
  selectedCount = 0,
  isAllSelected = false,
  onClearSelection,
  onSelectAllToggle,
  onBatchMoveClick,
  onBatchRemoveFromFolderClick,
  onBatchLockClick,
  onBatchShareClick,
  onBatchDeleteClick,
  onBatchRestoreClick,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        onImportPDF(file);
      } else {
        alert('請選擇有效的 PDF 檔案 (.pdf)');
      }
    }
  };

  // Render Samsung Notes Selection Top Bar when 1 or more items are selected
  if (selectedCount > 0) {
    return (
      <header className="h-16 px-3 sm:px-6 bg-[#F8F9FA] dark:bg-[#0B0B0C] border-b border-[#1F1F22] flex items-center justify-between shrink-0 select-none gap-2 sm:gap-4 overflow-hidden animate-in fade-in duration-150">
        {/* Left: Chevron & count */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-slate-900 dark:text-white hover:bg-white dark:bg-[#1F1F22] transition-colors shrink-0"
            title="取消選取"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap truncate">
            已選擇 {selectedCount} 個
          </span>
        </div>

        {/* Right Function Action Bar */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-bold text-slate-900 dark:text-white overflow-x-auto no-scrollbar shrink-0 max-w-full py-1">
          {/* 移動 (Move) */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBatchMoveClick}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border border-slate-200 dark:border-[#2C2C30] text-slate-200 hover:text-slate-900 dark:text-white transition-all active:scale-95"
              title="移動至其他資料夾"
            >
              <FolderInput className="w-4 h-4 text-blue-400" />
              <span>移動</span>
            </button>
          )}

          {/* 取消加入資料夾 (Remove from folder) */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBatchRemoveFromFolderClick}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border border-slate-200 dark:border-[#2C2C30] text-amber-300 hover:text-amber-200 transition-all active:scale-95"
              title="將選取筆記移出資料夾 (設為未分類)"
            >
              <FolderMinus className="w-4 h-4 text-amber-400" />
              <span>取消加入資料夾</span>
            </button>
          )}

          {/* 鎖定 (Lock) */}
          {!isTrashView && (
            <button
              type="button"
              onClick={onBatchLockClick}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border border-slate-200 dark:border-[#2C2C30] text-slate-200 hover:text-slate-900 dark:text-white transition-all active:scale-95"
              title="批次加密/解鎖"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>鎖定</span>
            </button>
          )}

          {/* 分享 (Share) */}
          <button
            type="button"
            onClick={onBatchShareClick}
            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border border-slate-200 dark:border-[#2C2C30] text-slate-200 hover:text-slate-900 dark:text-white transition-all active:scale-95"
            title="分享或匯出選取項目"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>分享</span>
          </button>

          {/* 還原 (Restore in Trash) */}
          {isTrashView && (
            <button
              type="button"
              onClick={onBatchRestoreClick}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border border-slate-200 dark:border-[#2C2C30] text-slate-200 hover:text-slate-900 dark:text-white transition-all active:scale-95"
              title="將選取筆記還原至原資料夾"
            >
              <RotateCcw className="w-4 h-4 text-sky-400" />
              <span>還原</span>
            </button>
          )}

          {/* 刪除 (Delete) */}
          <button
            type="button"
            onClick={onBatchDeleteClick}
            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all active:scale-95"
            title={isTrashView ? '永久刪除筆記' : '移至回收桶'}
          >
            <Trash2 className="w-4 h-4" />
            <span>{isTrashView ? '永久刪除' : '刪除'}</span>
          </button>

          {/* 全選 (Select All) */}
          <button
            type="button"
            onClick={onSelectAllToggle}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all active:scale-95 ${
              isAllSelected
                ? 'bg-[#0381FE] border-[#0381FE] text-white shadow-md'
                : 'bg-white dark:bg-[#1F1F22] hover:bg-slate-200 dark:bg-[#2C2C30] border-slate-200 dark:border-[#2C2C30] text-slate-200'
            }`}
            title={isAllSelected ? '取消全選' : '全選目前項目'}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAllSelected ? '取消全選' : '全選'}</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 px-3 sm:px-6 bg-[#F8F9FA] dark:bg-[#0B0B0C] border-b border-[#1F1F22] flex items-center justify-between shrink-0 select-none gap-2 sm:gap-4 overflow-hidden">
      {/* Hidden PDF File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Left Title & Note Count */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] transition-colors lg:hidden shrink-0"
            title="開啟選單 (≡)"
          >
            <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
        )}
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 whitespace-nowrap truncate shrink-0">
          {title}
        </h1>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        {/* Search Input Box */}
        <div className="relative hidden lg:block w-40 xl:w-56 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#A0A0A0]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋所有筆記..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] text-xs font-medium text-slate-900 dark:text-white placeholder-[#A0A0A0] focus:outline-none focus:border-[#0381FE] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Switcher Toggle (檢視) */}
        <div className="flex items-center bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-xl p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'grid' ? 'bg-[#0381FE] text-white' : 'text-slate-500 dark:text-[#A0A0A0] hover:text-white'
            }`}
            title="大網格檢視"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('small-grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'small-grid' ? 'bg-[#0381FE] text-white' : 'text-slate-500 dark:text-[#A0A0A0] hover:text-white'
            }`}
            title="小網格檢視"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              viewMode === 'list' ? 'bg-[#0381FE] text-white' : 'text-slate-500 dark:text-[#A0A0A0] hover:text-white'
            }`}
            title="列表檢視"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-xl px-2 py-1 shrink-0 whitespace-nowrap">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-[#A0A0A0]" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="text-xs font-semibold bg-transparent text-slate-500 dark:text-[#A0A0A0] focus:outline-none cursor-pointer"
          >
            <option value="updatedAt">修改日期</option>
            <option value="createdAt">建立日期</option>
            <option value="title">標題排序</option>
          </select>
        </div>

        {/* If in Trash view, show Empty Trash button */}
        {isTrashView ? (
          <button
            type="button"
            onClick={() => setIsEmptyConfirmOpen(true)}
            disabled={count === 0}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              count > 0
                ? 'bg-rose-600/90 hover:bg-rose-600 text-white shadow-md'
                : 'bg-white dark:bg-[#1F1F22] text-slate-500 border border-slate-200 dark:border-[#2C2C30] cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>清空回收桶</span>
          </button>
        ) : (
          <>
            {/* Import PDF Button (匯入 PDF) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-[#1F1F22] hover:bg-slate-100 dark:bg-[#2A2A2E] border border-slate-200 dark:border-[#2C2C30] text-xs font-bold text-slate-900 dark:text-white transition-all active:scale-95"
              title="匯入 PDF 筆記文件"
            >
              <FileUp className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">匯入 PDF</span>
            </button>

            {/* Create Note Button (建立筆記) */}
            <button
              type="button"
              onClick={onCreateNote}
              className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-xs font-bold text-white shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>建立筆記</span>
            </button>
          </>
        )}
      </div>

      {/* Empty Trash Confirmation Modal */}
      {isEmptyConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEmptyConfirmOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <h3>清空回收桶</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              確定要永久刪除回收桶中的所有筆記嗎？<span className="text-rose-400 font-semibold">此操作無法復原。</span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash?.();
                  setIsEmptyConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                確定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
