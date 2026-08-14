import React, { useState, useRef, useEffect } from 'react';
import { 
  Keyboard, 
  PenTool, 
  Highlighter, 
  Eraser, 
  Lasso, 
  RotateCcw, 
  RotateCw, 
  BoxSelect,
  Mic,
  CheckSquare,
} from 'lucide-react';
import { SPenToolMode } from '../types';

interface RightFloatingToolbarProps {
  activeToolMode: SPenToolMode;
  onSelectToolMode: (mode: SPenToolMode) => void;
  penColor: string;
  onPenColorChange: (color: string) => void;
  penWidth: number;
  onPenWidthChange: (width: number) => void;
  highlighterColor: string;
  onHighlighterColorChange: (color: string) => void;
  highlighterWidth: number;
  onHighlighterWidthChange: (width: number) => void;
  eraserMode?: 'stroke' | 'selection';
  onEraserModeChange?: (mode: 'stroke' | 'selection') => void;
  eraserWidth?: number;
  onEraserWidthChange?: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  voiceRecorderNode?: React.ReactNode;
  todoNode?: React.ReactNode;
}

const PRESET_PEN_COLORS = [
  '#FFFFFF', // White for dark mode paper
  '#000000', // Black for light paper
  '#0381FE', // Samsung Blue
  '#EF4444', // Red
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
];

const PRESET_HIGHLIGHTER_COLORS = [
  '#FDE047', // Yellow
  '#86EFAC', // Light Green
  '#93C5FD', // Light Blue
  '#FCA5A5', // Light Red
  '#F0ABFC', // Light Pink
];

