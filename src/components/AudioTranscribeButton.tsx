import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2, Sparkles, Activity } from 'lucide-react';

interface AudioTranscribeButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}

export const AudioTranscribeButton: React.FC<AudioTranscribeButtonProps> = ({
  onTranscribed,
  disabled = false,
}) => {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        await handleTranscribeBlob(audioBlob, mediaRecorder.mimeType);
      };

      mediaRecorder.start(250);
      setRecording(true);
      setSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleTranscribeBlob = async (blob: Blob, mimeType: string) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Audio,
            mimeType: mimeType || 'audio/webm',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transcription) {
            onTranscribed(data.transcription);
          }
        }
      };
    } catch (err) {
      console.error('Transcription error:', err);
    } finally {
      setTranscribing(false);
    }
  };

  if (transcribing) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse shadow-sm">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span className="hidden sm:inline">Transcribing Voice...</span>
      </div>
    );
  }

  if (recording) {
    return (
      <button
        onClick={stopRecording}
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold transition hover:bg-rose-500/30 animate-pulse cursor-pointer shadow-lg shadow-rose-500/20"
        title="Stop speaking and insert transcribed text"
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
        <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
        <span>{seconds}s · Tap to Finish</span>
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      type="button"
      className="p-2 rounded-xl text-stone-400 hover:text-amber-400 hover:bg-stone-900 border border-transparent hover:border-amber-500/20 transition cursor-pointer disabled:opacity-40"
      title="Dictate with voice (gemini-3.5-transcribe)"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
};
