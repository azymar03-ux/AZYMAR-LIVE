import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, Bell, Moon, Sun, Menu, X, Star, Heart,
  Play, ChevronLeft, ChevronRight, Zap, Flame, Sparkles,
  Gamepad2, Trophy, Users, Clock, Share2, Maximize2,
  ArrowRight, Mail, Twitter, Instagram, Linkedin,
  MessageCircle, Shield, HelpCircle, BookOpen, Layers,
  Car, Compass, Puzzle, Swords, Music, Ghost,
  Building2, Globe, Joystick, Upload, ShieldCheck,
  Trash2, ToggleLeft, ToggleRight, Package, Eye, EyeOff,
  CheckCircle2, AlertCircle, FolderOpen, Settings, Pencil, Database,
  Dices, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabaseClient";
import { loadZipGame } from "@/lib/zipPlayer";
import azymarLogo from "@/imports/azymar_logo_new.png";
import synthwaveBg from "@/imports/synthwave_bg.jpg";
import gameCharacter from "@/imports/game_character.png";
import floatingController from "@/imports/floating_controller_transparent.png";
import doodles from "@/imports/doodles.png";
import pacmanSprites from "@/imports/pacman_sprites.png";
import pixelCat from "@/imports/pixel_cat.png";
import blackGamepad from "@/imports/black_gamepad.png";
import bowlingStrike from "@/imports/bowling_strike.png";
import omgBubble from "@/imports/omg_bubble.png";
import flamingEightball from "@/imports/flaming_eightball.png";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Game {
  id: number;
  title: string;
  genre: string;
  rating: number;
  ratingCount?: number;
  plays: string;
  badge?: "HOT" | "NEW" | "TRENDING";
  color: string;
  emoji: string;
  uploadedAt?: string;
  visible?: boolean;
  zipFile?: File;
  isUploaded?: boolean;
  thumbnailUrl?: string;
}

interface UploadEntry {
  id: number;
  file: File;
  thumbnailFile?: File | null;
  thumbnailUrl?: string;
  title: string;
  genre: string;
  emoji: string;
  color: string;
  status: "pending" | "processing" | "ready" | "error";
  progress: number;
  visible: boolean;
  uploadedAt: string;
  size: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GAMES: Game[] = [];

export const ALL_CATEGORIES = [
  { name: "Action", icon: Swords, color: "#EF4444" },
  { name: "Adventure", icon: Compass, color: "#F59E0B" },
  { name: "Puzzle", icon: Puzzle, color: "#8B5CF6" },
  { name: "Racing", icon: Car, color: "#3B82F6" },
  { name: "Shooting", icon: Trophy, color: "#EC4899" },
  { name: "Strategy", icon: Building2, color: "#10B981" },
  { name: "Arcade", icon: Joystick, color: "#F97316" },
  { name: "Horror", icon: Ghost, color: "#6B7280" },
  { name: "Sports", icon: Trophy, color: "#22C55E" },
  { name: "Casual", icon: Music, color: "#EC4899" },
  { name: "Multiplayer", icon: Users, color: "#06B6D4" },
  { name: "Simulation", icon: Building2, color: "#10B981" },
];

const GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Puzzle",
  "Racing",
  "Shooting",
  "Strategy",
  "Arcade",
  "Horror",
  "Sports",
  "Casual",
  "Multiplayer",
  "Simulation",
];

const RECOMMENDED: any[] = [];

// ─── Badge component ──────────────────────────────────────────────────────────

