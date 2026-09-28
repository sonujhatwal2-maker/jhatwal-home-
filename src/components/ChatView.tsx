import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  FamilyUser,
  AIMode,
  GroundingSource,
  ChatImageAttachment,
  GeneratedImagePayload,
} from '../types';
import {
  Send,
  Sparkles,
  BrainCircuit,
  Search,
  MapPin,
  Image as ImageIcon,
  Zap,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Paperclip,
  X,
  ExternalLink,
  RefreshCw,
  HelpCircle,
  Compass,
  Palette,
  Download,
  ThumbsUp,
  Radio,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChatImageCard } from './ChatImageCard';
import { LightboxModal } from './LightboxModal';
import { AudioTranscribeButton } from './AudioTranscribeButton';
import { AppLogo } from './AppLogo';

interface ChatViewProps {
  currentUser: FamilyUser;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  activeMode: AIMode;
  setActiveMode: (mode: AIMode) => void;
  onClearThread: () => void;
  onNavigateToStudio?: (prompt?: string) => void;
  onOpenLiveVoice?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  messages,
  setMessages,
  activeMode,
  setActiveMode,
  onClearThread,
  onNavigateToStudio,
  onOpenLiveVoice,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<ChatImageAttachment | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [likedMessages, setLikedMessages] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ url: string; prompt: string } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Request browser location for Maps grounding if selected
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Getting location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('Location enabled');
          setTimeout(() => setLocationStatus(null), 3000);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setLocationStatus('Location unavailable, using global maps');
          setTimeout(() => setLocationStatus(null), 4000);
        },
        { timeout: 8000 }
      );
    }
  };

  const handleModeChange = (mode: AIMode) => {
    setActiveMode(mode);
    if (mode === 'maps' && !userLocation) {
      requestLocation();
    }
  };

  // Handle image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, WebP, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachedImage({
        data: dataUrl,
        mimeType: file.type,
        previewUrl: dataUrl,
        name: file.name,
      });
      // Switch mode to vision automatically
      setActiveMode('vision');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (activeMode === 'vision') {
      setActiveMode('general');
    }
  };

  // Text to speech
  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleLike = (id: string) => {
    setLikedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const extractImageFromMessage = (msg: ChatMessage): GeneratedImagePayload | null => {
    if (msg.generatedImage?.url) return msg.generatedImage;
    // Check if content has markdown image ![alt](url)
    const mdMatch = /!\[(.*?)\]\((https:\/\/image\.pollinations\.ai\/[^\s)]+)\)/.exec(msg.content);
    if (mdMatch) {
      return {
        prompt: mdMatch[1] || 'Generated Artwork',
        url: mdMatch[2],
        style: 'realistic',
      };
    }
    // Check raw pollinations url
    const rawMatch = /(https:\/\/image\.pollinations\.ai\/prompt\/[^\s"'<>)]+)/.exec(msg.content);
    if (rawMatch) {
      return {
        prompt: 'Family Artwork',
        url: rawMatch[1],
        style: 'realistic',
      };
    }
    return null;
  };

  const cleanContentForMarkdown = (content: string, hasCard: boolean): string => {
    if (!hasCard) return content;
    return content.replace(/!\[.*?\]\(https:\/\/image\.pollinations\.ai\/[^\s)]+\)/g, '').trim();
  };

  const handleRetryLastPrompt = (msgId: string) => {
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex > 0) {
      const prevUserMsg = messages[msgIndex - 1];
      if (prevUserMsg && prevUserMsg.role === 'user') {
        handleSend(prevUserMsg.content);
      }
    }
  };

  // Send message
  const handleSend = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || input).trim();
    if (!promptToSend && !attachedImage) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar,
      },
      mode: activeMode,
      image: attachedImage || undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    const currentAttachment = attachedImage;
    setAttachedImage(null);
    setLoading(true);

    try {
      // Format messages history for server
      const payloadMessages = newMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content,
        image: m.image
          ? {
              data: m.image.data,
              mimeType: m.image.mimeType,
            }
          : undefined,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          mode: activeMode,
          userProfile: currentUser,
          location: userLocation,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini.');
      }

      const assistantMessage: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: {
          id: 'kin_ai',
          name: 'Jhatwal Home AI',
          role: 'admin',
          avatar: '🤖',
        },
        mode: activeMode,
        generatedImage: data.generatedImage,
        sources: data.sources || [],
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Something went wrong while contacting the family AI engine.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: {
          id: 'kin_ai',
          name: 'Jhatwal Home AI',
          role: 'admin',
          avatar: '🤖',
        },
        mode: activeMode,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Role-tailored prompt suggestions
  const getSuggestions = () => {
    if (activeMode === 'search') {
      return [
        'What family movies are showing in theaters this weekend?',
        'Current weather forecast and air quality for outdoor activities',
        'Recent NASA discovery news suitable for a school presentation',
      ];
    }
    if (activeMode === 'maps') {
      return [
        'Find top-rated kid-friendly parks with playgrounds near me',
        'Best family casual Italian restaurant with peanut-safe options nearby',
        'Walk-in urgent care or pediatric clinics in the area',
      ];
    }
    if (activeMode === 'thinking') {
      return [
        'Step-by-step algebra logic proof: explain quadratic formulas with intuitive steps',
        'Plan a 529 college savings strategy with compounding calculations',
        'Compare high-deductible vs HMO family health insurance tradeoffs',
      ];
    }
    if (currentUser.role === 'kid') {
      return [
        'Help me solve this fraction math homework step by step!',
        'Invent a bedtime space adventure starring me and Barnaby the dog',
        'Why does the moon change shapes during the month?',
      ];
    }
    if (currentUser.role === 'elder') {
      return [
        'Summarize this week\'s family schedule and events in clear bullet points',
        'Grandma\'s apple crisp: suggest a twist with seasonal spices or warm chai',
        'Family storytelling prompt to share memories with the Jhatwal kids',
      ];
    }
    return [
      'What can we make for dinner with chicken and veggies without peanuts?',
      'Draft a weekend chore breakdown for Kabir and Sunita with reward points',
      'Plan a 2-day family road trip itinerary factoring in rest stops',
    ];
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] sm:h-[calc(100vh-65px)] bg-stone-950 text-stone-100 pb-14 sm:pb-0">
      {/* Top AI Mode Bar */}
      <div className="border-b border-stone-800 bg-stone-900/60 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <span className="text-xs text-stone-400 font-semibold mr-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Model:
            </span>

            {/* General Assistant (gemini-3.8-flash) */}
            <button
              onClick={() => handleModeChange('general')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'general'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="General household intelligence (gemini-3.8-flash)"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>General (3.8 Flash)</span>
            </button>

            {/* Pro Thinking Mode (gemini-3.1-pro-preview) */}
            <button
              onClick={() => handleModeChange('thinking')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'thinking'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Complex reasoning for advanced math, STEM, and deep logic (gemini-3.1-pro-preview)"
            >
              <BrainCircuit className="w-3 h-3 text-purple-400" />
              <span>Pro Reasoning (3.1 Pro)</span>
            </button>

            {/* Fast Lite (gemini-3.1-flash-lite) */}
            <button
              onClick={() => handleModeChange('fast')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'fast'
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Ultra-fast quick responses for definitions and rapid answers (gemini-3.1-flash-lite)"
            >
              <Zap className="w-3 h-3 text-yellow-400" />
              <span>Fast Lite (3.1 Lite)</span>
            </button>

            {/* Google Maps Grounding (gemini-3.8-flash with googleMaps) */}
            <button
              onClick={() => handleModeChange('maps')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'maps'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Google Maps Grounding for local places, clinics, and outings (gemini-3.8-flash)"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Google Maps</span>
            </button>

            {/* Google Search Grounding */}
            <button
              onClick={() => handleModeChange('search')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'search'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Search Grounding with live web information"
            >
              <Search className="w-3 h-3 text-blue-400" />
              <span>Google Search</span>
            </button>

            {/* Image / Vision Analysis */}
            <button
              onClick={() => {
                handleModeChange('vision');
                fileInputRef.current?.click();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'vision'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Analyze images with multimodal vision"
            >
              <ImageIcon className="w-3 h-3 text-rose-400" />
              <span>Photo / Vision</span>
            </button>

            {/* Free Image Generator */}
            <button
              onClick={() => handleModeChange('image')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer border ${
                activeMode === 'image'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm font-semibold'
                  : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
              title="Generate and edit AI artwork, pictures, and illustrations"
            >
              <Palette className="w-3 h-3 text-amber-400" />
              <span>🎨 Image Studio</span>
            </button>

            {/* Direct Voice Call launch */}
            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 shadow-md shadow-amber-500/25 active:scale-95"
                title="Start Voice Conversation with Jhatwal Home AI (gemini-3.8-live)"
              >
                <Radio className="w-3.5 h-3.5 text-stone-950 animate-pulse" />
                <span>Voice Call</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {locationStatus && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
                <Compass className="w-3 h-3" />
                {locationStatus}
              </span>
            )}
            <button
              onClick={onClearThread}
              className="text-xs text-stone-400 hover:text-stone-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
              title="Start a fresh chat thread"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">New Thread</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Empty State Greeting */
            <div className="text-center py-10 px-4 max-w-lg mx-auto">
              <div className="flex justify-center mb-4">
                <AppLogo size="xl" glow={true} showText={false} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1.5 tracking-tight">
                Welcome home, {currentUser.name}!
              </h2>
              <p className="text-stone-400 text-xs sm:text-sm mb-5 leading-relaxed">
                Jhatwal Home AI is ready with our household schedules, allergies, pet Barnaby, Grandma's recipes, and private family memory.
              </p>

              {/* Mode pill banner */}
              <div className="p-3 bg-stone-900/90 border border-stone-800 rounded-2xl text-left text-xs mb-6 text-stone-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                  <Sparkles className="w-4 h-4" />
                  Active Model Mode: <span className="uppercase text-amber-300 font-mono">{activeMode}</span>
                </div>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  {activeMode === 'thinking' && 'Pro Reasoning (gemini-3.1-pro-preview) active: deep multi-step thinking for complex STEM, math, and logic.'}
                  {activeMode === 'general' && 'General AI (gemini-3.8-flash) active: family recipes, routines, homework, and multi-turn chat.'}
                  {activeMode === 'fast' && 'Fast Lite (gemini-3.1-flash-lite) active: instantaneous answers and rapid definitions.'}
                  {activeMode === 'maps' && 'Google Maps Grounding (gemini-3.8-flash) active: live local places, parks, dining, and navigation links.'}
                  {activeMode === 'search' && 'Google Search Grounding (gemini-3.8-flash) active: real-time web verification and current events.'}
                  {activeMode === 'vision' && 'Vision Analysis (gemini-3.8-flash) active: inspect homework, medical labels, and recipes.'}
                  {activeMode === 'image' && 'Image Studio active: prompt to create and edit high-resolution family artwork.'}
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
                  Suggested for you:
                </p>
                {getSuggestions().map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(sug)}
                    className="w-full text-left p-3 rounded-xl bg-stone-900 hover:bg-stone-800/80 border border-stone-800 hover:border-amber-500/40 text-stone-200 text-xs sm:text-sm transition flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sug}</span>
                    <span className="text-stone-500 group-hover:text-amber-400 transition text-xs font-mono">
                      Ask &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const imagePayload = !isUser ? extractImageFromMessage(msg) : null;
              const hasImageCard = !!imagePayload;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Sparkles className="w-4 h-4 fill-amber-400/20 text-amber-400" />
                    </div>
                  )}

                  <div className={`max-w-[88%] sm:max-w-[82%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Header info - unboxed clean typographic metadata */}
                    <div className={`flex items-center gap-1.5 mb-1 text-xs text-stone-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-semibold text-stone-200">
                        {isUser ? msg.author.name : 'Jhatwal Home AI'}
                      </span>
                      <span aria-hidden="true" className="text-stone-600">·</span>
                      <span className="text-[11px] text-stone-500">{msg.timestamp}</span>
                      {msg.modelUsed && !isUser && (
                        <>
                          <span aria-hidden="true" className="text-stone-600">·</span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {msg.modelUsed.replace(' (safe-fallback)', '')}
                          </span>
                        </>
                      )}
                      {msg.mode === 'thinking' && !isUser && (
                        <>
                          <span aria-hidden="true" className="text-stone-600">·</span>
                          <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3 text-purple-400" /> Deep Thought
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed max-w-full ${
                        isUser
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-medium rounded-tr-sm shadow-md'
                          : 'bg-stone-900/80 backdrop-blur-sm border border-stone-800/80 text-stone-100 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {/* Attached image if any */}
                      {msg.image && (
                        <div
                          onClick={() =>
                            setLightbox({
                              url: msg.image!.previewUrl,
                              prompt: msg.image!.name || 'Photo Attachment',
                            })
                          }
                          className="mb-3 rounded-xl overflow-hidden border border-black/20 max-w-sm cursor-zoom-in group relative"
                        >
                          <img
                            src={msg.image.previewUrl}
                            alt="Uploaded attachment"
                            className="w-full max-h-64 object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                          {msg.image.name && (
                            <p className="text-[11px] p-1.5 bg-black/60 text-stone-200 truncate backdrop-blur-xs flex items-center justify-between">
                              <span className="truncate">📎 {msg.image.name}</span>
                              <span className="text-[10px] text-amber-400 shrink-0 font-medium">Click to zoom</span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Message Content: Clean Markdown Rendering for AI, plain text for User */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <MarkdownRenderer
                          content={cleanContentForMarkdown(msg.content, hasImageCard)}
                          onOpenLightbox={(url, prompt) => setLightbox({ url, prompt })}
                          onOpenInStudio={(prompt) => onNavigateToStudio && onNavigateToStudio(prompt)}
                        />
                      )}

                      {/* Dedicated High-Res Generated AI Image Card */}
                      {imagePayload && (
                        <ChatImageCard
                          image={imagePayload}
                          onOpenLightbox={(url, prompt) => setLightbox({ url, prompt })}
                          onOpenInStudio={(prompt) => onNavigateToStudio && onNavigateToStudio(prompt)}
                        />
                      )}

                      {/* Grounding Sources (Search / Maps) */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-800/80">
                          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            {msg.sources.some((s) => s.type === 'maps') ? (
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Search className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            Verified Sources & Places:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-950 transition flex items-start gap-2 group"
                              >
                                <span className="text-base shrink-0">
                                  {src.type === 'maps' ? '📍' : '🌐'}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 truncate flex items-center justify-between">
                                    <span className="truncate">{src.title}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-60 group-hover:opacity-100" />
                                  </p>
                                  {src.snippet && (
                                    <p className="text-[10px] text-stone-400 line-clamp-2 mt-0.5">
                                      {src.snippet}
                                    </p>
                                  )}
                                  <p className="text-[9px] text-stone-500 truncate mt-0.5">
                                    {src.type === 'maps' ? 'Open in Google Maps' : src.url}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions: Speak, Copy, Like, Retry (For AI messages) */}
                    {!isUser && (
                      <div className="flex items-center gap-2 mt-1.5 text-stone-500 text-xs">
                        <button
                          onClick={() => handleSpeak(msg.content, msg.id)}
                          className="hover:text-stone-300 transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-900 cursor-pointer"
                          title="Read message aloud"
                        >
                          {speakingId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span className="text-[11px] text-amber-400 font-medium">Stop Voice</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Listen</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-stone-300 transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-900 cursor-pointer"
                          title="Copy text to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => toggleLike(msg.id)}
                          className={`hover:text-stone-300 transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-900 cursor-pointer ${
                            likedMessages[msg.id] ? 'text-amber-400 font-medium' : ''
                          }`}
                          title="Mark response as helpful"
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${likedMessages[msg.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
                          <span className="text-[11px]">{likedMessages[msg.id] ? 'Helpful' : 'Like'}</span>
                        </button>

                        <button
                          onClick={() => handleRetryLastPrompt(msg.id)}
                          className="hover:text-stone-300 transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-900 cursor-pointer"
                          title="Regenerate this response"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Retry</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-sm">
                      {msg.author.avatar}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-stone-900 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
              <div className="bg-stone-900/80 border border-stone-800/80 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-stone-400 flex items-center gap-2.5 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                </div>
                <span>
                  {activeMode === 'thinking' && 'Gemini 3.8 Flash is applying deep reasoning...'}
                  {activeMode === 'search' && 'Searching Google for real-time web verification...'}
                  {activeMode === 'maps' && 'Connecting with Google Maps places engine...'}
                  {activeMode === 'vision' && 'Analyzing image with Gemini 3.8 Flash...'}
                  {activeMode === 'fast' && 'Flash-Lite generating instant reply...'}
                  {activeMode === 'image' && 'Developing artwork with Free Studio Engine...'}
                  {activeMode === 'general' && 'Jhatwal Home AI is preparing your answer...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box Footer */}
      <div className="border-t border-stone-800 bg-stone-900/90 backdrop-blur p-3 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Image preview badge if attached */}
          {attachedImage && (
            <div className="mb-2 flex items-center gap-3 p-2 bg-stone-800/80 border border-stone-700 rounded-2xl max-w-fit">
              <img
                src={attachedImage.previewUrl}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-xl"
              />
              <div className="text-xs">
                <p className="font-semibold text-stone-200 truncate max-w-xs">
                  {attachedImage.name || 'Photo attached'}
                </p>
                <p className="text-[10px] text-amber-400">Ready for Gemini Vision analysis</p>
              </div>
              <button
                onClick={handleRemoveImage}
                className="p-1 text-stone-400 hover:text-red-400 rounded-lg hover:bg-stone-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-stone-950 border border-stone-800 focus-within:border-amber-500/50 rounded-2xl p-2 transition shadow-lg shadow-black/20"
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Photo / attachment button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-stone-400 hover:text-amber-400 rounded-xl hover:bg-stone-900 transition cursor-pointer"
              title="Upload photo / document to analyze"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Audio Speech Transcription (gemini-3.5-transcribe) */}
            <AudioTranscribeButton
              disabled={loading}
              onTranscribed={(text) => {
                setInput((prev) => (prev ? `${prev} ${text}` : text));
              }}
            />

            {/* Direct Voice Call Button */}
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-400/20 hover:from-amber-500/30 hover:to-orange-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer shrink-0"
                title="Start Real-time Voice Call with Jhatwal Home AI"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Voice Call</span>
              </button>
            )}

            {/* Main Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                currentUser.role === 'kid'
                  ? 'Ask homework questions, request bedtime stories, or science mysteries...'
                  : activeMode === 'maps'
                  ? 'Ask about family parks, dining, doctors, or activities nearby...'
                  : activeMode === 'search'
                  ? 'Ask about live news, school calendars, movie showtimes...'
                  : 'Message Jhatwal Home AI...'
              }
              className="flex-1 bg-transparent text-stone-100 placeholder-stone-500 text-sm focus:outline-none px-2"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || loading}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 text-stone-950 font-bold rounded-xl transition cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Micro status text */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-500">
            <span>
              Speaking as <strong className="text-stone-400">{currentUser.name}</strong> ({currentUser.role})
            </span>
            <span>Jhatwal Home AI Memory Synced</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Art Lightbox */}
      <LightboxModal
        isOpen={!!lightbox}
        onClose={() => setLightbox(null)}
        imageUrl={lightbox?.url || ''}
        title={lightbox?.prompt || 'Artwork'}
      />
    </div>
  );
};
