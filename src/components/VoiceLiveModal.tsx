import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Radio,
  Square,
  AlertCircle,
  MessageSquare,
  Zap,
  PhoneCall,
  PhoneOff,
  Activity,
  Layers,
} from 'lucide-react';
import { floatTo16BitPCMBase64, base64ToFloat32Array } from '../utils/audioLiveUtils';
import { AppLogo } from './AppLogo';

interface VoiceLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

interface TranscriptEntry {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

export const VoiceLiveModal: React.FC<VoiceLiveModalProps> = ({
  isOpen,
  onClose,
  userName = 'Family Member',
}) => {
  const [engine, setEngine] = useState<'live' | 'conversational'>('live');
  const [status, setStatus] = useState<
    'connecting' | 'listening' | 'speaking' | 'processing' | 'interrupted' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([
    {
      id: 'init-msg',
      sender: 'gemini',
      text: `Hello ${userName}! Jhatwal Home Voice is active. What can I help our family with?`,
      timestamp: 'Now',
    },
  ]);

  // Audio and WebSocket refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const volumeLevelRef = useRef<number>(0.15);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Conversational fallback refs (MediaRecorder + transcribe + chat + speech synth)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isConversationalListeningRef = useRef<boolean>(false);

  // Auto-scroll transcripts
  useEffect(() => {
    if (showTranscript && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, showTranscript]);

  // Stop all active audio playback
  const stopAllPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('listening');
  }, []);

  // Conversational Voice Fallback Handler
  const startConversationalListening = useCallback(() => {
    if (!mediaStreamRef.current || isMuted) return;

    try {
      stopAllPlayback();
      recordedChunksRef.current = [];
      const stream = mediaStreamRef.current;
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mr;
      isConversationalListeningRef.current = true;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mr.onstop = async () => {
        isConversationalListeningRef.current = false;
        if (recordedChunksRef.current.length === 0) return;

        const audioBlob = new Blob(recordedChunksRef.current, {
          type: mr.mimeType || 'audio/webm',
        });
        await processConversationalAudio(audioBlob, mr.mimeType);
      };

      mr.start(250);
      setStatus('listening');
    } catch (e) {
      console.error('Conversational voice listen error:', e);
    }
  }, [isMuted, stopAllPlayback]);

