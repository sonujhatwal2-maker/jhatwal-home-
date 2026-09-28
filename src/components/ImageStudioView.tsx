import React, { useState, useEffect, useRef } from 'react';
import {
  FamilyUser,
  GeneratedFamilyImage,
} from '../types';
import {
  Sparkles,
  Download,
  Trash2,
  Share2,
  Check,
  Wand2,
  RefreshCw,
  ExternalLink,
  Maximize2,
  X,
  Palette,
  Layers,
  Smartphone,
  Monitor,
  Square,
  Edit3,
  Upload,
  ArrowRight,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface ImageStudioViewProps {
  currentUser: FamilyUser;
}

const STYLES = [
  { id: 'realistic', label: 'Realistic Photo', icon: '📸', desc: '8K photorealism, natural lighting' },
  { id: 'digital-art', label: 'Digital Art', icon: '🎨', desc: 'Vibrant concept art & illustration' },
  { id: '3d-pixar', label: '3D Pixar/Disney', icon: '🧸', desc: 'Cute animated CGI character look' },
  { id: 'anime', label: 'Anime / Ghibli', icon: '🇯🇵', desc: 'Painterly Japanese anime aesthetic' },
  { id: 'cinematic', label: 'Cinematic Movie', icon: '🎬', desc: 'Dramatic widescreen film still' },
  { id: 'watercolor', label: 'Watercolor Painting', icon: '🖌️', desc: 'Soft paper texture, gentle brushstrokes' },
  { id: 'sketch', label: 'Pencil Sketch', icon: '📜', desc: 'Classic graphite drawing' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)', icon: Square, desc: 'Profile & Social' },
  { id: '9:16', label: 'Phone (9:16)', icon: Smartphone, desc: 'Mobile Wallpaper' },
  { id: '16:9', label: 'Landscape (16:9)', icon: Monitor, desc: 'Desktop & TV' },
];

const PROMPT_SUGGESTIONS = [
  'Royal family portrait dressed as modern superheroes',
  'Cute golden retriever wearing astronaut helmet on Mars',
  'Cozy wooden cabin surrounded by snowy pine trees at twilight',
  'Grand Diwali celebration with golden lights and fireworks',
  'Futuristic neon sports car speeding through cyberpunk city',
  'Whimsical treehouse library floating among clouds',
];

const EDIT_SUGGESTIONS = [
  'Add glowing fireworks and festive lanterns in the night sky',
  'Change the lighting to warm golden hour sunset glow',
  'Transform this into a painterly Japanese anime watercolor',
  'Add a cute robotic companion standing on the side',
  'Turn into futuristic cyberpunk neon with rain reflections',
];

export const ImageStudioView: React.FC<ImageStudioViewProps> = ({ currentUser }) => {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [sourceImageForEdit, setSourceImageForEdit] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedFamilyImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedFamilyImage | null>(null);
  const [modalImage, setModalImage] = useState<GeneratedFamilyImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery on mount
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/images/gallery');
      if (res.ok) {
        const data = await res.json();
        setGallery(data.images || []);
        if (data.images && data.images.length > 0 && !activeImage) {
          setActiveImage(data.images[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load gallery', err);
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || prompt).trim();
    if (!promptToUse) return;

    setGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          style: selectedStyle,
          aspectRatio: selectedRatio,
          enhance: enhancePrompt,
          author: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setActiveImage(data.image);
      setGallery((prev) => [data.image, ...prev.filter((i) => i.id !== data.image.id)]);
      if (!customPrompt) {
        setPrompt('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating image');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editInstruction.trim()) return;
    if (!sourceImageForEdit && !activeImage) {
      setErrorMsg('Please select or upload an image to edit.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);

    const baseImg = sourceImageForEdit || activeImage?.imageUrl;

    try {
      const res = await fetch('/api/images/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editInstruction.trim(),
          baseImage: baseImg,
          style: selectedStyle,
          author: currentUser,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }

      setActiveImage(data.image);
      setGallery((prev) => [data.image, ...prev.filter((i) => i.id !== data.image.id)]);
      setEditInstruction('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error modifying image');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartEditFromImage = (img: GeneratedFamilyImage) => {
    setSourceImageForEdit(img.imageUrl);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUploadSourceImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImageForEdit(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/images/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGallery((prev) => prev.filter((img) => img.id !== id));
        if (activeImage?.id === id) {
          setActiveImage(gallery.find((g) => g.id !== id) || null);
        }
      }
    } catch (err) {
      console.error('Failed to delete image', err);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${filename.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Studio Header Banner */}
      <div className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-amber-950/40 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <AppLogo size="lg" showText={false} glow={true} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Family Image Studio & AI Editor
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  gemini-3.1-flash-image
                </span>
              </div>
              <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                Create new artwork or modify existing photos with natural language instructions.
              </p>
            </div>
          </div>

          {/* Mode Switch Pills */}
          <div className="flex items-center bg-stone-950/80 p-1 rounded-2xl border border-stone-800">
            <button
              onClick={() => setMode('create')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'create'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mode === 'edit'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit / Modify</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Creation or Edit Controls Panel (Left) */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          {mode === 'create' ? (
            /* CREATE MODE CARD */
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center justify-between">
                  <span>Describe your image</span>
                  <span className="text-[11px] font-normal text-stone-400">
                    Be as imaginative as you like!
                  </span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleGenerate();
                    }
                  }}
                  placeholder="E.g., A cozy living room with a golden retriever sleeping by a warm fireplace during a snowfall..."
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition resize-none shadow-inner"
                />
              </div>

              {/* Quick Inspiration Pills */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 mb-2">
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>Quick inspiration:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setPrompt(sug);
                        handleGenerate(sug);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-stone-950/70 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition cursor-pointer text-left truncate max-w-[260px]"
                      title={sug}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Artistic Style</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STYLES.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                        selectedStyle === st.id
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                      }`}
                    >
                      <span className="text-lg shrink-0">{st.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{st.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ar) => {
                    const Icon = ar.icon;
                    return (
                      <button
                        key={ar.id}
                        onClick={() => setSelectedRatio(ar.id)}
                        className={`p-2.5 rounded-2xl border transition flex flex-col items-center justify-center text-center cursor-pointer ${
                          selectedRatio === ar.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold">{ar.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={generating || !prompt.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-stone-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Developing High-Res Artwork...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-stone-950" />
                    <span>Generate Artwork</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* EDIT MODE CARD */
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>Base Image to Modify</span>
                </label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleUploadSourceImage}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => editFileInputRef.current?.click()}
                  className="text-xs px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>Upload from PC/Phone</span>
                </button>
              </div>

              {/* Source Image Thumbnail Preview */}
              <div className="relative rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 p-2 flex items-center gap-4">
                <img
                  src={sourceImageForEdit || activeImage?.imageUrl || ''}
                  alt="Base"
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-700"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-stone-200 truncate">
                    {sourceImageForEdit ? 'Custom Uploaded Photo' : activeImage?.prompt || 'Selected Gallery Image'}
                  </p>
                  <p className="text-stone-400 text-[11px] mt-0.5">
                    Ready for Gemini 3.1 Flash Image editing. Type what you want to change, add, or transform below.
                  </p>
                </div>
              </div>

              {/* Edit Instruction Box */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-2">
                  Editing Instructions
                </label>
                <textarea
                  value={editInstruction}
                  onChange={(e) => setEditInstruction(e.target.value)}
                  placeholder="E.g., Add fireworks in the night sky, turn into watercolor painting, add sunglasses to the dog..."
                  rows={3}
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition resize-none shadow-inner"
                />
              </div>

              {/* Quick Edit Ideas */}
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 mb-2">
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>Quick edit ideas:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EDIT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setEditInstruction(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-stone-950/70 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 transition cursor-pointer text-left truncate max-w-[260px]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Submit Edit Button */}
              <button
                onClick={handleEdit}
                disabled={generating || !editInstruction.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-stone-950 font-black text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Gemini Image Edits...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 text-stone-950" />
                    <span>Apply AI Image Edits</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Active Image Showcase & Preview (Right) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Showcase Preview</span>
              </span>
              {activeImage && (
                <span className="text-stone-400 text-[11px] font-mono">
                  {new Date(activeImage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="relative group flex-1 min-h-[340px] bg-stone-950 rounded-2xl border border-stone-800/80 overflow-hidden flex items-center justify-center">
              {generating ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-white">Rendering your artwork...</div>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Gemini 3.1 Flash Image Preview is processing composition, style, and lighting.
                  </p>
                </div>
              ) : activeImage ? (
                <>
                  <img
                    src={activeImage.imageUrl}
                    alt={activeImage.prompt}
                    className="w-full h-full object-contain max-h-[460px] rounded-2xl"
                    loading="lazy"
                  />
                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4 backdrop-blur-[2px]">
                    <button
                      onClick={() => setModalImage(activeImage)}
                      className="p-3 bg-stone-900/90 hover:bg-stone-800 text-white rounded-2xl border border-stone-700 shadow-xl transition cursor-pointer"
                      title="View Full Size"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(activeImage.imageUrl, activeImage.prompt)}
                      className="p-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-2xl font-bold shadow-xl transition cursor-pointer"
                      title="Download Image"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStartEditFromImage(activeImage)}
                      className="px-3 py-3 bg-stone-900/90 hover:bg-stone-800 text-amber-300 rounded-2xl border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 shadow-xl transition cursor-pointer"
                      title="Remix & Edit this Image"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit with AI</span>
                    </button>
                    <button
                      onClick={() => handleCopyLink(activeImage.imageUrl, activeImage.id)}
                      className="p-3 bg-stone-900/90 hover:bg-stone-800 text-white rounded-2xl border border-stone-700 shadow-xl transition cursor-pointer"
                      title="Copy Direct Link"
                    >
                      {copiedId === activeImage.id ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 space-y-2 text-stone-500">
                  <Palette className="w-12 h-12 mx-auto text-stone-700" />
                  <p className="text-sm font-semibold">No artwork generated yet</p>
                  <p className="text-xs text-stone-600">
                    Type a prompt above or click an inspiration idea to start!
                  </p>
                </div>
              )}
            </div>

            {/* Active Image Metadata Details */}
            {activeImage && (
              <div className="mt-4 pt-3 border-t border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate max-w-[280px]">
                    "{activeImage.prompt}"
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEditFromImage(activeImage)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Remix</span>
                    </button>
                    <button
                      onClick={() => handleDownload(activeImage.imageUrl, activeImage.prompt)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download HD</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Family Creations Gallery */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Family Artwork Gallery</h3>
              <p className="text-xs text-stone-400">
                All masterpieces created by household members ({gallery.length} images)
              </p>
            </div>
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-xs">
            No family artwork created yet. Be the first to generate one above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {gallery.map((img) => (
              <div
                key={img.id}
                onClick={() => setActiveImage(img)}
                className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-200 aspect-square ${
                  activeImage?.id === img.id
                    ? 'border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'border-stone-800/80 hover:border-stone-700 bg-stone-950'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-stone-200 font-mono">
                      {img.style}
                    </span>
                    <button
                      onClick={(e) => handleDelete(img.id, e)}
                      className="p-1 rounded-lg bg-black/60 text-stone-400 hover:text-red-400 transition"
                      title="Delete from family gallery"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-white truncate">"{img.prompt}"</p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                      <span>{img.authorName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditFromImage(img);
                        }}
                        className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5"
                      >
                        <span>Edit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 z-10 p-2.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={modalImage.imageUrl}
              alt={modalImage.prompt}
              className="max-h-[80vh] w-auto object-contain rounded-3xl shadow-2xl border border-stone-800"
            />

            <div className="mt-4 flex items-center justify-between w-full max-w-2xl px-2 text-stone-300">
              <span className="text-xs font-semibold truncate max-w-md">"{modalImage.prompt}"</span>
              <button
                onClick={() => handleDownload(modalImage.imageUrl, modalImage.prompt)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Size</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
