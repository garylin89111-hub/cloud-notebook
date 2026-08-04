import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  PenTool, 
  Eraser, 
  Highlighter, 
  RotateCcw, 
  RotateCw, 
  Trash2, 
  Check, 
  Download, 
  Palette,
  Sliders
} from 'lucide-react';

interface DrawingCanvasProps {
  initialDataUrl?: string;
  onSaveDrawing: (dataUrl: string) => void;
  onCancel?: () => void;
}

const PRESET_COLORS = [
  '#000000',
  '#0381FE', // One UI Samsung Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#FFFFFF', // White
];

const STROKE_WIDTHS = [2, 4, 8, 14, 24];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  initialDataUrl,
  onSaveDrawing,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [mode, setMode] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [color, setColor] = useState('#0381FE');
  const [lineWidth, setLineWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Resize canvas to parent size while preserving context
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(380, rect.height || 450);

    // Store existing canvas content if any
    const ctx = canvas.getContext('2d');
    let tempImage: HTMLImageElement | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempImage = new Image();
      tempImage.src = canvas.toDataURL();
    }

    canvas.width = width;
    canvas.height = height;

    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      if (initialDataUrl && history.length === 0) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          saveHistoryState();
        };
        img.src = initialDataUrl;
      } else if (tempImage) {
        tempImage.onload = () => {
          ctx.drawImage(tempImage!, 0, 0);
        };
      } else {
        saveHistoryState();
      }
    }
  }, [initialDataUrl]);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imgData);

    // Limit stack size to 25 steps
    if (newHistory.length > 25) newHistory.shift();

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && history[prevIndex]) {
        ctx.putImageData(history[prevIndex], 0, 0);
        setHistoryIndex(prevIndex);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx && history[nextIndex]) {
        ctx.putImageData(history[nextIndex], 0, 0);
        setHistoryIndex(nextIndex);
      }
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryState();
  };

  // Drawing event handlers using Pointer Events for stylus & touch precision
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (mode === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = lineWidth * 2.5;
    } else if (mode === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color + '40'; // 25% opacity
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
    saveHistoryState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing(dataUrl);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800">
      {/* Canvas Header Control Bar - One UI Style */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        {/* Tools Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('pen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'pen'
                ? 'bg-[#0381FE] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            鋼筆
          </button>
          <button
            type="button"
            onClick={() => setMode('highlighter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'highlighter'
                ? 'bg-[#0381FE] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            螢光筆
          </button>
          <button
            type="button"
            onClick={() => setMode('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'eraser'
                ? 'bg-[#0381FE] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            橡皮擦
          </button>
        </div>

        {/* Undo / Redo / Clear Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="復原 Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            title="重做 Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
            title="全清除 Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Save / Cancel Action Buttons */}
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              取消
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-semibold bg-[#0381FE] hover:bg-blue-600 text-white shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            插入筆記
          </button>
        </div>
      </div>

      {/* Stroke Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-2.5 px-1">
        {/* Colors Palette */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-slate-400 mr-1" />
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                if (mode === 'eraser') setMode('pen');
              }}
              style={{ backgroundColor: c }}
              className={`w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 transition-transform ${
                color === c && mode !== 'eraser' ? 'ring-2 ring-[#0381FE] ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'hover:scale-105'
              }`}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              if (mode === 'eraser') setMode('pen');
            }}
            className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent p-0 overflow-hidden"
            title="自訂顏色"
          />
        </div>

        {/* Stroke Width Selector */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">筆觸:</span>
          {STROKE_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setLineWidth(w)}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                lineWidth === w ? 'bg-[#0381FE] text-white shadow-xs font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <div
                style={{ width: `${Math.min(w + 2, 14)}px`, height: `${Math.min(w + 2, 14)}px` }}
                className={`rounded-full ${lineWidth === w ? 'bg-white' : 'bg-slate-600 dark:bg-slate-300'}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Main Drawing Area */}
      <div 
        ref={containerRef}
        className="flex-1 w-full min-h-[360px] bg-white rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-full block"
        />
      </div>
    </div>
  );
};
