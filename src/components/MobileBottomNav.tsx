import React from 'react';
import { 
  FileText, 
  PenTool, 
  Mic, 
  Star, 
  Settings, 
  Layers 
} from 'lucide-react';

interface MobileBottomNavProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onOpenSettings: () => void;
  onOpenChangelog: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenSettings,
  onOpenChangelog,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectCategory('all')}
        className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
          selectedCategory === 'all'
            ? 'text-[#0381FE] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <FileText className="w-5 h-5" />
        <span className="text-[10px]">筆記</span>
      </button>

      <button
        onClick={() => onSelectCategory('drawings')}
        className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
          selectedCategory === 'drawings'
            ? 'text-[#0381FE] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <PenTool className="w-5 h-5" />
        <span className="text-[10px]">繪圖</span>
      </button>

      <button
        onClick={() => onSelectCategory('audio')}
        className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
          selectedCategory === 'audio'
            ? 'text-[#0381FE] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span className="text-[10px]">語音</span>
      </button>

      <button
        onClick={() => onSelectCategory('favorites')}
        className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
          selectedCategory === 'favorites'
            ? 'text-[#0381FE] font-bold scale-105'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Star className="w-5 h-5" />
        <span className="text-[10px]">最愛</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 p-2 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">設定</span>
      </button>
    </div>
  );
};
