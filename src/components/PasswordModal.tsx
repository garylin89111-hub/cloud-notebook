import React, { useState } from 'react';
import { Lock, KeyRound, X } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin?: string;
  title?: string;
  subtitle?: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin = '000',
  title = '筆記安全加密保護',
  subtitle = '這份筆記已被鎖定，請輸入解鎖密碼繼續。',
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      setErrorMsg('');
      setPin('');
      onSuccess();
    } else {
      setErrorMsg('PIN 密碼錯誤，請重新輸入');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1F1F22] border border-slate-300 dark:border-[#333338] p-6 text-slate-900 dark:text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#0381FE]/20 text-[#0381FE] flex items-center justify-center mb-3 border border-[#0381FE]/30">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-[#A0A0A0] mb-4">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-[#A0A0A0]" />
            <input
              type="password"
              maxLength={8}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMsg('');
              }}
              placeholder="輸入 4-8 位解鎖密碼"
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-[#2C2C30] focus:border-[#0381FE] text-center tracking-widest text-sm font-bold text-slate-900 dark:text-white placeholder:text-xs placeholder:tracking-normal placeholder-slate-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-400 text-center animate-shake">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-[#2C2C30] hover:bg-slate-200 dark:bg-[#38383F] text-xs font-bold text-slate-500 dark:text-[#A0A0A0] hover:text-slate-900 dark:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#0381FE] hover:bg-blue-600 text-xs font-bold text-white shadow-md"
            >
              解鎖筆記
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
