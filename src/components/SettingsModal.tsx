import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  Check,
  HardDrive,
  Lock,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { SyncSettings, GoogleUser, Note } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSaveSettings: (newSettings: SyncSettings) => void;
  user: GoogleUser | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  onManualSync: () => void;
  isSyncing: boolean;
  notes: Note[];
  onImportBackup: (importedNotes: Note[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  user,
  onConnectGoogle,
  onDisconnectGoogle,
  onManualSync,
  isSyncing,
  notes,
  onImportBackup,
}) => {
  const [autoSync, setAutoSync] = useState(settings.isAutoSync);
  const [mode, setMode] = useState<'demo' | 'google_drive'>(settings.mode);
  const [securityPin, setSecurityPin] = useState(settings.securityPin || '000');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMode(settings.mode);
    setAutoSync(settings.isAutoSync);
  }, [settings.mode, settings.isAutoSync]);

  // Password Change State
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      googleClientId: '',
      googleApiKey: '',
      isAutoSync: autoSync,
      mode: mode,
      lastSyncedAt: settings.lastSyncedAt,
      securityPin: securityPin.trim() || '000',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    if (oldPinInput !== securityPin) {
      setPinMessage({ type: 'error', text: '目前密碼輸入錯誤' });
      return;
    }
    if (!newPinInput || newPinInput.trim().length === 0) {
      setPinMessage({ type: 'error', text: '請輸入新密碼' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ type: 'error', text: '兩次輸入的新密碼不一致' });
      return;
    }
    const updatedPin = newPinInput.trim();
    setSecurityPin(updatedPin);
    onSaveSettings({
      googleClientId: '',
      googleApiKey: '',
      isAutoSync: autoSync,
      mode: mode,
      lastSyncedAt: settings.lastSyncedAt,
      securityPin: updatedPin,
    });
    setPinMessage({ type: 'success', text: '鎖定筆記密碼已成功變更！' });
    setOldPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SamsungNotes_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportBackup(parsed);
            alert('備份匯入成功！已更新筆記。');
          } else if (parsed.notes && Array.isArray(parsed.notes)) {
            onImportBackup(parsed.notes);
            alert('備份匯入成功！已更新筆記。');
          } else {
            alert('無效的 JSON 備份檔案格式');
          }
        } catch {
          alert('解析 JSON 備份檔案失敗');
        }
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1F1F22] w-full max-w-xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-300 dark:border-[#333338] flex flex-col text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-[#2C2C30] bg-[#171719]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0381FE]/20 text-[#0381FE]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                設定 (Settings)
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#A0A0A0]">
                管理 Google Drive 雲端同步與系統偏好
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Google Credentials Setup */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-[#0381FE]" />
                Google Drive 雲端同步
              </h4>
            </div>

            <div className="pt-2 border-t border-slate-300 dark:border-[#333338] flex flex-wrap items-center justify-between gap-3">
              {user && (
                <div className="flex items-center gap-2">
                  <img src={user.picture} alt="Avatar" className="w-7 h-7 rounded-full border border-[#0381FE]" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 已連結 Google Drive
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-slate-900 dark:text-white text-xs font-semibold hover:bg-emerald-700 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? '同步中...' : '手動同步'}
                </button>
                <button
                  type="button"
                  onClick={onDisconnectGoogle}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold hover:bg-rose-500 hover:text-white transition-all"
                >
                  登出並清除資料
                </button>
              </div>
            </div>
          </div>

          {/* Locked Note Password Settings */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                鎖定筆記 密碼變更
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-[#A0A0A0] bg-white dark:bg-[#1F1F22] px-2.5 py-1 rounded-full border border-slate-300 dark:border-[#333338]">
                {securityPin === '000' ? '目前為預設密碼 (000)' : '已啟用自訂密碼'}
              </span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#A0A0A0] mb-1">
                    目前密碼
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={oldPinInput}
                    onChange={(e) => {
                      setOldPinInput(e.target.value);
                      setPinMessage(null);
                    }}
                    placeholder="輸入舊密碼 (預設: 000)"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-[#333338] text-slate-900 dark:text-white focus:outline-none focus:border-[#0381FE]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#A0A0A0] mb-1">
                    新密碼
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={newPinInput}
                    onChange={(e) => {
                      setNewPinInput(e.target.value);
                      setPinMessage(null);
                    }}
                    placeholder="輸入新密碼"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-[#333338] text-slate-900 dark:text-white focus:outline-none focus:border-[#0381FE]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-[#A0A0A0] mb-1">
                    確認新密碼
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={confirmPinInput}
                    onChange={(e) => {
                      setConfirmPinInput(e.target.value);
                      setPinMessage(null);
                    }}
                    placeholder="再輸入一次新密碼"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#121214] border border-slate-300 dark:border-[#333338] text-slate-900 dark:text-white focus:outline-none focus:border-[#0381FE]"
                  />
                </div>
              </div>

              {pinMessage && (
                <p
                  className={`text-xs font-semibold ${
                    pinMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {pinMessage.text}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white transition-colors"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? '隱藏密碼' : '顯示明文密碼'}</span>
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  更新密碼
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Local Export */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-100 dark:bg-[#262629] border border-slate-300 dark:border-[#333338]">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#0381FE]" />
              離線 JSON 備份與匯入
            </h4>

            <p className="text-xs text-slate-500 dark:text-[#A0A0A0] leading-relaxed">
              可隨時下載完整的 Cloud Notebook JSON 備份檔案，包含圖片繪圖與語音記錄。
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-900 dark:text-white text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                匯出 JSON 備份
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-slate-900 dark:text-white text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                匯入 JSON 備份
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#2C2C30] bg-[#171719] flex items-center justify-between">
          <span className="text-xs text-emerald-400 font-bold">
            {savedSuccess ? '✓ 設定已成功儲存' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
            >
              <Check className="w-4 h-4" />
              儲存變更
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
