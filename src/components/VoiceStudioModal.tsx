import React, { useState, useEffect, useRef } from 'react';
import { CustomVoiceProfile } from '../types';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Play,
  Check,
  Sparkles,
  Sliders,
  Radio,
  X,
  RefreshCw,
  Heart,
  User,
  Shield,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_VOICE_PRESETS,
  getSavedVoiceProfile,
  saveVoiceProfile,
  getAvailableVoices,
  analyzeMicrophonePitch,
  speakWithCustomVoice,
  stopSpeaking,
} from '../utils/customVoiceEngine';

interface VoiceStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name: string; role: string };
  onProfileUpdated?: (profile: CustomVoiceProfile) => void;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [activeProfile, setActiveProfile] = useState<CustomVoiceProfile>(getSavedVoiceProfile());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load voices when opened
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      return;
    }

    const current = getSavedVoiceProfile();
    setActiveProfile(current);

    const updateVoices = () => {
      const v = getAvailableVoices();
      setAvailableVoices(v);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      stopSpeaking();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isOpen]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, []);

  if (!isOpen) return null;

  // Visualizer loop
  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.fillStyle = '#1c1917'; // stone-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#f59e0b'; // amber-500
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Audio visualizer setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Analyze pitch
        const { pitchHz, suggestedPitchFactor, suggestedRate } = await analyzeMicrophonePitch(audioBlob);
        setDetectedPitch(pitchHz);

        const updated: CustomVoiceProfile = {
          ...activeProfile,
          id: 'my_cloned_voice',
          name: currentUser?.name ? `${currentUser.name}'s Real Voice` : 'My Custom Cloned Voice',
          pitch: suggestedPitchFactor,
          rate: suggestedRate,
          isClonedFromMic: true,
          sampleAudioUrl: url,
          recordedPitchHz: pitchHz,
          warmthBoost: true,
        };

        setActiveProfile(updated);
        saveVoiceProfile(updated);
        if (onProfileUpdated) onProfileUpdated(updated);

        // Stop stream tracks
        stream.getTracks().forEach((t) => t.stop());
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close();
          } catch (e) {}
        }
      };

      mr.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      drawWaveform();
    } catch (err: any) {
      alert('Microphone access is required to calibrate your voice. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Test current custom voice
  const handleTestVoice = (customText?: string) => {
    if (isTesting) {
      stopSpeaking();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    const textToSpeak =
      customText ||
      `Hello ${currentUser?.name || 'family'}! I am now speaking in your customized voice tone. The mechanical robotic filter is disabled, giving a warm human presence for Jhatwal Home.`;

    speakWithCustomVoice(
      textToSpeak,
      activeProfile,
      () => setIsTesting(false),
      () => setIsTesting(false)
    );
  };

  const handleSelectPreset = (preset: CustomVoiceProfile) => {
    stopSpeaking();
    setIsTesting(false);
    setActiveProfile(preset);
  };

  const handleSave = () => {
    saveVoiceProfile(activeProfile);
    if (onProfileUpdated) onProfileUpdated(activeProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl shadow-black/80 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">AI Voice Studio</h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Use My Voice
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Replace mechanical robotic speech with your own calibrated voice tone & warm acoustics.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Microphone Calibration & Cloning */}
        <div className="bg-stone-950/80 border border-stone-800/80 rounded-2xl p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              1. Calibrate from My Real Voice (Microphone)
            </span>
            {detectedPitch && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Calibrated: {detectedPitch} Hz
              </span>
            )}
          </div>

          <p className="text-xs text-stone-300 mb-3 leading-relaxed">
            Read this sentence out loud so the system can measure your natural voice pitch, rhythm, and cadence:
          </p>

          <div className="p-3.5 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-200 text-xs sm:text-sm font-semibold italic text-center mb-4">
            &ldquo;Hello Jhatwal family! I am speaking with warmth, clarity, and care for our household.&rdquo;
          </div>

          {/* Waveform / Visualizer */}
          <div className="relative rounded-xl overflow-hidden mb-4 border border-stone-800 h-16 bg-stone-900 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" width={500} height={64} />
            {!isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-[2px] text-xs text-stone-400 font-medium">
                {activeProfile.isClonedFromMic
                  ? '✓ Voice sample captured & calibrated'
                  : 'Press "Record Voice Sample" to calibrate'}
              </div>
            )}
          </div>

          {/* Record Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  <span>Record Voice Sample</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs shadow-md transition cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              {recordedAudioUrl && !isRecording && (
                <audio
                  src={recordedAudioUrl}
                  controls
                  className="h-8 max-w-[200px] text-xs rounded-lg filter invert hue-rotate-180"
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => handleTestVoice()}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isTesting
                  ? 'bg-amber-500 text-stone-950 border-amber-400 animate-pulse'
                  : 'bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border-stone-700'
              }`}
            >
              {isTesting ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isTesting ? 'Stop Speaking' : '▶ Test Voice Sound'}</span>
            </button>
          </div>
        </div>

        {/* Section 2: Presets & Voice Styles */}
        <div className="mb-5">
          <label className="block text-xs font-black uppercase tracking-wider text-stone-400 mb-2.5 flex items-center justify-between">
            <span>2. Or Choose a Family Voice Preset</span>
            <span className="text-[11px] font-normal text-stone-500">Non-mechanical human acoustics</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DEFAULT_VOICE_PRESETS.map((preset) => {
              const isSelected = activeProfile.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold truncate group-hover:text-amber-300">
                      {preset.name}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-stone-400 flex items-center gap-1.5 capitalize">
                    <span>Tone: {preset.toneStyle}</span>
                    <span>•</span>
                    <span>{preset.pitch < 1.0 ? 'Deep' : preset.pitch > 1.1 ? 'High' : 'Warm'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Fine Tuning Sliders */}
        <div className="bg-stone-950/50 border border-stone-800/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Fine-Tune Pitch & Pace
            </span>
            <span className="text-[10px] text-stone-400">
              Pitch: {activeProfile.pitch.toFixed(2)}x • Pace: {activeProfile.rate.toFixed(2)}x
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pitch */}
            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                <span>Vocal Pitch (Tone)</span>
                <span className="text-amber-400 font-semibold">
                  {activeProfile.pitch <= 0.9 ? 'Deeper' : activeProfile.pitch >= 1.15 ? 'Higher' : 'Balanced'}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={activeProfile.pitch}
                onChange={(e) =>
                  setActiveProfile({ ...activeProfile, pitch: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                <span>Deep (Male)</span>
                <span>Neutral</span>
                <span>Warm (Female/Bright)</span>
              </div>
            </div>

            {/* Speech Rate */}
            <div>
              <div className="flex justify-between text-[11px] text-stone-400 mb-1">
                <span>Speaking Speed (Cadence)</span>
                <span className="text-amber-400 font-semibold">
                  {activeProfile.rate < 0.95 ? 'Calm' : activeProfile.rate > 1.05 ? 'Energetic' : 'Standard'}
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={activeProfile.rate}
                onChange={(e) =>
                  setActiveProfile({ ...activeProfile, rate: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
                <span>Relaxed</span>
                <span>1.0x Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>

          {/* System voice dropdown if multiple natural voices exist */}
          {availableVoices.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-800">
              <label className="block text-[11px] font-semibold text-stone-400 mb-1">
                Underlying Natural Voice Engine (from your device):
              </label>
              <select
                value={activeProfile.systemVoiceURI || ''}
                onChange={(e) =>
                  setActiveProfile({
                    ...activeProfile,
                    systemVoiceURI: e.target.value || undefined,
                  })
                }
                className="w-full text-xs px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">Auto-Select Best Natural Human Voice (Recommended)</option>
                {availableVoices.slice(0, 15).map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleTestVoice('Testing my voice settings!')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Hear Sample</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-stone-400 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-extrabold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Voice Activated!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Use My Voice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
