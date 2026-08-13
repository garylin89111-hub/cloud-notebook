import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  FileText, 
  Star, 
  Lock, 
  Trash2, 
  Folder, 
  FolderPlus, 
  Settings, 
  HardDrive, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { GoogleUser, SyncSettings } from '../types';
import { FOLDER_COLOR_PRESETS, DEFAULT_FOLDER_COLORS } from '../services/storage';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  folders: string[];
  folderColors?: Record<string, string>;
  onChangeFolderColor?: (folderName: string, color: string) => void;
  onCreateFolder: (folderName: string, color?: string) => void;
  onDeleteFolder?: (folderName: string) => void;
  user: GoogleUser | null;
  settings: SyncSettings;
  onOpenSettings: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onOpenChangelog: () => void;
  noteCounts: Record<string, number>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  onToggleExpand,
  selectedCategory,
  onSelectCategory,
  folders,
  folderColors = DEFAULT_FOLDER_COLORS,
  onChangeFolderColor,
  onCreateFolder,
  onDeleteFolder,
  user,
  settings,
  onOpenSettings,
  onConnectGoogle,
  onDisconnectGoogle,
  onOpenChangelog,
  noteCounts,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#0381FE');
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [activeColorPickerFolder, setActiveColorPickerFolder] = useState<string | null>(null);
  const createFolderContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isCreatingFolder && !activeColorPickerFolder) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        createFolderContainerRef.current &&
        !createFolderContainerRef.current.contains(event.target as Node)
      ) {
        setIsCreatingFolder(false);
        setNewFolderName('');
        setActiveColorPickerFolder(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCreatingFolder(false);
        setNewFolderName('');
        setActiveColorPickerFolder(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreatingFolder, activeColorPickerFolder]);

  const handleAddFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const MAIN_MENU = [
    { id: 'all', label: '所有筆記', icon: FileText },
    { id: 'favorites', label: '我的最愛', icon: Star },
    { id: 'locked', label: '鎖定筆記', icon: Lock },
    { id: 'trash', label: '回收桶', icon: Trash2 },
  ];

  return (
    <aside
      className={`h-full bg-white dark:bg-[#1F1F22] border-r border-slate-200 dark:border-[#2C2C30] flex flex-col justify-between select-none transition-all duration-300 z-30 ${
        isExpanded ? 'w-60' : 'w-16'
      }`}
    >
      {/* Top Header: Sidebar Toggle ≡ & App Brand */}
      <div className="flex flex-col shrink-0">
        <div className={`h-14 flex items-center px-3 border-b border-slate-200 dark:border-[#2C2C30] ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-2 rounded-xl text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] transition-colors"
              title={isExpanded ? '收折選單 (≡)' : '展開選單 (≡)'}
            >
              <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>

            {isExpanded && (
              <span className="font-bold text-sm text-slate-900 dark:text-white tracking-wide truncate">
                Cloud Notebook
              </span>
            )}
          </div>
        </div>

        {/* Sync Mode Badge Indicator */}
        <div className="p-2">
          <div
            onClick={user ? onDisconnectGoogle : onConnectGoogle}
            className={`cursor-pointer rounded-xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338] p-2 hover:bg-slate-200 dark:hover:bg-[#2E2E33] transition-colors ${
              isExpanded ? 'flex items-center gap-2.5' : 'flex justify-center'
            }`}
            title={user ? `點擊登出 (${user.name})` : '點擊登入 Google Drive'}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${user ? 'bg-[#0381FE]/20 text-[#0381FE]' : 'bg-slate-700/50 text-slate-300'}`}>
              {user ? <CheckCircle2 className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {user ? user.name : 'IndexedDB 本地模式'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-[#A0A0A0] truncate">
                  {user ? '點擊登出' : '點擊登入 Google Drive'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 no-scrollbar">
        {/* Category List */}
        <div className="space-y-1">
          {MAIN_MENU.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedCategory === item.id;
            const count = noteCounts[item.id] || 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCategory(item.id)}
                className={`w-full flex items-center ${
                  isExpanded ? 'justify-between px-3' : 'justify-center px-0'
                } py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#0381FE] text-white shadow-sm'
                    : 'text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-[#2A2A2E]'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-900 dark:text-white' : ''}`} />
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </div>

                {isExpanded && count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-[#2E2E33] text-slate-500 dark:text-[#A0A0A0]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Folders List */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#2C2C30] space-y-1" ref={createFolderContainerRef}>
          {isExpanded && (
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-[#A0A0A0] uppercase tracking-wider">
                資料夾 (Folders)
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="p-1 rounded-md text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]"
                title="新增資料夾"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form to add custom folder */}
          {isExpanded && isCreatingFolder && (
            <form onSubmit={handleAddFolderSubmit} className="p-2 bg-white dark:bg-[#18181A] rounded-xl border border-slate-200 dark:border-[#2C2C30] space-y-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="資料夾名稱..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#121214] border border-[#0381FE] text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-[#0381FE] hover:bg-[#026ed9] text-white text-[11px] font-bold shrink-0 transition-colors"
                >
                  新增
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-200 dark:border-[#26262A]">
                <span className="text-[10px] text-slate-400 font-medium">色彩標示:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {FOLDER_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        newFolderColor === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#18181A]' : 'opacity-70 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </form>
          )}

          {folders.map((folderName) => {
            const isSelected = selectedCategory === folderName;
            const count = noteCounts[folderName] || 0;
            const folderColor = folderColors[folderName] || '#0381FE';
            const isColorPickerOpen = activeColorPickerFolder === folderName;

            return (
              <div key={folderName} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectCategory(folderName)}
                  className={`w-full flex items-center ${
                    isExpanded ? 'justify-between pl-3 pr-14' : 'justify-center px-0'
                  } py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-slate-200 dark:bg-[#2A2A30] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-[#2A2A2E]'
                  }`}
                  style={{
                    borderLeft: isSelected ? `3px solid ${folderColor}` : '3px solid transparent',
                  }}
                  title={`${folderName} (資料夾)`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder 
                      className="w-4 h-4 shrink-0 transition-all group-hover:scale-110" 
                      style={{ 
                        color: folderColor, 
                        fill: isSelected ? `${folderColor}44` : 'none' 
                      }} 
                    />
                    {isExpanded && (
                      <span className="truncate" style={{ color: isSelected ? 'white' : undefined }}>
                        {folderName}
                      </span>
                    )}
                  </div>

                  {isExpanded && count > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium mr-1">
                      {count}
                    </span>
                  )}
                </button>

                {/* Expanded Actions: Color Swatch & Delete */}
                {isExpanded && (
                  <div className="absolute right-2 flex items-center gap-1 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColorPickerFolder(isColorPickerOpen ? null : folderName);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#38383F] opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`修改「${folderName}」顏色`}
                    >
                      <span
                        className="block w-3 h-3 rounded-full border border-white/20 transition-transform hover:scale-110"
                        style={{ backgroundColor: folderColor }}
                      />
                    </button>

                    {onDeleteFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete(folderName);
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-200 dark:bg-[#38383F] opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`刪除「${folderName}」資料夾`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Color Swatch Popover */}
                {isExpanded && isColorPickerOpen && (
                  <div 
                    className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-[#1A1A1D] border border-slate-300 dark:border-[#3A3A40] rounded-xl p-2 shadow-2xl animate-in fade-in duration-100 min-w-[160px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-[10px] text-slate-400 font-bold mb-1.5 px-1">選擇資料夾色彩:</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {FOLDER_COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            onChangeFolderColor?.(folderName, color);
                            setActiveColorPickerFolder(null);
                          }}
                          className={`w-5 h-5 rounded-full transition-transform ${
                            folderColor === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#1A1A1D]' : 'hover:scale-110 opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Folder Modal Confirmation */}
      {folderToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setFolderToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-[#1F1F22] border border-slate-200 dark:border-[#2C2C30] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <h3>刪除資料夾</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              確定要刪除「<span className="text-slate-900 dark:text-white font-semibold">{folderToDelete}</span>」資料夾嗎？此資料夾中的筆記將會自動重劃歸類至預設「個人」資料夾。
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteFolder?.(folderToDelete);
                  setFolderToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions: Theme & Settings */}
      <div className="p-2 border-t border-slate-200 dark:border-[#2C2C30] space-y-1 shrink-0">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3 gap-3' : 'justify-center px-0'
          } py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-[#2A2A2E] transition-colors`}
          title={isDarkMode ? '切換為亮色模式' : '切換為暗色模式'}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          {isExpanded && <span>{isDarkMode ? '亮色模式' : '暗色模式'}</span>}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center ${
            isExpanded ? 'justify-start px-3 gap-3' : 'justify-center px-0'
          } py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white hover:bg-slate-100 dark:bg-[#2A2A2E] transition-colors`}
          title="設定與雲端同步"
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          {isExpanded && <span>設定與雲端同步</span>}
        </button>
      </div>
    </aside>
  );
};