  const stopConversationalListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setStatus('processing');
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processConversationalAudio = async (blob: Blob, mimeType: string) => {
    setStatus('processing');
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // 1. Transcribe speech
        const transRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64Audio, mimeType }),
        });

        if (!transRes.ok) {
          throw new Error('Could not transcribe audio');
        }

        const transData = await transRes.json();
        const userQuery = transData.transcription?.trim();
        if (!userQuery) {
          setStatus('listening');
          return;
        }

        // Add user query to transcript
        setTranscripts((prev) => [
          ...prev,
          {
            id: `usr_${Date.now()}`,
            sender: 'user',
            text: userQuery,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // 2. Query Gemini chat
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: userQuery }],
            mode: 'general',
            userProfile: { name: userName, role: 'member' },
          }),
        });

        if (!chatRes.ok) {
          throw new Error('AI response failed');
        }

        const chatData = await chatRes.json();
        const replyText = chatData.text || 'I hear you! How else can I help?';

        // Add reply to transcript
        setTranscripts((prev) => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'gemini',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // 3. Speak out reply
        speakReply(replyText);
      };
    } catch (err: any) {
      console.warn('Conversational voice failed:', err);
      setStatus('listening');
    }
  };

  const speakReply = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatus('listening');
      return;
    }

    stopAllPlayback();
    const cleanText = text.replace(/[*#`_\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setStatus('speaking');
      volumeLevelRef.current = 0.75;
    };

    utterance.onend = () => {
      volumeLevelRef.current = 0.15;
      setStatus('listening');
    };

    utterance.onerror = () => {
      volumeLevelRef.current = 0.15;
      setStatus('listening');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Send a quick text prompt directly into the voice session
  const handleQuickPrompt = (promptText: string) => {
    setTranscripts((prev) => [
      ...prev,
      {
        id: `quick_${Date.now()}`,
        sender: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    if (engine === 'live' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: promptText }));
      setStatus('processing');
    } else {
      // Use conversational API
      setStatus('processing');
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptText }],
          mode: 'general',
          userProfile: { name: userName, role: 'member' },
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          const reply = data.text || 'Understood!';
          setTranscripts((prev) => [
            ...prev,
            {
              id: `ai_${Date.now()}`,
              sender: 'gemini',
              text: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          speakReply(reply);
        })
        .catch(() => setStatus('listening'));
    }
  };

  // Main session lifecycle
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    setStatus('connecting');
    setErrorMessage(null);

    const initLiveSession = async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const inputCtx = new AudioContextClass({ sampleRate: 16000 });
        const outputCtx = new AudioContextClass({ sampleRate: 24000 });
        inputAudioCtxRef.current = inputCtx;
        outputAudioCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        // Microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;

        // Setup WebSocket for Gemini 3.8 Live API
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          setEngine('live');
          setStatus('listening');

          // Send introductory wake context
          ws.send(
            JSON.stringify({
              text: `[SYSTEM: Connected with family member ${userName}. Acknowledge warmly in 1 brief sentence.]`,
            })
          );
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);

            if (data.error) {
              console.warn('Live API server message:', data.error);
              // Switch to Conversational Voice fallback seamlessly
              setEngine('conversational');
              setStatus('listening');
              return;
            }

            if (data.interrupted) {
              stopAllPlayback();
              setStatus('listening');
              return;
            }

            if (data.text) {
              setTranscripts((prev) => [
                ...prev,
                {
                  id: `gem_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                  sender: 'gemini',
                  text: data.text,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }

            if (data.audio && outputCtx) {
              setStatus('speaking');
              const float32Data = base64ToFloat32Array(data.audio);
              const audioBuffer = outputCtx.createBuffer(1, float32Data.length, 24000);
              audioBuffer.getChannelData(0).set(float32Data);

              const sourceNode = outputCtx.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(outputCtx.destination);

              const now = outputCtx.currentTime;
              const startTime = Math.max(nextStartTimeRef.current, now);
              sourceNode.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;

              activeSourcesRef.current.push(sourceNode);

              sourceNode.onended = () => {
                activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== sourceNode);
                if (activeSourcesRef.current.length === 0) {
                  setStatus('listening');
                }
              };

              volumeLevelRef.current = 0.85;
            }
          } catch (err) {
            console.error('Live message parse error:', err);
          }
        };

        ws.onerror = (err) => {
          console.warn('Live WebSocket failed, enabling conversational mode:', err);
          if (isSubscribed) {
            setEngine('conversational');
            setStatus('listening');
          }
        };

        ws.onclose = () => {
          if (isSubscribed && engine === 'live') {
            setEngine('conversational');
            setStatus('listening');
          }
        };

        // Microphone processor node for streaming PCM
        const micSource = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        micSource.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (!isSubscribed || isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate RMS volume for visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          volumeLevelRef.current = Math.min(1, Math.max(volumeLevelRef.current * 0.9, rms * 5.5));

          if (ws.readyState === WebSocket.OPEN) {
            const base64Pcm = floatTo16BitPCMBase64(inputData);
            ws.send(JSON.stringify({ audio: base64Pcm }));
          }
        };
      } catch (err: any) {
        console.error('Voice setup error:', err);
        setErrorMessage(err?.message || 'Could not access microphone.');
        setStatus('error');
      }
    };

    initLiveSession();

    // Soundwave Equalizer Canvas Animation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let angle = 0;
      const render = () => {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        const bars = 56;
        const barWidth = width / bars;
        const currentVol = volumeLevelRef.current;

        for (let i = 0; i < bars; i++) {
          const t = i / bars;
          const wave =
            Math.sin(angle + t * 9) * Math.cos(angle * 0.6 + t * 5) +
            Math.sin(angle * 1.5 + t * 3) * 0.3;
          const dynamicHeight = Math.max(
            4,
            (Math.abs(wave) * 36 + 6) * (0.25 + currentVol * 1.8)
          );

          const grad = ctx.createLinearGradient(
            0,
            midY - dynamicHeight / 2,
            0,
            midY + dynamicHeight / 2
          );

          if (status === 'speaking') {
            grad.addColorStop(0, '#fffbeb');
            grad.addColorStop(0.3, '#fde047');
            grad.addColorStop(0.7, '#f59e0b');
            grad.addColorStop(1, '#ea580c');
          } else if (status === 'listening') {
            grad.addColorStop(0, '#a7f3d0');
            grad.addColorStop(0.5, '#10b981');
            grad.addColorStop(1, '#059669');
          } else {
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(0.5, '#f59e0b');
            grad.addColorStop(1, '#b45309');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(
            i * barWidth + 1.5,
            midY - dynamicHeight / 2,
            Math.max(2, barWidth - 3),
            dynamicHeight,
            3
          );
          ctx.fill();
        }

        angle += 0.07;
        animFrameIdRef.current = requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      stopAllPlayback();

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (inputAudioCtxRef.current) {
        inputAudioCtxRef.current.close();
        inputAudioCtxRef.current = null;
      }
      if (outputAudioCtxRef.current) {
        outputAudioCtxRef.current.close();
        outputAudioCtxRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, userName, stopAllPlayback, engine, isMuted, status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/92 backdrop-blur-2xl p-3 sm:p-6 animate-fadeIn">
      {/* Background Volumetric Ambient Lighting */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-amber-300/10 blur-[120px] pointer-events-none" />

      {/* Main Glass Shell */}
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-[2.5rem] bg-stone-900/95 border border-stone-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-stone-800/80 bg-stone-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <AppLogo size="sm" showText={false} glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base tracking-tight">
                  VOICE CONVERSATION
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {engine === 'live' ? 'gemini-3.8-live' : 'conversational mode'}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                Autonomous voice intelligence for Jhatwal Home
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className={`p-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                showTranscript
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-stone-800/80 text-stone-400 border-stone-700/60 hover:text-stone-200'
              }`}
              title="Toggle Live Subtitles"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Subtitles</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer border border-stone-700/60"
              title="Close Voice Call"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Visualizer & Stage */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto flex flex-col items-center justify-center space-y-6">
          {/* Status Capsule */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-950/80 border border-stone-800 text-xs font-semibold shadow-inner">
            {status === 'connecting' && (
              <>
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-300">Synchronizing voice channel...</span>
              </>
            )}
            {status === 'listening' && (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span className="text-emerald-400 font-bold">Listening — speak freely</span>
              </>
            )}
            {status === 'speaking' && (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-amber-300 font-bold">Gemini is speaking...</span>
              </>
            )}
            {status === 'processing' && (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-stone-300">Formulating intelligent thought...</span>
              </>
            )}
            {status === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-300">Microphone notice</span>
              </>
            )}
          </div>

          {/* Glowing Holographic Audio Orb */}
          <div className="relative group flex items-center justify-center my-2">
            {/* Pulsing Outer Rings */}
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-700 ${
                status === 'speaking'
                  ? 'bg-amber-500/25 blur-xl scale-125 animate-pulse'
                  : status === 'listening'
                  ? 'bg-emerald-500/20 blur-lg scale-110'
                  : 'bg-amber-500/10 blur-md scale-100'
              }`}
            />
            <div
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center relative transition-all duration-500 shadow-2xl ${
                status === 'speaking'
                  ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.6)] scale-105'
                  : status === 'listening'
                  ? 'bg-stone-900 border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                  : 'bg-stone-900 border border-stone-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
              }`}
            >
              {status === 'speaking' ? (
                <Sparkles className="w-14 h-14 text-stone-950 animate-spin" />
              ) : status === 'processing' ? (
                <Activity className="w-14 h-14 text-amber-400 animate-pulse" />
              ) : (
                <Mic
                  className={`w-14 h-14 transition ${
                    isMuted ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                />
              )}
              <span
                className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                  status === 'speaking' ? 'text-stone-950 font-extrabold' : 'text-stone-400'
                }`}
              >
                {status === 'speaking' ? 'SPEAKING' : isMuted ? 'MUTED' : 'READY'}
              </span>
            </div>
          </div>

          {/* Soundwave Spectral Canvas */}
          <div className="w-full max-w-lg h-20 bg-stone-950/70 rounded-3xl border border-stone-800/80 p-3 flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} width={460} height={60} className="w-full h-full" />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="w-full max-w-md p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Scrollable Transcript Box */}
          {showTranscript && (
            <div className="w-full max-w-lg bg-stone-950/60 border border-stone-800 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2.5 text-xs">
              {transcripts.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex gap-2.5 items-start ${
                    entry.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {entry.sender === 'gemini' && (
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] shrink-0 font-bold border border-amber-500/30">
                      AI
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[82%] leading-relaxed ${
                      entry.sender === 'user'
                        ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-sm'
                        : 'bg-stone-900 border border-stone-800 text-stone-200 rounded-tl-sm'
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}

          {/* One-Tap Suggested Voice Prompts */}
          <div className="w-full max-w-lg pt-1">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2 text-center">
              Quick Voice Inquiries
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickPrompt('What should we cook for dinner tonight with healthy ingredients?')}
                className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-medium text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <span className="text-base">🍲</span>
                <span className="truncate group-hover:text-amber-300">Dinner ideas for tonight</span>
              </button>

              <button
                onClick={() => handleQuickPrompt('Plan a fun outdoor weekend road trip activity for our family')}
                className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-medium text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <span className="text-base">🏕️</span>
                <span className="truncate group-hover:text-amber-300">Weekend trip activity</span>
              </button>

              <button
                onClick={() => handleQuickPrompt('Review our family rules, chore reminders, and routines')}
                className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-medium text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <span className="text-base">📋</span>
                <span className="truncate group-hover:text-amber-300">Chores & house rules</span>
              </button>

              <button
                onClick={() => handleQuickPrompt('Quiz me on a fun space science or nature mystery')}
                className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs font-medium text-left transition cursor-pointer flex items-center gap-2 group"
              >
                <span className="text-base">🔬</span>
                <span className="truncate group-hover:text-amber-300">Science trivia quiz</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between gap-3">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              isMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          {/* Interrupt Gemini button */}
          {status === 'speaking' && (
            <button
              onClick={stopAllPlayback}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 text-xs font-black transition shadow-lg shadow-amber-500/30 cursor-pointer animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Interrupt & Speak</span>
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-stone-800 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 border border-stone-700/80 hover:border-rose-500/40 text-xs font-bold transition cursor-pointer"
          >
            <PhoneOff className="w-4 h-4 text-rose-400" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