function Badge({ type }: { type: "HOT" | "NEW" | "TRENDING" }) {
  const styles = {
    HOT: "bg-red-600 text-white",
    NEW: "bg-neutral-800 text-white border border-neutral-700",
    TRENDING: "bg-primary text-primary-foreground",
  };
  const icons = { HOT: <Flame size={10} />, NEW: <Sparkles size={10} />, TRENDING: <Zap size={10} /> };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[2px] text-[9px] font-black uppercase tracking-wider ${styles[type]}`}>
      {icons[type]} {type}
    </span>
  );
}

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({
  game,
  onPlay,
  isAdmin,
  onAdminDelete,
  isFavorite,
  onToggleFavorite,
}: {
  game: Game;
  onPlay: (g: Game) => void;
  isAdmin?: boolean;
  onAdminDelete?: (id: number, isDbGame: boolean) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all flex flex-col group"
    >
      {/* Thumbnail Area */}
      <div
        onClick={() => onPlay(game)}
        className="h-40 w-full relative overflow-hidden bg-slate-100 cursor-pointer"
      >
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${game.color}25 0%, ${game.color}55 100%)` }}
          >
            <span>{game.emoji}</span>
          </div>
        )}

        {/* Action / Category Tag at top-left or badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="bg-white/90 backdrop-blur-md text-[10px] font-semibold text-slate-700 uppercase px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">
            {game.genre}
          </span>
          {game.badge && (
            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
              {game.badge}
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(game.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 hover:bg-white backdrop-blur-md text-slate-500 border border-slate-200 shadow-sm transition-colors cursor-pointer"
        >
          <Heart
            size={13}
            className={isFavorite ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"}
          />
        </button>

        {isAdmin && game.isUploaded && onAdminDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdminDelete(game.id, game.isUploaded || false);
              toast.success("Game removed");
            }}
            className="absolute top-2.5 right-10 p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm truncate group-hover:text-teal-600 transition-colors">
            {game.title}
          </h3>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px] font-medium text-amber-700">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>{game.rating}</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-600">
              <span>{game.plays} PLAYS</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onPlay(game)}
          className="mt-3 w-full bg-[#0D9488] hover:bg-[#0F766E] text-white py-2 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        >
          Play Now
        </button>
      </div>
    </motion.div>
  );
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({
  onClose,
  setUser,
  setShowAdmin,
  navigateTo,
}: {
  onClose: () => void;
  setUser: (user: any) => void;
  setShowAdmin?: (show: boolean) => void;
  navigateTo?: (page: "home" | "signin" | "account") => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({
        email,
        user_metadata: {
          full_name: email.split("@")[0],
        },
      });
      toast.success("Welcome to AZYMAR! (Local Mode) 🎮");
      setLoading(false);
      onClose();
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo?.("home");
      }
      return;
    }

    try {
      if (tab === "login") {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (email === "azymar03@gmail.com" && password === "azymar#123") {
              const { error: signUpError } = await supabase.auth.signUp({ email, password });
              if (signUpError) throw signUpError;
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError) throw signInError;
            } else {
              throw error;
            }
          }
        } catch (authErr: any) {
          if (email === "azymar03@gmail.com" && password === "azymar#123") {
            setUser({
              email,
              id: "local-admin-uid",
              user_metadata: { full_name: "Admin" }
            });
            toast.success("Welcome back to AZYMAR! (Admin Local Mode) 🎮");
          } else {
            throw authErr;
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created successfully! Check your email to confirm.");
      }
      onClose();
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo?.("home");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    if (!supabase) {
      const toastId = toast.loading(`Logging in with ${provider}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUser({
        email: `gamer@${provider}.com`,
        user_metadata: {
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Gamer`,
        },
      });
      toast.success(`Welcome to AZYMAR! Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} (Local Mode) 🎮`, { id: toastId });
      onClose();
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`OAuth login failed: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none p-8 w-full max-w-md neo-shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AzymarLogo size={28} />
              <span className="font-black text-foreground text-lg tracking-wide uppercase">AZYMAR</span>
            </div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Your gaming universe awaits</p>
          </div>
          <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-3 border-black p-1 bg-neutral-900 mb-6 rounded-none">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === t 
                  ? "bg-primary text-primary-foreground border-2 border-black [box-shadow:2px_2px_0px_0px_#000000]" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          {tab === "login" && (
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold uppercase tracking-wider text-[10px]">
                <input type="checkbox" className="accent-primary border-2 border-black rounded-none" /> Remember me
              </label>
              <button type="button" className="hover:text-primary transition-colors font-bold uppercase tracking-wider text-[10px]">Forgot password?</button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="bg-card px-2">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "google" as const, label: "Google", icon: "🌐" },
            { id: "discord" as const, label: "Discord", icon: "💬" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleOAuth(p.id)}
              className="flex items-center justify-center gap-2 py-2.5 bg-white text-black border-3 border-black rounded-none text-sm font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AZYMAR Logo ─────────────────────────────────────────────────────────────

function AzymarLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={azymarLogo}
      alt="AZYMAR logo"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}

function PacmanCharacter({ 
  id, 
  size = 64, 
  className = "" 
}: { 
  id: number; 
  size?: number; 
  className?: string; 
}) {
  const col = id % 4;
  const row = Math.floor(id / 4);
  const posX = (col * 100) / 3;
  const posY = row * 100;

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${pacmanSprites})`,
        backgroundSize: "400% 200%",
        backgroundPosition: `${posX}% ${posY}%`,
        backgroundRepeat: "no-repeat"
      }}
    />
  );
}

function ConsoleSymbol({ type, size = 200 }: { type: "square" | "triangle" | "circle" | "x"; size?: number }) {
  const strokeWidth = 12;
  const colorMap = {
    triangle: "#22c55e", // Green
    circle: "#ef4444",   // Red
    x: "#3b82f6",        // Blue
    square: "#ec4899"    // Pink
  };
  const color = colorMap[type];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className="filter drop-shadow-[6px_6px_0px_rgba(0,0,0,1)]"
    >
      {type === "circle" && (
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
        />
      )}
      {type === "square" && (
        <rect 
          x="15" 
          y="15" 
          width="70" 
          height="70" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          rx="4"
        />
      )}
      {type === "triangle" && (
        <polygon 
          points="50,12 88,82 12,82" 
          fill="none" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round"
        />
      )}
      {type === "x" && (
        <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="80" y1="20" x2="20" y2="80" />
        </g>
      )}
    </svg>
  );
}

// ─── Hero AZYMAR illustration ─────────────────────────────────────────────────

function HeroIllustration() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[380px] w-full py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-72 h-72 rounded-full border-2 border-dashed border-primary/20"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        className="absolute w-52 h-52 rounded-full border border-dashed border-[#00D4C8]/30"
      />
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-36 h-36 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-primary/30 p-3">
          <img src={azymarLogo} alt="AZYMAR" className="w-full h-full object-contain" />
        </div>
        <p className="mt-4 text-3xl font-black text-foreground tracking-widest">AZYMAR</p>
      </motion.div>
      {/* Floating icons */}
      {[
        { emoji: "🏎️", top: "5%", left: "12%", delay: 0 },
        { emoji: "⚔️", top: "12%", right: "12%", delay: 0.5 },
        { emoji: "🎮", bottom: "18%", left: "10%", delay: 1 },
        { emoji: "🏆", bottom: "8%", right: "14%", delay: 1.5 },
        { emoji: "⭐", top: "45%", left: "4%", delay: 0.8 },
      ].map((f, i) => (
        <motion.div
          key={i}
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
          className="absolute text-2xl"
          style={{ top: f.top, left: (f as any).left, right: (f as any).right, bottom: f.bottom }}
        >
          {f.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Admin Panel ─────────────────────────────────────────────────────────────
const EMOJI_OPTIONS = ["🎮", "🚀", "⚔️", "🏎️", "👻", "🧩", "🏆", "🎯", "🌊", "🔥", "🌿", "🎲", "🛸", "🦊", "🐉"];
const COLOR_OPTIONS = ["#11B5A4", "#7C3AED", "#EF4444", "#F59E0B", "#3B82F6", "#EC4899", "#10B981", "#F97316", "#06B6D4", "#8B5CF6"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function AdminPanel({
  uploads,
  dbGames,
  onUpload,
  onToggleVisible,
  onDelete,
  onClose,
  onEditGame,
}: {
  uploads: UploadEntry[];
  dbGames: Game[];
  onUpload: (entry: UploadEntry) => void;
  onToggleVisible: (id: number, isDbGame: boolean) => void;
  onDelete: (id: number, isDbGame: boolean) => void;
  onClose: () => void;
  onEditGame?: (id: number, isDbGame: boolean, updatedFields: { title: string; genre: string; thumbnailFile?: File | null; gameFile?: File | null }) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const [draggingThumbnail, setDraggingThumbnail] = useState(false);
  const [form, setForm] = useState({ title: "", genre: "Action", emoji: "🎮", color: "#11B5A4" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [tab, setTab] = useState<"upload" | "manage">("upload");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const totalStorageMB = 1024; // 1GB limit
  const usedStorageMB = 150 + (uploads.length * 25) + (dbGames.length * 15); // Mock calculation
  const storageLeftMB = Math.max(0, totalStorageMB - usedStorageMB);
  const storagePercent = Math.min(100, (usedStorageMB / totalStorageMB) * 100);

  const [editingItem, setEditingItem] = useState<{
    id: number;
    isDbGame: boolean;
    title: string;
    genre: string;
    thumbnailUrl: string;
  } | null>(null);

  const [editForm, setEditForm] = useState({ title: "", genre: "Action" });
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const editThumbnailInputRef = useRef<HTMLInputElement>(null);
  const [draggingEditThumbnail, setDraggingEditThumbnail] = useState(false);
  const [editGameFile, setEditGameFile] = useState<File | null>(null);
  const [draggingEditGame, setDraggingEditGame] = useState(false);
  const editGameInputRef = useRef<HTMLInputElement>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setEditForm({
        title: editingItem.title,
        genre: editingItem.genre,
      });
      setEditThumbnail(null);
      setEditThumbnailPreview(editingItem.thumbnailUrl);
      setEditGameFile(null);
    }
  }, [editingItem]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const displayItems = [
    ...uploads.map(u => ({
      id: u.id,
      title: u.title,
      genre: u.genre,
      emoji: u.emoji,
      color: u.color,
      status: u.status,
      progress: u.progress,
      visible: u.visible,
      uploadedAt: u.uploadedAt,
      size: u.size || "Uploading...",
      isDbGame: false,
      thumbnailUrl: u.thumbnailUrl || "",
    })),
    ...dbGames
      .filter((g) => !uploads.some((u) => u.title.toLowerCase() === g.title.toLowerCase()))
      .map(g => ({
        id: g.id,
        title: g.title,
        genre: g.genre,
        emoji: g.emoji,
        color: g.color,
        status: "ready" as const,
        progress: 100,
        visible: g.visible !== false,
        uploadedAt: g.uploadedAt ? new Date(g.uploadedAt).toLocaleString() : "Previously uploaded",
        size: "Saved in DB",
        isDbGame: true,
        thumbnailUrl: g.thumbnailUrl || "",
      }))
  ];

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".zip")) {
      toast.error("Only .zip files are supported");
      return;
    }
    const namePart = file.name.replace(/\.zip$/i, "").replace(/[-_]/g, " ");
    const titleCased = namePart.replace(/\b\w/g, (c) => c.toUpperCase());
    setForm((f) => ({ ...f, title: titleCased }));
    setPendingFile(file);
  };

  const handleThumbnail = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast.error("Only image files are supported for thumbnails");
      return;
    }
    setPendingThumbnail(file);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleSubmit = () => {
    if (!pendingFile) { toast.error("Please select a ZIP file first"); return; }
    if (!pendingThumbnail) { toast.error("Please upload a thumbnail image first"); return; }
    if (!form.title.trim()) { toast.error("Game title is required"); return; }

    const entry: UploadEntry = {
      id: Date.now(),
      file: pendingFile,
      thumbnailFile: pendingThumbnail,
      title: form.title.trim(),
      genre: form.genre,
      emoji: "🎮",
      color: "#11B5A4",
      status: "processing",
      progress: 0,
      visible: true,
      uploadedAt: new Date().toLocaleString(),
      size: formatBytes(pendingFile.size),
    };

    onUpload(entry);
    setPendingFile(null);
    setPendingThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview("");
    }
    setForm({ title: "", genre: "Action", emoji: "🎮", color: "#11B5A4" });
    toast.success(`"${entry.title}" is being processed...`);
    setTab("manage");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none w-full max-w-2xl max-h-[90vh] overflow-hidden neo-shadow-lg flex flex-col"
      >
        {editingItem ? (
          <>
            {/* Edit Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none border-2 border-black bg-primary/10 flex items-center justify-center">
                  <Pencil size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Edit Game</h2>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Modify Title, Genre, and Thumbnail</p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
                <X size={18} />
              </button>
            </div>

            {/* Edit Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Game Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-bold"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Genre</label>
                  <select
                    value={editForm.genre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-bold"
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Thumbnail dropzone */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Update Thumbnail Image</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingEditThumbnail(true); }}
                    onDragLeave={() => setDraggingEditThumbnail(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingEditThumbnail(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        const isImage = file.type.startsWith("image/");
                        if (!isImage) { toast.error("Only image files are supported"); return; }
                        setEditThumbnail(file);
                        setEditThumbnailPreview(URL.createObjectURL(file));
                      }
                    }}
                    onClick={() => editThumbnailInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditThumbnail 
                        ? "border-primary bg-primary/10" 
                        : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={editThumbnailInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isImage = file.type.startsWith("image/");
                          if (!isImage) { toast.error("Only image files are supported"); return; }
                          setEditThumbnail(file);
                          setEditThumbnailPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {editThumbnailPreview ? (
                      <div className="flex items-center gap-4 w-full text-black">
                        <img
                          src={editThumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-20 h-16 object-cover rounded-none border-2 border-black shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs uppercase truncate">{editThumbnail ? editThumbnail.name : "Current Stored Thumbnail"}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                            {editThumbnail ? formatBytes(editThumbnail.size) : "Using saved image"} · Click to replace
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center">
                        <FolderOpen size={24} className="text-neutral-500 mb-1" />
                        <p className="font-bold text-xs uppercase">Drag & drop image or click to browse</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Game File dropzone */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Update Game Files (.zip)</label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingEditGame(true); }}
                    onDragLeave={() => setDraggingEditGame(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDraggingEditGame(false);
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        if (!file.name.endsWith(".zip")) { toast.error("Only .zip files are supported"); return; }
                        setEditGameFile(file);
                      }
                    }}
                    onClick={() => editGameInputRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-6 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditGame 
                        ? "border-primary bg-primary/10" 
                        : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={editGameInputRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.name.endsWith(".zip")) { toast.error("Only .zip files are supported"); return; }
                          setEditGameFile(file);
                        }
                      }}
                    />
                    {editGameFile ? (
                      <div className="flex flex-col items-center justify-center text-black w-full text-center">
                        <p className="font-bold text-xs uppercase truncate w-full px-4">{editGameFile.name}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          {formatBytes(editGameFile.size)} · Click to replace
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4 flex flex-col items-center justify-center">
                        <Upload size={24} className="text-neutral-500 mb-1" />
                        <p className="font-bold text-xs uppercase">Drag & drop .zip file or click to browse</p>
                        <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">Leave blank to keep existing files</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t-3 border-black bg-neutral-900 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setEditingItem(null)}
                className="px-6 py-2.5 bg-white text-black border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!editForm.title.trim()) {
                    toast.error("Please enter a game title");
                    return;
                  }
                  setLoadingEdit(true);
                  try {
                    await onEditGame?.(editingItem.id, editingItem.isDbGame, {
                      title: editForm.title,
                      genre: editForm.genre,
                      thumbnailFile: editThumbnail,
                      gameFile: editGameFile,
                    });
                    setEditingItem(null);
                  } catch (err: any) {
                    toast.error(`Update failed: ${err.message}`);
                  } finally {
                    setLoadingEdit(false);
                  }
                }}
                disabled={loadingEdit || !editForm.title.trim()}
                className="px-6 py-2.5 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none border-2 border-black bg-primary/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Game Upload Manager</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Storage Section */}
                <div className="hidden sm:flex flex-col items-end mr-2" title={`${usedStorageMB} MB / ${totalStorageMB} MB Used`}>
                  <p className="text-[10px] font-black uppercase text-foreground mb-1">
                    Storage: <span className={storageLeftMB < 100 ? "text-red-500" : "text-emerald-500"}>{storageLeftMB > 1000 ? (storageLeftMB / 1024).toFixed(1) + " GB" : storageLeftMB + " MB"} Left</span>
                  </p>
                  <div className="w-32 h-2.5 bg-neutral-800 border-2 border-black rounded-none overflow-hidden relative">
                    <div className={`absolute top-0 left-0 h-full ${storagePercent > 90 ? "bg-red-500" : "bg-primary"}`} style={{ width: `${storagePercent}%` }}></div>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-3 border-black px-6 bg-neutral-900">
              {(["upload", "manage"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-4 transition-all cursor-pointer ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-white"
                  }`}
                >
                  {t === "upload" ? <Upload size={14} /> : <Settings size={14} />}
                  {t === "upload" ? "Upload Game" : "Manage Games"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === "upload" ? (
                <div className="space-y-4">
                  {/* Drag-and-drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-3 border-dashed rounded-none p-8 text-center cursor-pointer transition-all ${
                      dragging 
                        ? "border-primary bg-primary/10" 
                        : pendingFile 
                          ? "border-emerald-500 bg-emerald-50/30 text-emerald-800" 
                          : "border-black bg-white text-black hover:border-primary transition-colors"
                    }`}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                    <div className="flex flex-col items-center justify-center">
                      <Upload size={32} className="mb-2 text-neutral-500" />
                      {pendingFile ? (
                        <div>
                          <p className="font-bold text-xs uppercase text-emerald-600">Game zip selected successfully!</p>
                          <p className="font-black text-sm text-black mt-1 uppercase">{pendingFile.name}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold mt-1">{formatBytes(pendingFile.size)} · Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-xs uppercase text-black">Drag & drop game zip folder or click to browse</p>
                          <p className="text-[10px] text-neutral-500 font-semibold mt-1">HTML5 / WebGL games bundled as a standard .zip (must contain index.html at root)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Title input */}
                    <div className="text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1">Game Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="My Awesome Arcade Game"
                        className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-semibold"
                      />
                    </div>

                    {/* Genre select */}
                    <div className="text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1">Genre</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all font-semibold"
                      >
                        {GENRE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 text-foreground">
                      <label className="text-xs font-black uppercase tracking-wider block mb-1.5">Game Thumbnail Image</label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDraggingThumbnail(true); }}
                        onDragLeave={() => setDraggingThumbnail(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDraggingThumbnail(false);
                          const file = e.dataTransfer.files[0];
                          if (file) handleThumbnail(file);
                        }}
                        onClick={() => thumbnailRef.current?.click()}
                        className={`border-3 border-dashed rounded-none p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                          draggingThumbnail 
                            ? "border-primary bg-primary/10" 
                            : pendingThumbnail 
                              ? "border-emerald-500 bg-emerald-50/30" 
                              : "border-black bg-white text-black hover:border-primary transition-colors"
                        }`}
                      >
                        <input
                          ref={thumbnailRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnail(f); }}
                        />
                        {pendingThumbnail ? (
                          <div className="flex items-center gap-3 w-full text-black">
                            {thumbnailPreview && (
                              <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-16 h-12 object-cover rounded-none border-2 border-black shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs uppercase truncate">{pendingThumbnail.name}</p>
                              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{formatBytes(pendingThumbnail.size)} · Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2 flex flex-col items-center justify-center">
                            <FolderOpen size={20} className="text-neutral-500 mb-1" />
                            <p className="font-bold text-xs uppercase">Drag & drop game thumbnail or click to browse</p>
                            <p className="text-[10px] text-neutral-500 font-semibold mt-0.5">PNG, JPG, JPEG or WEBP files</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preview card */}
                  {(pendingFile || pendingThumbnail || form.title) && (
                    <div className="rounded-none border-3 border-black overflow-hidden bg-white text-black neo-shadow">
                      <p className="text-[10px] text-neutral-500 px-4 pt-3 pb-2 font-black uppercase tracking-wider border-b-2 border-black">Preview</p>
                      <div className="px-4 pb-4 pt-2">
                        <div className="flex items-center gap-3 p-3 bg-neutral-100 border-2 border-black rounded-none">
                          <div
                            className="w-12 h-12 rounded-none border-2 border-black flex items-center justify-center text-2xl shrink-0 bg-white overflow-hidden"
                          >
                            {thumbnailPreview ? (
                              <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-neutral-400 text-[10px] font-black uppercase">Image</span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-black text-sm">{form.title || "Untitled Game"}</p>
                            <p className="text-xs text-muted-foreground font-semibold uppercase">{form.genre} · NEW</p>
                          </div>
                          <div className="ml-auto">
                            <span className="text-[9px] font-black text-white bg-red-600 border-2 border-black px-2 py-0.5 rounded-none uppercase tracking-wider">NEW</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!pendingFile || !pendingThumbnail}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} /> Upload & Publish Game
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayItems.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Package size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-bold uppercase tracking-wider text-sm">No games uploaded yet</p>
                      <p className="text-xs mt-1">Switch to the Upload tab to add your first game</p>
                    </div>
                  ) : (
                    displayItems.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-4 rounded-none border-3 border-black bg-card/95 neo-shadow hover:translate-y-[-1px] transition-all"
                      >
                        <div
                          className="w-12 h-12 rounded-none border-2 border-black flex items-center justify-center text-2xl shrink-0 bg-white"
                          style={{ background: `${entry.color}25` }}
                        >
                          {entry.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-foreground text-sm truncate">{entry.title}</p>
                            {entry.status === "processing" && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-200 border border-black px-2 py-0.5 rounded-none uppercase tracking-wider">Processing</span>
                            )}
                            {entry.status === "ready" && (
                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-200 border border-black px-2 py-0.5 rounded-none uppercase tracking-wider">Live</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-semibold uppercase mt-0.5">{entry.genre} · {entry.size} · {entry.uploadedAt}</p>
                          {entry.status === "processing" && (
                            <div className="mt-2 h-2.5 bg-muted border-2 border-black rounded-none overflow-hidden">
                              <motion.div
                                animate={{ width: `${entry.progress}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              setEditingItem({
                                id: entry.id,
                                isDbGame: entry.isDbGame,
                                title: entry.title,
                                genre: entry.genre,
                                thumbnailUrl: entry.thumbnailUrl || ""
                              });
                            }}
                            className="p-2 border-2 border-black bg-yellow-400 text-black rounded-none hover:bg-yellow-500 transition-colors cursor-pointer"
                            title="Edit game details & thumbnail"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onToggleVisible(entry.id, entry.isDbGame)}
                            className={`p-2 border-2 border-black rounded-none transition-colors cursor-pointer ${entry.visible ? "bg-primary text-primary-foreground" : "bg-neutral-800 text-muted-foreground"}`}
                            title={entry.visible ? "Hide from players" : "Show to players"}
                          >
                            {entry.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => onDelete(entry.id, entry.isDbGame)}
                            className="p-2 border-2 border-black bg-red-600 text-white rounded-none hover:bg-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LegalModal({
  activeTab,
  setActiveTab,
  onClose,
}: {
  activeTab: "privacy" | "terms" | "cookies" | "about" | "faq" | "contact";
  setActiveTab: (tab: "privacy" | "terms" | "cookies" | "about" | "faq" | "contact") => void;
  onClose: () => void;
}) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. Data Collection",
          text: "We collect only essential information, specifically your email address and profile metadata when you register or sign in via Supabase Auth or Google/Discord OAuth. This data is used solely to identify your account and personalize your AZYMAR experience.",
        },
        {
          heading: "2. Game & Save Data",
          text: "To preserve your experience, we save metadata regarding your uploaded games, active save states, play progress, ratings, and gameplay statistics on our secure cloud database.",
        },
        {
          heading: "3. Information Security",
          text: "We implement industry-standard encryption and security measures. Since your account is powered by Supabase, authentication is protected by secure token exchange. We never share or sell your personal details to third parties.",
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. Agreement to Terms",
          text: "By accessing or playing games on the AZYMAR platform, you agree to comply with and be bound by these Terms of Service. If you disagree with any part, you must refrain from using the platform.",
        },
        {
          heading: "2. Account Termination",
          text: "We reserve the right to remove any uploaded games or terminate accounts that breach copyright rules, distribute malicious code, or degrade the platform experience without prior notice.",
        },
        {
          heading: "3. Disclaimer & Limitations",
          text: "AZYMAR platform and hosted games are provided 'as is' without warranty of any kind. We are not liable for data loss, browser crash, score reset, or system damages resulting from game executions.",
        },
      ],
    },
    cookies: {
      title: "Cookie Policy",
      subtitle: "Last updated: July 2026",
      paragraphs: [
        {
          heading: "1. What are Cookies?",
          text: "Cookies are small text files placed on your device to help websites run properly. We also use modern browser mechanisms like LocalStorage for game storage.",
        },
        {
          heading: "2. How We Use Cookies",
          text: "We use only strictly essential cookies to manage user session persistence and secure your authentication state. These cookies expire automatically when your session closes.",
        },
        {
          heading: "3. No Advertising Cookies",
          text: "We are committed to a clean user interface. AZYMAR does not use marketing, advertising, profiling, or third-party tracking cookies.",
        },
        {
          heading: "4. Managing Preferences",
          text: "You can configure your browser to block or erase cookies, but please note that doing so will sign you out and prevent save data or custom game publishing functions from operating correctly.",
        },
      ],
    },
    about: {
      title: "About AZYMAR STUDIO",
      subtitle: "Arcade Gaming Redefined",
      paragraphs: [
        {
          heading: "Our Mission",
          text: "AZYMAR STUDIO is a independant gaming studio.We build interactive tools that enable indie creators and retro gamer to host,publish,and enjoy games instantly",
        },
        {
          heading: "Zero-Install Instant Play",
          text: "By utilizing advanced zip extraction and temporary blob serving, we run complete web games directly inside sandboxed iframe containers, offering full security and native browser execution speeds.",
        },
        {
          heading: "Join The Crew",
          text: "Connect with our creators, subscribe to our newsletter, and help us expand the limits of open-web arcade gaming. Let's make games fun, accessible, and fast.",
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Answers to common questions",
      paragraphs: [
        {
          heading: "Q: How do I play games on AZYMAR?",
          text: "Simply browse our catalog, click on any game card, and hit 'Play Now' or 'Play Free'. The game will launch instantly in our high-performance in-browser container. No installations or downloads are required.",
        },
        {
          heading: "Q: Is AZYMAR free to use?",
          text: "Yes! All games hosted on the AZYMAR playground are 100% free to play. We are committed to keeping web-based gaming open and accessible to all.",
        },
        {
          heading: "Q: How do I save my progress and high scores?",
          text: "You can sign up for a free account. Doing so allows you to track your game progress, save scores, mark games as favorites, and manage your play statistics across devices.",
        },
      ],
    },
    contact: {
      title: "Contact Support",
      subtitle: "We are here to help",
      paragraphs: [
        {
          heading: "Email Support",
          text: "For general inquiries, bug reports, publisher questions, or feedback, send an email to: azymar03@gmail.com. We typically respond within 24-48 hours.",
        },
        {
          heading: "Official Discord Community",
          text: "Join our active community on Discord to discuss games, report issues, and chat directly with developers at: https://discord.gg/dnAXsrr8A",
        },
        {
          heading: "Mailing Address",
          text: "AZYMAR,salem,Tamilnadu,India",
        },
      ],
    },
  };

  const activeContent = content[activeTab];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm text-foreground"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-3 border-black rounded-none w-full max-w-2xl max-h-[85vh] overflow-hidden neo-shadow-lg flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black">
          <div>
            <h2 className="font-black text-foreground text-lg uppercase tracking-wide">Legal Center</h2>
            <p className="text-xs text-muted-foreground uppercase font-semibold">AZYMAR STUDIO</p>
          </div>
          <button onClick={onClose} className="p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b-3 border-black px-6 bg-neutral-900">
          {([
            { id: "about", label: "About Us" },
            { id: "faq", label: "FAQ" },
            { id: "contact", label: "Contact Us" },
            { id: "privacy", label: "Privacy Policy" },
            { id: "terms", label: "Terms of Service" },
            { id: "cookies", label: "Cookie Policy" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-5 py-3.5 text-xs font-black uppercase tracking-wider border-b-4 transition-all cursor-pointer ${
                activeTab === t.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content container */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-900 [&::-webkit-scrollbar-thumb]:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-wide">{activeContent.title}</h1>
            <p className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{activeContent.subtitle}</p>
          </div>
          <div className="space-y-5 border-t-2 border-black pt-5 text-muted-foreground">
            {activeContent.paragraphs.map((p, idx) => (
              <div key={idx} className="space-y-1.5">
                <h3 className="font-black text-foreground uppercase tracking-wide text-sm">{p.heading}</h3>
                <p className="text-sm leading-relaxed text-neutral-300">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t-3 border-black bg-neutral-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}


function SignInView({
  setUser,
  navigateTo,
  setShowAdmin,
}: {
  setUser: (user: any) => void;
  navigateTo: (page: "home" | "signin" | "account") => void;
  setShowAdmin?: (show: boolean) => void;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    if (!supabase) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setUser({
        email,
        user_metadata: {
          full_name: email.split("@")[0],
        },
      });
      toast.success("Welcome to AZYMAR! (Local Mode) 🎮");
      setLoading(false);
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo("home");
      } else {
        navigateTo("account");
      }
      return;
    }

    try {
      if (tab === "login") {
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            if (email === "azymar03@gmail.com" && password === "azymar#123") {
              const { error: signUpError } = await supabase.auth.signUp({ email, password });
              if (signUpError) throw signUpError;
              const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
              if (signInError) throw signInError;
            } else {
              throw error;
            }
          }
        } catch (authErr: any) {
          if (email === "azymar03@gmail.com" && password === "azymar#123") {
            setUser({
              email,
              id: "local-admin-uid",
              user_metadata: { full_name: "Admin" }
            });
            toast.success("Welcome back to AZYMAR! (Admin Local Mode) 🎮");
          } else {
            throw authErr;
          }
        }
        toast.success("Welcome back to AZYMAR! 🎮");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created successfully! Check your email to confirm.");
      }
      if (email === "azymar03@gmail.com") {
        setShowAdmin?.(true);
        navigateTo("home");
      } else {
        navigateTo("account");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "discord") => {
    if (!supabase) {
      const toastId = toast.loading(`Logging in with ${provider}...`);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUser({
        email: `gamer@${provider}.com`,
        user_metadata: {
          full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Gamer`,
        },
      });
      toast.success(`Welcome to AZYMAR! Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)} (Local Mode) 🎮`, { id: toastId });
      navigateTo("account");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/?page=account`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(`OAuth login failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative text-foreground">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
      <div className="bg-card border-3 border-black rounded-none p-8 w-full max-w-md neo-shadow-lg relative z-10">
        {/* Close Button to return home */}
        <button
          onClick={() => navigateTo("home")}
          className="absolute top-4 right-4 p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none"
          title="Close and return home"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <AzymarLogo size={36} />
            <span className="font-black text-foreground text-2xl tracking-wide uppercase">AZYMAR</span>
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Sign in to your game hub</p>
        </div>

        <div className="flex border-3 border-black p-1 bg-neutral-900 mb-6 rounded-none">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tab === t 
                  ? "bg-primary text-primary-foreground border-2 border-black [box-shadow:2px_2px_0px_0px_#000000]" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {t === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-none border-3 border-black bg-white text-black text-sm focus:outline-none focus:bg-yellow-50 [box-shadow:2px_2px_0px_0px_#000000] focus:translate-x-[-1px] focus:translate-y-[-1px] focus:[box-shadow:3px_3px_0px_0px_#000000] transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-black" />
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="bg-card px-2">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "google" as const, label: "Google", icon: "🌐" },
            { id: "discord" as const, label: "Discord", icon: "💬" },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => handleOAuth(p.id)}
              className="flex items-center justify-center gap-2 py-2.5 bg-white text-black border-3 border-black rounded-none text-sm font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
            >
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountView({
  user,
  navigateTo,
  favorites,
  allGames,
  toggleFavorite,
  handlePlayGame,
}: {
  user: any;
  navigateTo: (page: "home" | "signin" | "account") => void;
  favorites: number[];
  allGames: Game[];
  toggleFavorite: (gameId: number) => void;
  handlePlayGame: (game: Game) => void;
}) {
  const favoriteGames = allGames.filter((g) => favorites.includes(g.id));
  const avatarSrc = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 relative text-foreground">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />

      {/* Top action bar with Close button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigateTo("home")}
          className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none text-xs font-black uppercase tracking-wider"
          title="Close and return home"
        >
          <X size={16} /> Close & Return Home
        </button>
      </div>
      
      {/* Success banner */}
      <div className="bg-emerald-500/10 text-emerald-400 border-3 border-emerald-500 p-6 rounded-none flex items-center gap-4 neo-shadow">
        <div className="w-12 h-12 bg-emerald-500 text-neutral-900 border-2 border-black flex items-center justify-center text-2xl shrink-0 font-bold">
          ✓
        </div>
        <div>
          <h2 className="font-black text-lg uppercase tracking-wide">Account Signed In Successfully!</h2>
          <p className="text-sm font-medium text-emerald-400/80">Welcome back, your session is active and secure.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Profile Card */}
        <div className="bg-card border-3 border-black rounded-none p-6 neo-shadow space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-none border-3 border-black bg-primary/10 flex items-center justify-center font-black text-primary text-3xl mb-4 overflow-hidden">
              {avatarSrc ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src={avatarSrc} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <span style={{ display: 'none' }} className="w-full h-full flex items-center justify-center font-black text-primary text-3xl">
                    {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              ) : (
                (user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="font-black text-xl text-foreground uppercase tracking-wide">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </h3>
            <span className="text-[10px] text-primary border-2 border-black px-2 py-0.5 mt-2 uppercase font-black tracking-wider bg-primary/10">
              Verified Player
            </span>
          </div>

          <div className="border-t-3 border-black pt-5 space-y-3.5 text-xs font-semibold uppercase tracking-wider">
            <div>
              <span className="text-muted-foreground block mb-0.5">Email address</span>
              <span className="text-foreground font-bold normal-case text-sm">{user?.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">User identifier ID</span>
              <span className="text-foreground font-mono text-[10px] select-all break-all">{user?.id || "N/A"}</span>
            </div>
          </div>

          <button
            onClick={() => navigateTo("home")}
            className="w-full py-3 bg-white text-black border-3 border-black rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-1.5 cursor-pointer"
          >
            ← Back to Arcade
          </button>
        </div>

        {/* Favorites and activities */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border-3 border-black rounded-none p-6 neo-shadow">
            <h3 className="font-black text-lg text-foreground uppercase tracking-wide mb-5 flex items-center gap-2">
              ❤️ Favorited Games ({favoriteGames.length})
            </h3>
            
            {favoriteGames.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-700 bg-neutral-900/50">
                <span className="text-4xl">👾</span>
                <h4 className="font-bold text-foreground mt-3 uppercase tracking-wide">No favorites yet</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                  Explore our premium retro game arcade catalog and heart games to save them here.
                </p>
                <button
                  onClick={() => navigateTo("home")}
                  className="mt-4 px-5 py-2 bg-primary text-primary-foreground border-2 border-black rounded-none text-xs font-black uppercase tracking-wider neo-btn neo-btn-hover cursor-pointer"
                >
                  Browse Games
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {favoriteGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex border-2 border-black bg-neutral-900 rounded-none overflow-hidden items-center group relative p-3 gap-3"
                  >
                    <div
                      className="w-14 h-14 rounded-none border border-black flex items-center justify-center text-2xl shrink-0"
                      style={{ background: `${game.color}22` }}
                    >
                      {game.thumbnailUrl ? (
                        <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
                      ) : (
                        game.emoji
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-foreground text-sm uppercase tracking-wide truncate">{game.title}</h4>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">{game.genre}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePlayGame(game)}
                        className="p-2 bg-primary text-primary-foreground border border-black rounded-none hover:translate-y-[-1px] transition-transform cursor-pointer"
                        title="Play"
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(game.id)}
                        className="p-2 bg-neutral-800 text-red-500 border border-black rounded-none hover:translate-y-[-1px] transition-transform cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RatingModal({
  game,
  onClose,
  onSubmit
}: {
  game: Game;
  onClose: () => void;
  onSubmit: (gameId: number, rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card border-3 border-black p-8 max-w-sm w-full neo-shadow-lg flex flex-col items-center">
        <h2 className="font-black text-2xl uppercase mb-2 text-center">Rate {game.title}</h2>
        <p className="text-sm font-bold text-neutral-600 mb-6 uppercase text-center">How was the game?</p>
        <div className="flex gap-2 mb-8">
          {[1,2,3,4,5].map(star => (
            <Star
              key={star}
              size={40}
              className={`cursor-pointer transition-colors ${
                star <= (hovered || selected) ? "fill-amber-400 text-amber-400" : "text-neutral-300"
              }`}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(star)}
            />
          ))}
        </div>
        <div className="flex gap-4 w-full">
          <button onClick={onClose} className="flex-1 py-3 border-3 border-black font-black uppercase text-sm hover:bg-neutral-100 transition-colors neo-btn">Skip</button>
          <button onClick={() => { if (selected) { onSubmit(game.id, selected); onClose(); } }} className={`flex-1 py-3 border-3 border-black font-black uppercase text-sm transition-colors neo-btn ${selected ? "bg-primary hover:bg-[#00D4C8]" : "bg-neutral-300 cursor-not-allowed opacity-50"}`}>Submit</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [logoState, setLogoState] = useState<"logo" | "triangle" | "circle" | "x" | "square">("logo");

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setLogoState("triangle");
    }, 600);

    const timer2 = setTimeout(() => {
      setLogoState("circle");
    }, 1100);

    const timer3 = setTimeout(() => {
      setLogoState("x");
    }, 1600);

    const timer4 = setTimeout(() => {
      setLogoState("square");
    }, 2100);

    const timer5 = setTimeout(() => {
      setShowIntro(false);
    }, 2650);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []);

  const [dark, setDark] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [trendingIdx, setTrendingIdx] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [email, setEmail] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [remoteGames, setRemoteGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);
  const [playingGame, setPlayingGame] = useState<Game | null>(null);
  const [gameToRate, setGameToRate] = useState<Game | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        playerContainerRef.current.requestFullscreen().catch(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        });
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleExitGame = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    if (activePlayUrl) {
      URL.revokeObjectURL(activePlayUrl);
    }
    setActivePlayUrl(null);
    setGameToRate(playingGame);
    setPlayingGame(null);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!activePlayUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          toggleFullscreen();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePlayUrl]);

  const handleRandomGame = () => {
    if (allGames.length === 0) {
      toast.info("No games available to roll right now!");
      return;
    }
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
      const randomIndex = Math.floor(Math.random() * allGames.length);
      const picked = allGames[randomIndex];
      toast.success(`🎲 Rolled: ${picked.title}!`);
      setSelectedGame(picked);
    }, 500);
  };

  const handleSubmitRating = async (gameId: number, rating: number) => {
    let newRating = rating;
    let newCount = 1;

    setRemoteGames(prev => prev.map(g => {
      if (g.id === gameId) {
        const currentCount = g.ratingCount || 1;
        const currentTotal = g.rating * currentCount;
        newCount = currentCount + 1;
        newRating = Number(((currentTotal + rating) / newCount).toFixed(1));
        return { ...g, rating: newRating, ratingCount: newCount };
      }
      return g;
    }));

    if (supabase) {
      try {
        // Try updating both rating and rating_count
        const { error } = await supabase.from('games').update({ rating: newRating, rating_count: newCount }).eq('id', gameId);
        if (error) {
          // If rating_count column does not exist, fallback to just updating rating
          const { error: fallbackError } = await supabase.from('games').update({ rating: newRating }).eq('id', gameId);
          if (fallbackError) throw fallbackError;
        }
        toast.success("Rating submitted!");
      } catch (err) {
        console.error("Failed to update rating", err);
      }
    } else {
      toast.success("Rating saved locally!");
    }
  };
  const adminUnlocked = user?.email === "azymar03@gmail.com";

  const [activeLegalTab, setActiveLegalTab] = useState<"privacy" | "terms" | "cookies" | "about" | "faq" | "contact" | null>(null);
  const [currentPage, setCurrentPage] = useState<"home" | "signin" | "account">(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    if (p === "signin" || p === "account") return p;
    return "home";
  });

  const navigateTo = (page: "home" | "signin" | "account") => {
    setCurrentPage(page);
    const params = new URLSearchParams(window.location.search);
    if (page === "home") {
      params.delete("page");
    } else {
      params.set("page", page);
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, document.title, newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("page");
      if (p === "signin" || p === "account") {
        setCurrentPage(p as any);
      } else {
        setCurrentPage("home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        navigateTo("signin");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (currentPage === "account" && !user) {
      navigateTo("signin");
    }
  }, [currentPage, user]);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem("azymar_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("azymar_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (gameId: number) => {
    if (favorites.includes(gameId)) {
      setFavorites((prev) => prev.filter((id) => id !== gameId));
      toast.success("Removed from favorites!");
    } else {
      setFavorites((prev) => [...prev, gameId]);
      toast.success("Added to favorites! ❤️");
    }
  };

  const handleShareGame = (gameId: number, gameTitle: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?game=${gameId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success(`Link for "${gameTitle}" copied to clipboard! 🔗`);
    }).catch(() => {
      toast.error("Failed to copy link.");
    });
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);

  const allGames = [...GAMES, ...remoteGames];

  // Parse share link and legal modals on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const legalTab = params.get("legal");
    if (legalTab === "privacy" || legalTab === "terms" || legalTab === "cookies" || legalTab === "about" || legalTab === "faq" || legalTab === "contact") {
      setActiveLegalTab(legalTab as any);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }

    if (allGames.length > 0) {
      const sharedGameId = params.get("game");
      if (sharedGameId) {
        const gameIdNum = parseInt(sharedGameId, 10);
        const sharedGame = allGames.find((g) => g.id === gameIdNum);
        if (sharedGame) {
          setSelectedGame(sharedGame);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, [allGames.length]);

  // Clean white background style on load
  useEffect(() => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#F8FAFC';
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Listen for Supabase Auth state changes
  useEffect(() => {
    if (!supabase) return;

    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        setShowLogin(false);
        const params = new URLSearchParams(window.location.search);
        const p = params.get("page");
        if (session.user.email === "azymar03@gmail.com") {
          setShowAdmin(true);
          navigateTo("home");
        } else if (p === "signin" || !p) {
          navigateTo("account");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Lock body scroll when game is playing
  useEffect(() => {
    if (activePlayUrl) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activePlayUrl]);

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Sign out failed: ${error.message}`);
      } else {
        toast.success("Signed out successfully");
      }
    } else {
      setUser(null);
      toast.success("Signed out successfully (Local Mode)");
    }
  };

  // Auto-advance trending carousel
  useEffect(() => {
    if (allGames.length === 0) return;
    const t = setInterval(() => setTrendingIdx((i) => (i + 1) % allGames.length), 5000);
    return () => clearInterval(t);
  }, [allGames.length]);

  useEffect(() => {
    async function fetchGames() {
      if (!supabase) {
        setLoadingGames(false);
        return;
      }
      setLoadingGames(true);
      try {
        const { data, error } = await supabase.from('games').select('*');
        if (error) {
          console.error('Error fetching games:', error);
          toast.error('Failed to load games from server.');
          setRemoteGames([]);
        } else {
          const mapped = (data || []).map((g: any) => ({
            id: g.id,
            title: g.title,
            genre: g.genre,
            rating: g.rating,
            plays: g.plays,
            badge: g.badge,
            color: g.color,
            emoji: g.emoji,
            visible: g.visible,
            isUploaded: g.is_uploaded,
            uploadedAt: g.uploaded_at,
            zipUrl: g.zip_url,
            thumbnailUrl: g.thumbnail_url,
          }));
          setRemoteGames(mapped as Game[]);
        }
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoadingGames(false);
      }
    }
    fetchGames();
  }, []);



  const filteredGames = allGames.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleGames = activeCategory
    ? filteredGames.filter((g) => (g.genre || "").trim().toLowerCase() === activeCategory.trim().toLowerCase())
    : filteredGames;

  // Dynamically compute category list and counts based on all uploaded / database games
  const dynamicSidebarCategories = [
    { name: "All Games", icon: Gamepad2, count: allGames.length },
    ...ALL_CATEGORIES.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      count: allGames.filter(
        (g) => (g.genre || "").trim().toLowerCase() === cat.name.toLowerCase()
      ).length,
    })),
  ];

  const spotlightGame = allGames.length > 0
    ? (allGames.find((g) => g.badge === "HOT" || g.badge === "TRENDING") || allGames[0])
    : null;



  const handleUpload = async (entry: UploadEntry) => {
    // 1. Add entry to local uploads state so it shows up in Admin Panel
    setUploads((prev) => [...prev, entry]);

    if (!supabase) {
      // Local Mock Upload Fallback
      // Simulate progress
      for (let i = 10; i <= 90; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, progress: i } : u));
      }

      const newGameId = Date.now();
      const mockBlobUrl = URL.createObjectURL(entry.file);
      let mockThumbnailUrl = "";
      if (entry.thumbnailFile) {
        mockThumbnailUrl = URL.createObjectURL(entry.thumbnailFile);
      }

      const mockGame: Game = {
        id: newGameId,
        title: entry.title,
        genre: entry.genre,
        rating: 0,
        plays: '0',
        badge: 'NEW',
        color: entry.color || '#11B5A4',
        emoji: entry.emoji || '🎮',
        zipUrl: mockBlobUrl,
        thumbnailUrl: mockThumbnailUrl || undefined,
        isUploaded: true,
        uploadedAt: new Date().toISOString(),
        visible: true,
      } as any;

      setRemoteGames((prev) => [...prev, mockGame]);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === entry.id ? { ...u, progress: 100, status: "ready", uploadedAt: new Date().toLocaleString() } : u
        )
      );
      toast.success(`"${entry.title}" is now live (Local Mode)! 🎮`);
      return;
    }

    // 2. Upload ZIP to Supabase Storage
    const filePath = `${entry.title.replace(/\s+/g, "_")}_${Date.now()}.zip`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('game-files')
      .upload(filePath, entry.file);

    if (storageError) {
      toast.error(`Upload failed: ${storageError.message}`);
      setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, status: "error" } : u));
      return;
    }

    // Get public URL of ZIP
    const { data: publicData } = supabase.storage.from('game-files').getPublicUrl(filePath);
    const publicUrl = publicData?.publicUrl;

    // 3. Upload Thumbnail if present
    let thumbnailUrl = "";
    if (entry.thumbnailFile) {
      const ext = entry.thumbnailFile.name.split('.').pop();
      const thumbPath = `${entry.title.replace(/\s+/g, "_")}_thumb_${Date.now()}.${ext}`;
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('game-files')
        .upload(thumbPath, entry.thumbnailFile);

      if (thumbError) {
        console.error('Thumbnail upload failed:', thumbError.message);
      } else {
        const { data: thumbPublicData } = supabase.storage.from('game-files').getPublicUrl(thumbPath);
        thumbnailUrl = thumbPublicData?.publicUrl || "";
      }
    }

    // 4. Insert game metadata into Supabase DB
    const newGame = {
      title: entry.title,
      genre: entry.genre,
      rating: 0,
      plays: '0',
      badge: 'NEW' as const,
      color: '#11B5A4', // default color fallback
      emoji: '🎮', // default emoji fallback
      zip_url: publicUrl,
      thumbnail_url: thumbnailUrl || null,
      is_uploaded: true,
      uploaded_at: new Date().toISOString(),
      visible: true,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('games')
      .insert([newGame])
      .select();

    if (dbError) {
      toast.error(`Database error: ${dbError.message}`);
      setUploads((prev) => prev.map((u) => u.id === entry.id ? { ...u, status: "error" } : u));
      return;
    }

    // 5. Update the local uploads array status to "ready"
    setUploads((prev) =>
      prev.map((u) =>
        u.id === entry.id ? { ...u, progress: 100, status: "ready", uploadedAt: new Date().toLocaleString() } : u
      )
    );

    // 6. Instantly push to remoteGames state so it displays dynamically
    if (dbData && dbData[0]) {
      const g = dbData[0];
      const mappedGame: Game = {
        id: g.id,
        title: g.title,
        genre: g.genre,
        rating: g.rating,
        plays: g.plays,
        badge: g.badge,
        color: g.color,
        emoji: g.emoji,
        visible: g.visible,
        isUploaded: g.is_uploaded,
        uploadedAt: g.uploaded_at,
        zipUrl: g.zip_url,
        thumbnailUrl: g.thumbnail_url,
      } as any;
      setRemoteGames((prev) => [...prev, mappedGame]);
    }

    toast.success(`"${entry.title}" is now live! 🎮`);
  };

  const handleToggleVisible = async (id: number, isDbGame: boolean) => {
    if (isDbGame) {
      const game = remoteGames.find((g) => g.id === id);
      if (!game) return;
      const nextVisible = !game.visible;
      setRemoteGames((prev) =>
        prev.map((g) => (g.id === id ? { ...g, visible: nextVisible } : g))
      );
      if (!supabase) {
        toast.info("Visibility updated locally (Local Mode).");
        return;
      }
      const { error } = await supabase
        .from('games')
        .update({ visible: nextVisible })
        .eq('id', id);
      if (error) {
        toast.error(`Failed to update visibility: ${error.message}`);
        setRemoteGames((prev) =>
          prev.map((g) => (g.id === id ? { ...g, visible: !nextVisible } : g))
        );
      } else {
        toast.success(`Game visibility updated!`);
      }
    } else {
      setUploads((prev) => prev.map((u) => u.id === id ? { ...u, visible: !u.visible } : u));
    }
  };

  const handleDeleteUpload = async (id: number, isDbGame: boolean) => {
    if (isDbGame) {
      const game = remoteGames.find((g) => g.id === id);
      if (!game) return;
      const toastId = toast.loading(`Deleting "${game.title}"...`);
      if (!supabase) {
        setRemoteGames((prev) => prev.filter((g) => g.id !== id));
        toast.success(`"${game.title}" deleted locally!`, { id: toastId });
        return;
      }
      try {
        const { error: dbError } = await supabase
          .from('games')
          .delete()
          .eq('id', id);
        if (dbError) throw dbError;
        setRemoteGames((prev) => prev.filter((g) => g.id !== id));
        toast.success(`"${game.title}" deleted successfully!`, { id: toastId });
      } catch (err: any) {
        console.error(err);
        toast.error(`Delete failed: ${err.message}`, { id: toastId });
      }
    } else {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleEditGame = async (
    id: number,
    isDbGame: boolean,
    updatedFields: { title: string; genre: string; thumbnailFile?: File | null; gameFile?: File | null }
  ) => {
    const toastId = toast.loading(`Updating "${updatedFields.title}"...`);
    try {
      let nextThumbnailUrl: string | undefined = undefined;
      let nextZipUrl: string | undefined = undefined;

      if (isDbGame) {
        if (!supabase) {
          if (updatedFields.thumbnailFile) {
            nextThumbnailUrl = URL.createObjectURL(updatedFields.thumbnailFile);
          }
          if (updatedFields.gameFile) {
            nextZipUrl = URL.createObjectURL(updatedFields.gameFile);
          }
          setRemoteGames((prev) =>
            prev.map((g) =>
              g.id === id
                ? {
                    ...g,
                    title: updatedFields.title,
                    genre: updatedFields.genre,
                    ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                    ...(nextZipUrl ? { zipUrl: nextZipUrl } : {}),
                  }
                : g
            )
          );
          toast.success("Game updated locally! 🎮", { id: toastId });
          return;
        }

        if (updatedFields.thumbnailFile) {
          const ext = updatedFields.thumbnailFile.name.split('.').pop();
          const thumbPath = `${updatedFields.title.replace(/\s+/g, "_")}_thumb_${Date.now()}.${ext}`;
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from('game-files')
            .upload(thumbPath, updatedFields.thumbnailFile);

          if (thumbError) {
            throw new Error(`Thumbnail upload failed: ${thumbError.message}`);
          }
          const { data: thumbPublicData } = supabase.storage.from('game-files').getPublicUrl(thumbPath);
          nextThumbnailUrl = thumbPublicData?.publicUrl || "";
        }

        if (updatedFields.gameFile) {
          const filePath = `${updatedFields.title.replace(/\s+/g, "_")}_${Date.now()}.zip`;
          const { data: storageData, error: storageError } = await supabase.storage
            .from('game-files')
            .upload(filePath, updatedFields.gameFile);

          if (storageError) {
            throw new Error(`Game file upload failed: ${storageError.message}`);
          }
          const { data: publicData } = supabase.storage.from('game-files').getPublicUrl(filePath);
          nextZipUrl = publicData?.publicUrl || "";
        }

        const updateData: any = {
          title: updatedFields.title,
          genre: updatedFields.genre,
        };
        if (nextThumbnailUrl) {
          updateData.thumbnail_url = nextThumbnailUrl;
        }
        if (nextZipUrl) {
          updateData.zip_url = nextZipUrl;
        }

        const { error: dbError } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', id);

        if (dbError) throw dbError;

        setRemoteGames((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: updatedFields.title,
                  genre: updatedFields.genre,
                  ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                  ...(nextZipUrl ? { zipUrl: nextZipUrl } : {}),
                }
              : g
          )
        );
        toast.success(`"${updatedFields.title}" updated successfully! 🎮`, { id: toastId });
      } else {
        if (updatedFields.thumbnailFile) {
          nextThumbnailUrl = URL.createObjectURL(updatedFields.thumbnailFile);
        }
        setUploads((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  title: updatedFields.title,
                  genre: updatedFields.genre,
                  ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                  ...(updatedFields.gameFile ? { file: updatedFields.gameFile } : {}),
                }
              : u
          )
        );
        toast.success("Local upload entry updated!", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Update failed: ${err.message}`, { id: toastId });
    }
  };

  const handlePlayGame = async (game: Game, launchFullscreen = false) => {
    // Increment plays locally
    const currentPlaysStr = typeof game.plays === 'string' ? game.plays : String(game.plays || '0');
    let currentPlays = parseInt(currentPlaysStr.replace(/[^0-9]/g, ''), 10) || 0;
    
    // Handle 'K' or 'M' suffixes if they exist
    if (currentPlaysStr.toUpperCase().includes('K')) currentPlays *= 1000;
    if (currentPlaysStr.toUpperCase().includes('M')) currentPlays *= 1000000;
    
    const nextPlaysStr = String(currentPlays + 1);

    setRemoteGames((prev) =>
      prev.map((g) => (g.id === game.id ? { ...g, plays: nextPlaysStr } : g))
    );

    // Update in Supabase (background)
    if (supabase && (game.isUploaded || (game as any).zipUrl !== undefined)) {
      supabase
        .from('games')
        .update({ plays: nextPlaysStr })
        .eq('id', game.id)
        .then(({ error }) => {
          if (error) console.error("Failed to update play count:", error);
        });
    }

    if ((game.isUploaded || (game as any).zipUrl) && (game as any).zipUrl) {
      const toastId = toast.loading(`Loading "${game.title}"...`);
      try {
        const response = await fetch((game as any).zipUrl);
        if (!response.ok) throw new Error('Failed to fetch game file.');
        const blob = await response.blob();
        const playUrl = await loadZipGame(blob);
        setActivePlayUrl(playUrl);
        setPlayingGame(game as any);
        setSelectedGame(null);
        toast.dismiss(toastId);
        if (launchFullscreen) {
          setTimeout(() => toggleFullscreen(), 350);
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`Error starting game: ${err.message}`, { id: toastId });
      }
    } else {
      toast.success(`Launching ${game.title}! 🎮`);
      setSelectedGame(null);
    }
  };

  const navLinks = ["Home", "Games", "About"];

  const scrollToGames = () => {
    gamesRef.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const scrollToTrending = () => {
    trendingRef.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenu(false);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      if (!supabase) {
        toast.success("You're subscribed locally! 🎮 Game on!");
        setEmail("");
        return;
      }
      const { error } = await supabase.from('subscribers').insert([{ email }]);
      if (error) {
        toast.error('Subscription failed');
      } else {
        toast.success("You're subscribed! 🎮 Game on!");
      }
      setEmail("");
    }
  };

  return (
    <div 
      className="min-h-screen text-foreground transition-colors duration-300"
    >
      {/* Intro Preloader Animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              x: "-100vw", 
              transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
            }}
            className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
          >
            {/* Massive Logo Container */}
            <motion.div
              initial={{ y: -150, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] md:w-[500px] md:h-[500px] flex items-center justify-center pointer-events-none filter drop-shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
            >
              <AnimatePresence mode="wait">
                {logoState === "logo" ? (
                  <motion.img 
                    key="logo"
                    initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    src={azymarLogo} 
                    alt="Preloader Icon" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <motion.div
                    key={logoState}
                    initial={{ opacity: 0, scale: 0.7, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 45 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <ConsoleSymbol type={logoState} size={260} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-4xl sm:text-6xl font-black text-black mt-8 uppercase tracking-widest font-azymar-logo"
            >
              AZYMAR
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); navigateTo("home"); }} 
            className="flex items-center gap-2.5 shrink-0 group select-none cursor-pointer"
          >
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AzymarLogo size={36} />
            </div>
            <span className="font-black text-xl tracking-wider text-slate-900 font-azymar-logo uppercase group-hover:text-teal-600 transition-colors">
              AZYMAR
            </span>
          </a>

          {/* Nav links removed as requested */}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <AnimatePresence>
                {searchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden relative"
                  >
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        scrollToGames();
                      }}
                      onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                      placeholder="Search games..."
                      className="w-full pl-9 pr-4 py-1.5 rounded-full text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 shadow-sm"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Search"
                  >
                    <Search size={19} />
                  </button>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div 
                  onClick={() => navigateTo("account")}
                  className="hidden md:flex flex-col items-end mr-1 cursor-pointer group"
                >
                  <span className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition-colors">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500">Player</span>
                </div>
                
                {/* User Avatar */}
                <div 
                  onClick={() => navigateTo("account")}
                  className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center font-bold text-teal-700 text-xs overflow-hidden cursor-pointer"
                >
                  {(user?.user_metadata?.full_name || user?.email || "?").charAt(0).toUpperCase()}
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 border border-slate-300 hover:border-red-500 hover:text-red-600 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : null}

            {adminUnlocked && (
              <button
                onClick={() => setShowAdmin(true)}
                title="Admin Panel"
                className="p-2 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <ShieldCheck size={18} />
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1"
            >
              {[
                { name: "Home", action: () => navigateTo("home") },
                { name: "Games", action: () => { navigateTo("home"); scrollToGames(); } },
                { name: "About", action: () => setActiveLegalTab("about") },
              ].map((link) => (
                <button
                  key={link.name}
                  onClick={() => { setMobileMenu(false); link.action(); }}
                  className="text-left px-3 py-2 text-sm font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  {link.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {currentPage === "signin" ? (
        <SignInView setUser={setUser} navigateTo={navigateTo} setShowAdmin={setShowAdmin} />
      ) : currentPage === "account" ? (
        <AccountView
          user={user}
          navigateTo={navigateTo}
          favorites={favorites}
          allGames={allGames}
          toggleFavorite={toggleFavorite}
          handlePlayGame={handlePlayGame}
        />
      ) : (
        <>
          {/* ── Top Hero Header Area with Playful Characters & Big Controller Wireframe ── */}
          <section className="relative overflow-hidden pt-8 pb-10 bg-[#F8FAFC] border-b border-slate-200">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Floating retro animated characters */}
            {[
              { type: "pacman", id: 0, style: { left: "4%", top: "16%" }, size: 90, duration: 6, delay: 0, animate: { y: [0, -12, 0], x: [0, 6, 0], rotate: [0, 3, -3, 0] } },
              { type: "pacman", id: 1, style: { left: "18%", top: "6%" }, size: 80, duration: 5.5, delay: 0.5, animate: { y: [0, 10, 0], x: [0, -8, 0], rotate: [0, -4, 4, 0] } },
              { type: "image", src: pixelCat, style: { left: "32%", top: "8%" }, size: 95, duration: 5, delay: 0.3, animate: { y: [0, -10, 0], rotate: [0, 5, -5, 0] } },
              { type: "image", src: flamingEightball, style: { left: "44%", bottom: "10%" }, size: 85, duration: 6.8, delay: 0.7, animate: { y: [0, -12, 0], x: [0, 4, -4, 0], rotate: [0, 8, -8, 0] } },
            ].map((char, index) => (
              <motion.div
                key={index}
                style={{ position: "absolute", ...char.style }}
                animate={char.animate}
                whileHover={{ scale: 1.2, rotate: [0, -10, 10, -10, 0], y: -10 }}
                transition={{ 
                  y: { repeat: Infinity, duration: char.duration, ease: "easeInOut" },
                  x: { repeat: Infinity, duration: char.duration, ease: "easeInOut" },
                  delay: char.delay
                }}
                className="hidden xl:block z-0 pointer-events-auto filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)] opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                {char.type === "pacman" ? (
                  <PacmanCharacter id={char.id!} size={char.size} />
                ) : (
                  <img src={char.src} alt="Arcade Asset" style={{ width: char.size, height: char.size, objectFit: "contain" }} />
                )}
              </motion.div>
            ))}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Column: Heading + Subtitle + Filters */}
              <div className="flex-1 w-full max-w-2xl">
                {/* Decorative neon squiggles/shapes */}
                <div className="flex items-center gap-2 mb-2 text-teal-600 text-xs font-mono">
                  <span className="text-pink-500">⚡</span>
                  <span className="tracking-widest uppercase text-slate-500 font-bold">Discover & Play Free</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
                  All Games
                </h1>
                <p className="mt-2.5 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Discover our collection of fun and exciting games. Play instantly in your browser with zero downloads.
                </p>

                {/* Search Bar */}
                <div className="mt-6 flex items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search games..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-teal-600 shadow-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Quick Trending Tags */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                    <Flame size={12} className="text-amber-500" /> Popular:
                  </span>
                  {["Action", "Arcade", "Puzzle", "Racing"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setActiveCategory(activeCategory === tag ? null : tag);
                        gamesRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                        activeCategory === tag
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-600 text-slate-600 shadow-xs"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Innovative Interactive Arcade Hub */}
              <div className="w-full lg:w-auto shrink-0 flex justify-center lg:justify-end">
                <div className="w-full sm:w-[380px] lg:w-[420px] bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-5 relative overflow-hidden transition-all hover:shadow-2xl hover:border-teal-300">
                  {/* Top glowing accent gradient bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500" />
                  
                  {/* Header bar inside card */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-[11px] font-bold uppercase tracking-wider border border-teal-100">
                        <Sparkles size={12} className="text-teal-500 fill-teal-500" />
                        Daily Spotlight
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">Free Instant Play</span>
                    </div>
                  </div>

                  {/* Body: Spotlight Game or Arcade Showcase */}
                  {spotlightGame ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => setSelectedGame(spotlightGame)}>
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                          {spotlightGame.thumbnailUrl ? (
                            <img
                              src={spotlightGame.thumbnailUrl}
                              alt={spotlightGame.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">
                              {spotlightGame.emoji || "🎮"}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white/90 text-teal-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <Play size={14} className="fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600">
                              {spotlightGame.genre}
                            </span>
                            {spotlightGame.badge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-amber-100 text-amber-700">
                                {spotlightGame.badge}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                            {spotlightGame.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                            <div className="flex items-center gap-1 text-amber-500 font-semibold">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              <span>{spotlightGame.rating}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-slate-400" />
                              <span>{spotlightGame.plays || "1.2k"} plays</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Action CTA Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={() => setSelectedGame(spotlightGame)}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Play size={13} className="fill-white" />
                          <span>Play Spotlight</span>
                        </button>
                        <button
                          onClick={handleRandomGame}
                          disabled={isRolling}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
                        >
                          <motion.div animate={isRolling ? { rotate: 360 } : {}} transition={{ repeat: isRolling ? Infinity : 0, duration: 0.3 }}>
                            <Dices size={14} className="text-teal-600" />
                          </motion.div>
                          <span>{isRolling ? "Rolling..." : "Surprise Me 🎲"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex items-center justify-center text-3xl">
                          🎮
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Instant Arcade Ready</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Click below to upload or explore newly added web games!</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          onClick={() => {
                            if (adminUnlocked) setShowAdmin(true);
                            else gamesRef.current?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          {adminUnlocked ? <Upload size={13} /> : <Gamepad2 size={13} />}
                          <span>{adminUnlocked ? "Upload Game" : "Explore Games"}</span>
                        </button>
                        <button
                          onClick={handleRandomGame}
                          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-95 transition-all cursor-pointer"
                        >
                          <Dices size={14} className="text-teal-600" />
                          <span>Surprise Me 🎲</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Micro feature pills / specs */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                        <Zap size={11} className="text-amber-500 fill-amber-500" /> 0s Load
                      </div>
                      <div className="text-[9px] text-slate-400">Instant HTML5</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                        <Gamepad2 size={11} className="text-teal-500" /> 100% Free
                      </div>
                      <div className="text-[9px] text-slate-400">No Downloads</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <div className="text-[11px] font-bold text-slate-800 flex items-center justify-center gap-1">
                        <Trophy size={11} className="text-indigo-500" /> Cloud
                      </div>
                      <div className="text-[9px] text-slate-400">Progress Saved</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Main Dashboard Layout: Sidebar + Games Grid ── */}
          <div className="w-full bg-[#F8FAFC] min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ── Left Sidebar (Categories, Top Rated, Request Box) ── */}
                <aside className="lg:col-span-3 space-y-6">
                  {/* Categories Card */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      Categories
                    </h3>
                    <div className="space-y-1">
                      {dynamicSidebarCategories.map((cat) => {
                        const isSelected = (!activeCategory && cat.name === "All Games") || (activeCategory === cat.name);
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.name}
                            onClick={() => setActiveCategory(cat.name === "All Games" ? null : cat.name)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              isSelected
                                ? "bg-teal-50 text-teal-700 font-semibold border border-teal-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon size={15} className={isSelected ? "text-teal-600" : "text-slate-400"} />
                              <span>{cat.name}</span>
                            </div>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                              isSelected ? "text-teal-700 bg-teal-100/70" : "text-slate-500 bg-slate-100"
                            }`}>
                              {cat.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Rated Games Card */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      Top Rated
                    </h3>
                    <div className="space-y-3.5">
                      {allGames.slice(0, 5).map((tr) => (
                        <div
                          key={tr.id}
                          onClick={() => setSelectedGame(tr)}
                          className="flex items-center gap-3 group cursor-pointer"
                        >
                          {tr.thumbnailUrl ? (
                            <img
                              src={tr.thumbnailUrl}
                              alt={tr.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 group-hover:border-teal-500/50 transition-colors"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-lg">
                              {tr.emoji || "🎮"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-800 group-hover:text-teal-600 truncate transition-colors">
                              {tr.title}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-500">
                              <Star size={10} className="fill-amber-400 text-amber-400" />
                              <span>{tr.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {allGames.length === 0 && (
                        <p className="text-xs text-slate-400 py-2">No games uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Can't find your game? Request a Game Card */}
                  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm text-center relative overflow-hidden group">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 text-xl">
                      🎮
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                      Can't find your game?
                    </h4>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Request a game and we'll add it to our collection!
                    </p>
                    <button
                      onClick={() => {
                        window.location.href = "mailto:azymar03@gmail.com?subject=Game%20Request";
                      }}
                      className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Request a Game
                    </button>
                  </div>
                </aside>

                {/* ── Main Content Area: Games 4-Column Grid ── */}
                <main className="lg:col-span-9 space-y-8" ref={gamesRef}>
                  {visibleGames.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                        {visibleGames.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            onPlay={setSelectedGame}
                            isAdmin={adminUnlocked}
                            onAdminDelete={handleDeleteUpload}
                            isFavorite={favorites.includes(game.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>

                      {/* Pagination Bar */}
                      <div className="flex items-center justify-center gap-2 pt-8">
                        <button className="w-8 h-8 rounded-lg bg-[#2DD4BF] text-[#021F1B] font-bold text-xs flex items-center justify-center cursor-pointer shadow-sm">
                          1
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-sm">
                          2
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer shadow-sm">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-24 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
                      <Gamepad2 size={44} className="mx-auto mb-3 opacity-40 text-teal-600" />
                      <p className="font-semibold text-slate-900">No games found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or selected category.</p>
                    </div>
                  )}
                </main>

              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 text-slate-900 py-14 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <AzymarLogo size={36} />
                <span className="font-black text-xl text-slate-900 font-azymar-logo uppercase tracking-wider">AZYMAR</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                Your ultimate destination for free online gaming. Play, discover, and connect with millions of gamers worldwide.
              </p>
              <div className="flex gap-2.5 mt-5">
                {[
                  { icon: Linkedin, label: "LinkedIn", url: "https://www.linkedin.com/company/azymar/" },
                  { icon: (props: { size: number }) => (
                    <svg viewBox="0 0 24 24" width={props.size} height={props.size} fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ), label: "X", url: "https://x.com/azymar03" },
                  { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/azymar_studios/" },
                ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-400/50 transition-colors"
                  >
                    <s.icon size={15} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "COMPANY",
                links: [
                  { icon: BookOpen, label: "About" },
                  { icon: Shield, label: "Privacy" },
                  { icon: Layers, label: "Terms" },
                  { icon: Globe, label: "Cookies" },
                ],
              },
              {
                title: "SUPPORT",
                links: [
                  { icon: HelpCircle, label: "FAQ" },
                  { icon: Mail, label: "Contact" },
                  { icon: MessageCircle, label: "Discord" },
                  { icon: Gamepad2, label: "Games" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-bold text-slate-800 tracking-wider mb-4 uppercase">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <button
                        onClick={() => {
                          const label = l.label.toLowerCase();
                          if (
                            label === "about" ||
                            label === "privacy" ||
                            label === "terms" ||
                            label === "cookies" ||
                            label === "faq" ||
                            label === "contact"
                          ) {
                            setActiveLegalTab(label as any);
                            if (label === "contact") {
                              window.location.href = "mailto:azymar03@gmail.com";
                            }
                          } else if (label === "discord") {
                            window.open("https://discord.com/channels/1523952210780880936/1523952211225215079", "_blank");
                          } else if (label === "games") {
                            gamesRef.current?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
                      >
                        <l.icon size={13} className="text-slate-400" /> {l.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Newsletter */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 tracking-wider mb-4 uppercase">NEWSLETTER</h4>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">Get the latest games and updates.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="px-3.5 py-2 rounded-lg text-xs border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 transition-colors shadow-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#021F1B] rounded-lg text-xs font-bold transition-all shadow-md shadow-teal-500/10 cursor-pointer active:scale-95"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 AZYMAR. All rights reserved.</p>
            <p>Made with ❤️ for gamers worldwide</p>
          </div>
        </div>
      </footer>

      {/* ── Game Details Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGame && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedGame(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card border-3 border-black rounded-none w-full max-w-lg overflow-hidden neo-shadow-lg"
            >
              <div
                className="h-52 flex items-center justify-center text-7xl relative overflow-hidden border-b-3 border-black"
                style={{ background: `linear-gradient(135deg, ${selectedGame.color}30, ${selectedGame.color}60)` }}
              >
                {selectedGame.thumbnailUrl ? (
                  <img src={selectedGame.thumbnailUrl} alt={selectedGame.title} className="w-full h-full object-cover" />
                ) : (
                  selectedGame.emoji
                )}
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 right-4 p-2 border-2 border-black bg-white text-black hover:bg-primary transition-colors cursor-pointer rounded-none"
                >
                  <X size={16} />
                </button>
                {selectedGame.badge && (
                  <div className="absolute top-4 left-4">
                    <Badge type={selectedGame.badge} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-wide">{selectedGame.title}</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-foreground">{selectedGame.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">{selectedGame.genre} · {selectedGame.plays} plays</p>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Dive into the world of {selectedGame.title}. An exciting {selectedGame.genre.toLowerCase()} experience designed to keep you entertained for hours. Compete, explore, and conquer.
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handlePlayGame(selectedGame)}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-none font-black text-xs uppercase tracking-wider neo-btn neo-btn-hover flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" /> Play Now
                  </button>
                  <button
                    onClick={() => handleShareGame(selectedGame.id, selectedGame.title)}
                    title="Share Game"
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Share2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedGame.id)}
                    title={favorites.includes(selectedGame.id) ? "Remove from Favorites" : "Add to Favorites"}
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Heart size={16} className={favorites.includes(selectedGame.id) ? "fill-red-600 text-red-600" : ""} />
                  </button>
                  <button
                    onClick={() => handlePlayGame(selectedGame, true)}
                    title="Launch Fullscreen"
                    className="w-12 h-12 bg-white text-black border-3 border-black rounded-none flex items-center justify-center neo-btn neo-btn-hover cursor-pointer"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Login Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} setUser={setUser} setShowAdmin={setShowAdmin} navigateTo={navigateTo} />}
        {gameToRate && <RatingModal game={gameToRate} onClose={() => setGameToRate(null)} onSubmit={handleSubmitRating} />}
      </AnimatePresence>

      {/* ── Admin Panel Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdmin && (
          <AdminPanel
            uploads={uploads}
            dbGames={remoteGames.filter((g) => g.isUploaded || (g as any).zipUrl)}
            onUpload={handleUpload}
            onToggleVisible={handleToggleVisible}
            onDelete={handleDeleteUpload}
            onClose={() => setShowAdmin(false)}
            onEditGame={handleEditGame}
          />
        )}
      </AnimatePresence>

      {/* ── Fullscreen Game Player ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activePlayUrl && (
          <motion.div
            ref={playerContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 left-0 w-screen h-screen z-50 flex flex-col bg-slate-950 animate-in fade-in duration-300"
          >
            {/* Header bar */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-xl shrink-0">
                  {playingGame?.emoji || "🎮"}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 text-sm truncate max-w-[170px] sm:max-w-xs">{playingGame?.title}</h2>
                  <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider">{playingGame?.genre}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Full Screen Toggle Option */}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Full Screen (F)" : "Enter Full Screen (F)"}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isFullscreen
                      ? "bg-slate-800 hover:bg-slate-700 text-white"
                      : "bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#021F1B] shadow-teal-500/20"
                  }`}
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  <span className="hidden sm:inline">{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
                </button>

                {/* Exit Game Button */}
                <button
                  onClick={handleExitGame}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <X size={14} />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            {/* Iframe container */}
            <div className="w-full flex-1 bg-black relative overflow-hidden flex items-center justify-center">
              <iframe
                src={activePlayUrl}
                className="w-full h-full border-none bg-black"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                allow="autoplay; fullscreen *; gamepad; keyboard"
                allowFullScreen={true}
              />

              {/* Floating Fullscreen Toggle Button in bottom-right corner for quick access */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
                className="absolute bottom-4 right-4 z-20 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer group"
              >
                {isFullscreen ? (
                  <Minimize2 size={18} className="group-hover:text-teal-400 transition-colors" />
                ) : (
                  <Maximize2 size={18} className="group-hover:text-teal-400 transition-colors" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Legal Center Modal ──────────────────────────────────────────────── */}
      {activeLegalTab && (
        <LegalModal
          activeTab={activeLegalTab}
          setActiveTab={setActiveLegalTab}
          onClose={() => setActiveLegalTab(null)}
        />
      )}

    </div>
  );
}
