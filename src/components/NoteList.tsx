import React, { useState } from 'react';
import { 
  Search, 
  Pin, 
  Star, 
  Trash2, 
  PenTool, 
  Mic, 
  CheckSquare, 
  Calendar, 
  Filter,
  Plus,
  Folder
} from 'lucide-react';
import { Note, NoteFolder } from '../types';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onCreateNewNote: (type?: 'text' | 'drawing' | 'voice') => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  selectedCategory: string;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNewNote,
  onTogglePin,
  onToggleFavorite,
  onDeleteNote,
  selectedCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned' | 'drawings' | 'audio'>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');

  // Filter notes based on category, search, filter type
  const filteredNotes = notes
    .filter((note) => {
      // Category / Folder filter
      if (selectedCategory === 'trash') return note.isDeleted;
      if (note.isDeleted) return false;

      if (selectedCategory === 'favorites') if (!note.isFavorite) return false;
      if (selectedCategory === 'pinned') if (!note.isPinned) return false;
      if (selectedCategory === 'drawings') if (note.drawings.length === 0) return false;
      if (selectedCategory === 'audio') if (note.audioRecordings.length === 0) return false;
      if (['工作', '個人', '靈感', '隨記', '待辦事項'].includes(selectedCategory)) {
        if (note.folder !== selectedCategory) return false;
      }

      // Filter pills
      if (filterType === 'pinned' && !note.isPinned) return false;
      if (filterType === 'drawings' && note.drawings.length === 0) return false;
      if (filterType === 'audio' && note.audioRecordings.length === 0) return false;

      // Search Query
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
      // Pinned notes always on top unless viewing trash
      if (selectedCategory !== 'trash') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 md:p-4 select-none shadow-2xs">
      {/* Header Search Bar - Bento Card Search Box */}
      <div className="space-y-3 mb-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋筆記、標籤或內容..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-xs font-medium placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0381FE] shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bento-card ${
                filterType === 'all'
                  ? 'bg-[#0381FE] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              全部 ({notes.filter(n => !n.isDeleted).length})
            </button>

            <button
              onClick={() => setFilterType('pinned')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bento-card ${
                filterType === 'pinned'
                  ? 'bg-[#0381FE] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <Pin className="w-3 h-3" />
              釘選
            </button>

            <button
              onClick={() => setFilterType('drawings')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bento-card ${
                filterType === 'drawings'
                  ? 'bg-[#0381FE] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <PenTool className="w-3 h-3" />
              繪圖
            </button>

            <button
              onClick={() => setFilterType('audio')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all bento-card ${
                filterType === 'audio'
                  ? 'bg-[#0381FE] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <Mic className="w-3 h-3" />
              語音
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 rounded-xl px-2 py-1 focus:outline-none shrink-0"
          >
            <option value="updatedAt">依更新時間</option>
            <option value="createdAt">依建立時間</option>
            <option value="title">依標題排序</option>
          </select>
        </div>
      </div>

      {/* Note Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 no-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Folder className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">目前沒有符合的筆記</p>
            <p className="text-[11px] text-slate-400 mt-1">點擊右下方 (+ 新增筆記) 快速建立</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isActive = activeNoteId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group bento-card p-3.5 rounded-2xl cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-blue-50/40 dark:bg-blue-950/30 border-[#0381FE] ring-2 ring-[#0381FE]/30 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/50'
                }`}
              >
                {/* Top Title Row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {note.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-[#0381FE] shrink-0 fill-[#0381FE]" />
                    )}
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {note.title || '無標題筆記'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => onToggleFavorite(note.id, e)}
                      className={`p-1 rounded-lg transition-colors ${
                        note.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                      }`}
                      title="我的最愛"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => onTogglePin(note.id, e)}
                      className={`p-1 rounded-lg transition-colors ${
                        note.isPinned ? 'text-[#0381FE]' : 'text-slate-300 dark:text-slate-600 hover:text-[#0381FE]'
                      }`}
                      title="釘選筆記"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Snippet */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                  {note.content.replace(/[#*`>-]/g, '') || '尚無內文...'}
                </p>

                {/* Attachments & Folder Meta Row */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-200/40 dark:border-slate-700/40 pt-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-600/60">
                      {note.folder}
                    </span>

                    {note.drawings.length > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-semibold">
                        <PenTool className="w-2.5 h-2.5" />
                        {note.drawings.length}
                      </span>
                    )}

                    {note.audioRecordings.length > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 font-semibold">
                        <Mic className="w-2.5 h-2.5" />
                        {note.audioRecordings.length}
                      </span>
                    )}

                    {note.tasks.length > 0 && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 font-semibold">
                        <CheckSquare className="w-2.5 h-2.5" />
                        {note.tasks.filter(t => t.completed).length}/{note.tasks.length}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0">{formatDate(note.updatedAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button (FAB) - Bento Style Button */}
      <div className="pt-2 flex justify-end shrink-0">
        <button
          onClick={() => onCreateNewNote('text')}
          className="oneui-button flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0381FE] hover:bg-blue-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          新增筆記
        </button>
      </div>
    </div>
  );
};
