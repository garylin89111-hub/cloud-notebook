import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Volume2, 
  Radio, 
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { AudioRecording } from '../types';

interface VoiceRecorderProps {
  recordings: AudioRecording[];
  onAddRecording: (recording: AudioRecording) => void;
  onDeleteRecording: (id: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  recordings,
  onAddRecording,
  onDeleteRecording,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 20, 15, 30, 25, 10]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recordingTimeRef = useRef<number>(0);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeAudioRef.current) activeAudioRef.current.pause();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('您的瀏覽器不支援麥克風錄音功能。');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Detect supported mimeType
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          options = { mimeType: 'audio/aac' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup audio analyzer for visualizer bars
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevels = () => {
          analyser.getByteFrequencyData(dataArray);
          const levels = Array.from(dataArray.slice(0, 8)).map(val => Math.max(12, Math.floor((val / 255) * 45)));
          setAudioLevels(levels);
          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      } catch (e) {
        // Audio visualizer fallback
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }

        const actualMime = mediaRecorder.mimeType || options.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });

        if (audioBlob.size === 0) {
          setErrorMessage('錄音失敗，未能擷取到聲音數據。');
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const finalDuration = Math.max(1, recordingTimeRef.current);
          const newRec: AudioRecording = {
            id: 'rec-' + Date.now(),
            dataUrl: base64Audio,
            durationSeconds: finalDuration,
            name: `語音筆記 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
            createdAt: new Date().toISOString(),
          };
          onAddRecording(newRec);
        };

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Request data chunks every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          recordingTimeRef.current = next;
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setErrorMessage('無法存取麥克風，請檢查瀏覽器麥克風權限或隱私設定。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = (recording: AudioRecording) => {
    if (playingId === recording.id && activeAudioRef.current) {
      if (activeAudioRef.current.paused) {
        activeAudioRef.current.play().catch(() => {});
      } else {
        activeAudioRef.current.pause();
        setPlayingId(null);
      }
      return;
    }

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }

    const audio = new Audio(recording.dataUrl);
    activeAudioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setPlayingProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPlayingId(null);
      setPlayingProgress(0);
    };

    audio.onerror = () => {
      setErrorMessage('播放音訊檔案失敗，資料可能已損壞。');
      setPlayingId(null);
    };

    audio.play().then(() => {
      setPlayingId(recording.id);
    }).catch((err) => {
      console.error("Audio playback rejected:", err);
      setErrorMessage('播放失敗：瀏覽器限制自動播放或不支援該音訊格式。');
      setPlayingId(null);
    });
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-[#18181A] rounded-3xl p-5 shadow-sm border border-slate-300 dark:border-[#333338]">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recording Header Control */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[#222225] border border-slate-300 dark:border-[#333338]">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl transition-all ${
            isRecording 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-[#0381FE]/20 text-[#0381FE]'
          }`}>
            {isRecording ? <Radio className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isRecording ? '正在錄音中...' : '語音筆記錄音機'}</span>
              {isRecording && (
                <div className="flex items-end gap-1 h-4 px-1">
                  {audioLevels.map((lvl, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${lvl}px` }}
                      className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                    />
                  ))}
                </div>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              {isRecording ? `已錄製時間: ${formatSeconds(recordingTime)}` : '點擊右側按鈕開始語音備忘錄'}
            </p>
          </div>
        </div>

        <div>
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0381FE] hover:bg-blue-600 text-white font-semibold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Mic className="w-4 h-4" />
              開始錄音
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Square className="w-4 h-4" />
              結束並儲存
            </button>
          )}
        </div>
      </div>

      {/* Audio Clips List */}
      <div className="flex flex-col gap-2.5">
        <h5 className="text-xs font-bold text-slate-400 px-1 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-[#0381FE]" />
          已附加音訊 ({recordings.length})
        </h5>

        {recordings.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-[#333338] rounded-2xl text-slate-400 text-xs">
            目前此筆記尚無語音錄音，點擊「開始錄音」以建立語音備忘錄
          </div>
        ) : (
          recordings.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#222225] border border-slate-300 dark:border-[#333338] hover:border-[#0381FE] transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <button
                  type="button"
                  onClick={() => togglePlay(rec)}
                  className="w-10 h-10 rounded-2xl bg-[#0381FE] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-blue-600 transition-all cursor-pointer"
                  title={playingId === rec.id ? '暫停' : '播放錄音'}
                >
                  {playingId === rec.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {rec.name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formatSeconds(rec.durationSeconds || 0)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#333338] h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#0381FE] h-full transition-all duration-100 rounded-full"
                      style={{
                        width: playingId === rec.id ? `${playingProgress}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Download button */}
                <a
                  href={rec.dataUrl}
                  download={`${rec.name}.webm`}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200 dark:bg-[#2C2C30] transition-all"
                  title="下載音訊檔"
                >
                  <Download className="w-4 h-4" />
                </a>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDeleteRecording(rec.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
                  title="刪除錄音"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

