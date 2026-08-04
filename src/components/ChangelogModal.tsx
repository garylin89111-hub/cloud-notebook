import React from 'react';
import { 
  X, 
  Sparkles, 
  Layers, 
  GitCommit, 
  CheckCircle2, 
  Cloud, 
  PenTool, 
  Mic, 
  Smartphone, 
  Zap,
  Lock,
  FileUp
} from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1F1F22] w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-300 dark:border-[#333338] flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#2C2C30] bg-[#171719]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0381FE]/20 text-[#0381FE]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cloud Notebook 架構與更新記錄
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A0A0A0]">
                Cloud Notebook Architecture & Specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Section 1: Visual Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-[#A0A0A0] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#0381FE]" />
              Samsung Notes PC 雙畫面架構
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
                <div className="flex items-center gap-2 font-bold text-xs text-[#0381FE] mb-2">
                  <Smartphone className="w-4 h-4" />
                  1. 圖庫主頁 (Gallery Home)
                </div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
                  可收折側邊欄 (≡ 開啟/關閉 Icon 模式)、大網格卡片圖庫預覽、建立筆記、匯入 PDF 檔。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
                <div className="flex items-center gap-2 font-bold text-xs text-purple-400 mb-2">
                  <PenTool className="w-4 h-4" />
                  2. 獨立全螢幕編輯頁
                </div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
                  中央直向 Samsung 筆記紙張 canvas (- 100% + 縮放控制器) 與右側懸浮 S-Pen 垂直工具列。
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-2">
                  <Cloud className="w-4 h-4" />
                  3. IndexedDB & Drive
                </div>
                <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
                  IndexedDB 本地持久化快取 + Google Drive API v3 同步至 <code className="bg-slate-50 dark:bg-[#121214] px-1.5 py-0.5 rounded text-[10px] text-slate-900 dark:text-white">CloudNotes_WebData</code>。
                </p>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-[#2C2C30]" />

          {/* Section 2: Release Versions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-[#A0A0A0] uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-[#0381FE]" />
              版本功能發行規格 (Release Specifications)
            </h4>

            <div className="relative pl-6 border-l-2 border-[#0381FE] space-y-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0381FE] text-white flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3" />
              </div>

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0381FE] text-white">
                  v2.0.0 (Samsung Notes PC 經典重構版)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#A0A0A0]">2026-07</span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-[#A0A0A0] list-disc list-inside pt-1">
                <li><b>PC 暗黑模式標準配色</b>：純黑底背景 <code className="text-slate-900 dark:text-white">#0B0B0C</code>，卡片側欄 <code className="text-slate-900 dark:text-white">#1F1F22</code>/ <code className="text-slate-900 dark:text-white">#262629</code>。</li>
                <li><b>雙畫面切換架構</b>：非三欄 dashboard，點擊筆記卡片立即全螢幕進入獨立編輯頁。</li>
                <li><b>S-Pen 懸浮垂直工具列</b>：文字 mode、鋼筆/圓珠筆、螢光筆標記、橡皮擦、套索選取。</li>
                <li><b>紙張 100% 縮放控制器</b>：中央直向 Samsung 筆記紙張，支援 `+ 100% -` 縮放與紙張樣式。</li>
                <li><b>IndexedDB 本地儲存 API</b>：無縫儲存大檔繪圖、語音與 PDF 附件。</li>
                <li><b>PIN 密碼筆記鎖定</b>：加密保護隱私筆記。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#2C2C30] bg-[#171719] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-white font-bold text-xs transition-colors shadow-md"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
