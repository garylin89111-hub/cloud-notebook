import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, 
  PenTool, 
  Mic, 
  Pin, 
  Star, 
  Trash2, 
  Plus, 
  Tag, 
  Folder, 
  Clock, 
  Save, 
  ChevronLeft,
  Bold,
  Italic,
  Heading1,
  Heading2,
  ListTodo,
  Code,
  Quote,
  Check,
  X
} from 'lucide-react';
import { Note, NoteFolder, TaskItem, DrawingData, AudioRecording } from '../types';
import { DrawingCanvas } from './DrawingCanvas';
import { VoiceRecorder } from './VoiceRecorder';

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  onBackToMobileList?: () => void;
  autoSaveStatus: 'saved' | 'saving' | 'idle';
}

const FOLDERS: string[] = ['未分類', '工作', '個人', '靈感', '隨記', '待辦事項'];

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  onRestoreNote,
  onBackToMobileList,
  autoSaveStatus,
}) => {
  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center shadow-2xs">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-[#0381FE] flex items-center justify-center mb-3">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">未選取任何筆記</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          請從左側列表選擇一份筆記進行檢視與編輯，或點擊「新增筆記」按鈕。
        </p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'text' | 'drawing' | 'voice'>('text');
  const [tagInput, setTagInput] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Debounced update helper
  const handleFieldChange = (fields: Partial<Note>) => {
    const updated: Note = {
      ...note,
      ...fields,
      updatedAt: new Date().toISOString(),
    };
    onUpdateNote(updated);
  };

  // Add tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!note.tags.includes(newTag)) {
        handleFieldChange({ tags: [...note.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleFieldChange({ tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  // Task list items
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: TaskItem = {
      id: 'task-' + Date.now(),
      text: newTaskText.trim(),
      completed: false,
    };
    handleFieldChange({ tasks: [...note.tasks, newTask] });
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = note.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    handleFieldChange({ tasks: updatedTasks });
  };

  const handleDeleteTask = (taskId: string) => {
    handleFieldChange({ tasks: note.tasks.filter((t) => t.id !== taskId) });
  };

  // Text formatting inserts
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || '文字';
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = text.substring(0, start) + replacement + text.substring(end);
    handleFieldChange({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  // Drawing callback
  const handleSaveDrawing = (dataUrl: string) => {
    const newDrawing: DrawingData = {
      id: 'draw-' + Date.now(),
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    handleFieldChange({ drawings: [...note.drawings, newDrawing] });
    setActiveTab('text');
  };

  const handleDeleteDrawing = (id: string) => {
    handleFieldChange({ drawings: note.drawings.filter((d) => d.id !== id) });
  };

  // Voice recording callbacks
  const handleAddAudio = (rec: AudioRecording) => {
    handleFieldChange({ audioRecordings: [...note.audioRecordings, rec] });
  };

  const handleDeleteAudio = (id: string) => {
    handleFieldChange({
      audioRecordings: note.audioRecordings.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
      {/* Top Bar - Bento Navigation Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {onBackToMobileList && (
            <button
              type="button"
              onClick={onBackToMobileList}
              className="md:hidden p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Folder Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs">
            <Folder className="w-3.5 h-3.5 text-[#0381FE]" />
            <select
              value={note.folder}
              onChange={(e) => handleFieldChange({ folder: e.target.value as NoteFolder })}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {Array.from(new Set([note.folder || '未分類', ...FOLDERS])).filter(Boolean).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Auto Save Status Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 font-medium ml-2">
            <Clock className="w-3 h-3" />
            {autoSaveStatus === 'saving' ? (
              <span className="text-amber-500 font-semibold animate-pulse">自動儲存中...</span>
            ) : (
              <span>已自動儲存 ({new Date(note.updatedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })})</span>
            )}
          </div>
        </div>

        {/* Pin, Favorite & Trash Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleFieldChange({ isPinned: !note.isPinned })}
            className={`p-2 rounded-2xl transition-all ${
              note.isPinned ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0381FE]' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="釘選筆記"
          >
            <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-[#0381FE]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleFieldChange({ isFavorite: !note.isFavorite })}
            className={`p-2 rounded-2xl transition-all ${
              note.isFavorite ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="我的最愛"
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-500' : ''}`} />
          </button>

          {note.isDeleted ? (
            <button
              type="button"
              onClick={() => onRestoreNote && onRestoreNote(note.id)}
              className="p-2 rounded-2xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
              title="還原筆記"
            >
              還原
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDeleteNote(note.id)}
              className="p-2 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              title="移至垃圾桶"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Main Mode Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/30 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'text'
              ? 'bg-[#0381FE] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          文字內容
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drawing')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'drawing'
              ? 'bg-[#0381FE] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          手寫繪圖 ({note.drawings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'voice'
              ? 'bg-[#0381FE] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          語音錄音 ({note.audioRecordings.length})
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* Title Input */}
        <div>
          <input
            type="text"
            value={note.title}
            onChange={(e) => handleFieldChange({ title: e.target.value })}
            placeholder="請輸入筆記標題..."
            className="w-full text-xl md:text-2xl font-bold bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Tags Chips Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-slate-400 hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="+ 新增標籤 (按 Enter 確定)"
            className="px-2 py-1 bg-transparent text-xs text-slate-600 dark:text-slate-300 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <hr className="border-slate-100 dark:border-slate-800 my-2" />

        {/* Tab 1: Text & Markdown Editor */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Rich Markdown Formatting Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl overflow-x-auto">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="粗體"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="斜體"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('# ')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="標題 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="標題 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="引用區塊"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('```\n', '\n```')}
                className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
                title="程式碼區塊"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            {/* Content Textarea */}
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={(e) => handleFieldChange({ content: e.target.value })}
              placeholder="開始撰寫筆記心性、會議點滴或靈感隨記..."
              className="w-full min-h-[220px] bg-transparent text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none resize-y font-sans text-sm"
            />

            {/* Interactive Checkbox Todo Section */}
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-[#0381FE]" />
                待辦與執行清單 Checkboxes ({note.tasks.filter(t => t.completed).length}/{note.tasks.length})
              </h4>

              <div className="space-y-2">
                {note.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="w-4 h-4 rounded-md text-[#0381FE] focus:ring-[#0381FE] cursor-pointer"
                      />
                      <span
                        className={`text-xs ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-300 hover:text-rose-500 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Task */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  placeholder="+ 新增待辦事項..."
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="px-3 py-1.5 rounded-xl bg-[#0381FE] text-white text-xs font-semibold hover:bg-blue-600 transition-all"
                >
                  新增
                </button>
              </div>
            </div>

            {/* Gallery of Attached Drawings */}
            {note.drawings.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-purple-500" />
                  手寫繪圖圖集 ({note.drawings.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {note.drawings.map((draw) => (
                    <div
                      key={draw.id}
                      className="group relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs"
                    >
                      <img src={draw.dataUrl} alt="Drawing" className="w-full h-28 object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => handleDeleteDrawing(draw.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-xl bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="刪除圖檔"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Canvas Drawing */}
        {activeTab === 'drawing' && (
          <div className="h-[520px]">
            <DrawingCanvas onSaveDrawing={handleSaveDrawing} />
          </div>
        )}

        {/* Tab 3: Voice Recordings */}
        {activeTab === 'voice' && (
          <div>
            <VoiceRecorder
              recordings={note.audioRecordings}
              onAddRecording={handleAddAudio}
              onDeleteRecording={handleDeleteAudio}
            />
          </div>
        )}
      </div>
    </div>
  );
};
