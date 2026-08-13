import React from 'react';
import { Cloud, Lock, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#0A0A0B]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-[90%] max-w-md p-8 sm:p-12 rounded-[2rem] bg-white/60 dark:bg-[#1A1A1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] flex flex-col items-center text-center">
        
        {/* Logo/Icon Area */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0381FE] to-emerald-400 rounded-3xl blur-lg opacity-50 animate-pulse" />
          <div className="relative w-full h-full bg-white dark:bg-[#262629] rounded-3xl shadow-xl flex items-center justify-center border border-white/50 dark:border-white/10">
            <Cloud className="w-12 h-12 text-[#0381FE]" />
          </div>
        </div>

        {/* Typography */}
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Cloud Notebook
        </h1>
        <p className="text-sm text-slate-500 dark:text-[#A0A0A0] mb-10 leading-relaxed max-w-[280px]">
          您的專屬雲端筆記空間。登入以無縫同步您的所有靈感與資料。
        </p>

        {/* Login Button */}
        <button
          onClick={onLogin}
          className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#0381FE] hover:bg-blue-600 text-white rounded-2xl font-semibold text-[15px] transition-all hover:shadow-[0_0_20px_rgba(3,129,254,0.4)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-5 h-5 bg-white rounded-full p-0.5" 
          />
          <span>使用 Google 帳號登入</span>
        </button>

        {/* Footer Features */}
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-[#333338] w-full grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#A0A0A0]">隱私安全</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#A0A0A0]">專屬空間</span>
          </div>
        </div>
      </div>
    </div>
  );
};