export const RightFloatingToolbar: React.FC<RightFloatingToolbarProps> = ({
  activeToolMode,
  onSelectToolMode,
  penColor,
  onPenColorChange,
  penWidth,
  onPenWidthChange,
  highlighterColor,
  onHighlighterColorChange,
  highlighterWidth,
  onHighlighterWidthChange,
  eraserMode = 'stroke',
  onEraserModeChange,
  eraserWidth = 30,
  onEraserWidthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  voiceRecorderNode,
  todoNode,
}) => {
  const [activePopover, setActivePopover] = useState<'pen' | 'highlighter' | 'eraser' | 'mic' | 'todo' | 'none'>('none');
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActivePopover('none');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePopover = (target: 'pen' | 'highlighter' | 'eraser' | 'mic' | 'todo') => {
    if (activePopover === target) {
      setActivePopover('none');
    } else {
      setActivePopover(target);
    }
  };

  return (
    <div ref={toolbarRef} className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-2 select-none">
      {/* Pen Options Popover */}
      {activePopover === 'pen' && (
        <div className="absolute right-16 top-10 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-4 shadow-2xl w-64 text-slate-900 dark:text-white z-50 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 dark:text-[#A0A0A0] mb-3 flex items-center justify-between">
            <span>S-Pen 筆觸設定</span>
            <button
              onClick={() => setActivePopover('none')}
              className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              ✕
            </button>
          </div>

          {/* Color Swatches */}
          <div className="space-y-2 mb-4">
            <label className="text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">墨水顏色</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_PEN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPenColorChange(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border border-slate-600 transition-transform ${
                    penColor === c ? 'ring-2 ring-[#0381FE] scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
              <input
                type="color"
                value={penColor}
                onChange={(e) => onPenColorChange(e.target.value)}
                className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer p-0"
                title="自訂顏色"
              />
            </div>
          </div>

          {/* Stroke Width */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">
              <span>筆跡粗細</span>
              <span>{penWidth}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={penWidth}
              onChange={(e) => onPenWidthChange(Number(e.target.value))}
              className="w-full accent-[#0381FE] bg-slate-200 dark:bg-[#2E2E33] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Highlighter Options Popover */}
      {activePopover === 'highlighter' && (
        <div className="absolute right-16 top-24 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-4 shadow-2xl w-64 text-slate-900 dark:text-white z-50 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 dark:text-[#A0A0A0] mb-3 flex items-center justify-between">
            <span>螢光筆設定</span>
            <button
              onClick={() => setActivePopover('none')}
              className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-4">
            <label className="text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">螢光標記色彩</label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_HIGHLIGHTER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onHighlighterColorChange(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border border-slate-600 transition-transform ${
                    highlighterColor === c ? 'ring-2 ring-[#0381FE] scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">
              <span>標記寬度</span>
              <span>{highlighterWidth}px</span>
            </div>
            <input
              type="range"
              min="6"
              max="40"
              value={highlighterWidth}
              onChange={(e) => onHighlighterWidthChange(Number(e.target.value))}
              className="w-full accent-[#0381FE] bg-slate-200 dark:bg-[#2E2E33] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Eraser Options Popover */}
      {activePopover === 'eraser' && (
        <div className="absolute right-16 top-36 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-4 shadow-2xl w-64 text-slate-900 dark:text-white z-50 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 dark:text-[#A0A0A0] mb-3 flex items-center justify-between">
            <span>橡皮擦設定</span>
            <button
              onClick={() => setActivePopover('none')}
              className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              ✕
            </button>
          </div>

          {/* Eraser Mode Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">擦除模式</label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-50 dark:bg-[#121214] p-1 rounded-xl border border-slate-200 dark:border-[#2C2C30]">
              <button
                type="button"
                onClick={() => onEraserModeChange?.('stroke')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  eraserMode === 'stroke'
                    ? 'bg-[#0381FE] text-white shadow'
                    : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                筆觸擦除
              </button>
              <button
                type="button"
                onClick={() => onEraserModeChange?.('selection')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                  eraserMode === 'selection'
                    ? 'bg-[#0381FE] text-white shadow'
                    : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white'
                }`}
              >
                <BoxSelect className="w-3.5 h-3.5" />
                選取刪除
              </button>
            </div>
          </div>

          {/* Eraser Width */}
          {eraserMode === 'stroke' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#A0A0A0] font-semibold">
                <span>橡皮擦大小</span>
                <span>{eraserWidth}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={eraserWidth}
                onChange={(e) => onEraserWidthChange?.(Number(e.target.value))}
                className="w-full accent-[#0381FE] bg-slate-200 dark:bg-[#2E2E33] rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
      )}

      {/* Voice Recorder Popover */}
      {activePopover === 'mic' && voiceRecorderNode && (
        <div className="absolute right-16 top-48 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-4 shadow-2xl w-80 text-slate-900 dark:text-white z-50 animate-in fade-in duration-150">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setActivePopover('none')}
              className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white p-1"
            >
              ✕
            </button>
          </div>
          {voiceRecorderNode}
        </div>
      )}

      {/* Todo List Popover */}
      {activePopover === 'todo' && todoNode && (
        <div className="absolute right-16 top-48 bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] rounded-2xl p-4 shadow-2xl w-80 text-slate-900 dark:text-white z-50 animate-in fade-in duration-150">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setActivePopover('none')}
              className="text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white p-1"
            >
              ✕
            </button>
          </div>
          {todoNode}
        </div>
      )}

      {/* Main Floating Tool Container */}
      <div className="bg-white dark:bg-[#1F1F22]/90 backdrop-blur-xl border border-slate-300 dark:border-[#333338] rounded-2xl p-1.5 shadow-2xl flex flex-col items-center gap-1.5 text-slate-900 dark:text-white">
        {/* Keyboard / Text Mode */}
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('text');
            setActivePopover('none');
          }}
          className={`p-3 rounded-xl transition-all ${
            activeToolMode === 'text'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title="文字鍵盤模式 (Text Mode)"
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* S-Pen / Pen */}
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('pen');
            togglePopover('pen');
          }}
          className={`p-3 rounded-xl transition-all relative ${
            activeToolMode === 'pen'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title="S-Pen 鋼筆 (點擊調整顏色與粗細)"
        >
          <PenTool className="w-5 h-5" />
          <span
            style={{ backgroundColor: penColor }}
            className="w-2 h-2 rounded-full absolute bottom-1 right-1 border border-[#1F1F22]"
          />
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('highlighter');
            togglePopover('highlighter');
          }}
          className={`p-3 rounded-xl transition-all relative ${
            activeToolMode === 'highlighter'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title="螢光筆 (點擊調整色彩)"
        >
          <Highlighter className="w-5 h-5" />
          <span
            style={{ backgroundColor: highlighterColor }}
            className="w-2 h-2 rounded-full absolute bottom-1 right-1 border border-[#1F1F22]"
          />
        </button>

        {/* Eraser */}
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('eraser');
            togglePopover('eraser');
          }}
          className={`p-3 rounded-xl transition-all relative ${
            activeToolMode === 'eraser'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title={`橡皮擦 (${eraserMode === 'selection' ? '選取刪除' : '筆觸擦除'}) - 點擊展開設定`}
        >
          {eraserMode === 'selection' ? <BoxSelect className="w-5 h-5" /> : <Eraser className="w-5 h-5" />}
          {eraserMode === 'selection' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute bottom-1 right-1 border border-[#1F1F22]" />
          )}
        </button>

        {/* Lasso */}
        <button
          type="button"
          onClick={() => {
            onSelectToolMode('lasso');
            setActivePopover('none');
          }}
          className={`p-3 rounded-xl transition-all ${
            activeToolMode === 'lasso'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title="套索選擇 (Lasso)"
        >
          <Lasso className="w-5 h-5" />
        </button>

        {/* Todo Toggle */}
        {todoNode && (
          <button
            type="button"
            onClick={() => togglePopover('todo')}
            className={`p-3 rounded-xl transition-all relative ${
              activePopover === 'todo'
                ? 'bg-[#0381FE] text-white shadow-md'
                : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
            }`}
            title="待辦事項清單"
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        )}

        {/* Voice Recorder */}
        <button
          type="button"
          onClick={() => {
            togglePopover('mic');
          }}
          className={`p-3 rounded-xl transition-all relative ${
            activePopover === 'mic'
              ? 'bg-[#0381FE] text-white shadow-md'
              : 'text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]'
          }`}
          title="語音筆記錄音機"
        >
          <Mic className="w-5 h-5" />
        </button>

        <hr className="w-6 border-slate-300 dark:border-[#333338] my-0.5" />

        {/* Undo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2.5 rounded-xl text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="撤銷 (Undo)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2.5 rounded-xl text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="重做 (Redo)"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

