import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Search, Bell, Moon, Sun, Menu, X, Star, Heart,
  Play, ChevronLeft, ChevronRight, Zap, Flame, Sparkles,
  Gamepad2, Trophy, Users, Clock, Share2, Maximize2,
  ArrowRight, Mail, Twitter, Instagram, Linkedin, Youtube,
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
  developerName?: string;
  developerYoutube?: string;
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
  developerName?: string;
  developerYoutube?: string;
  badge?: "HOT" | "NEW" | "TRENDING";
  rating?: number;
  plays?: string;
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

          {/* Developer Attribution with YouTube Link */}
          {game.developerName && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <span className="text-[10px] text-slate-400">By</span>
              {game.developerYoutube ? (
                <a
                  href={game.developerYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={`Visit ${game.developerName} on YouTube`}
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-red-600 transition-colors group/dev truncate"
                >
                  <Youtube size={12} className="text-red-600 fill-red-600 shrink-0 group-hover/dev:scale-110 transition-transform" />
                  <span className="truncate max-w-[130px] underline decoration-slate-300 hover:decoration-red-600">{game.developerName}</span>
                </a>
              ) : (
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">{game.developerName}</span>
              )}
            </div>
          )}

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
  onEditGame?: (
    id: number,
    isDbGame: boolean,
    updatedFields: {
      title: string;
      genre: string;
      developerName?: string;
      developerYoutube?: string;
      rating?: number;
      plays?: string;
      badge?: "HOT" | "NEW" | "TRENDING" | "";
      thumbnailFile?: File | null;
      gameFile?: File | null;
    }
  ) => Promise<void>;
}) {
  const [dragging, setDragging] = useState(false);
  const [draggingThumbnail, setDraggingThumbnail] = useState(false);
  const [tab, setTab] = useState<"manage" | "upload" | "stats">("manage");
  
  // Upload Form State
  const [form, setForm] = useState({
    title: "",
    genre: "Action",
    developerName: "",
    developerYoutube: "",
    emoji: "🎮",
    color: "#11B5A4",
    badge: "NEW" as "HOT" | "NEW" | "TRENDING" | "",
    rating: 5.0,
    plays: "100",
  });
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  // Search & Filter in Admin Panel
  const [adminSearch, setAdminSearch] = useState("");
  const [adminCategoryFilter, setAdminCategoryFilter] = useState("All");

  const totalStorageMB = 1024;
  const usedStorageMB = 150 + (uploads.length * 25) + (dbGames.length * 15);
  const storageLeftMB = Math.max(0, totalStorageMB - usedStorageMB);
  const storagePercent = Math.min(100, (usedStorageMB / totalStorageMB) * 100);

  // Edit / Customization Modal State
  const [editingItem, setEditingItem] = useState<{
    id: number;
    isDbGame: boolean;
    title: string;
    genre: string;
    thumbnailUrl: string;
    developerName?: string;
    developerYoutube?: string;
    rating?: number;
    plays?: string;
    badge?: "HOT" | "NEW" | "TRENDING" | "";
  } | null>(null);

  const [editForm, setEditForm] = useState({
    title: "",
    genre: "Action",
    developerName: "",
    developerYoutube: "",
    rating: 5.0,
    plays: "0",
    badge: "" as "HOT" | "NEW" | "TRENDING" | "",
  });
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
        developerName: editingItem.developerName || "",
        developerYoutube: editingItem.developerYoutube || "",
        rating: editingItem.rating ?? 5.0,
        plays: editingItem.plays || "0",
        badge: (editingItem.badge || "") as any,
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
      developerName: u.developerName || "",
      developerYoutube: u.developerYoutube || "",
      rating: u.rating ?? 5.0,
      plays: u.plays || "0",
      badge: u.badge,
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
        uploadedAt: g.uploadedAt ? new Date(g.uploadedAt).toLocaleDateString() : "Saved in DB",
        size: "Saved in DB",
        isDbGame: true,
        thumbnailUrl: g.thumbnailUrl || "",
        developerName: g.developerName || "",
        developerYoutube: g.developerYoutube || "",
        rating: g.rating ?? 5.0,
        plays: g.plays || "0",
        badge: g.badge,
      }))
  ];

  // Filtered games in admin
  const filteredDisplayItems = displayItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      item.genre.toLowerCase().includes(adminSearch.toLowerCase()) ||
      item.developerName.toLowerCase().includes(adminSearch.toLowerCase());
    const matchesCategory = adminCategoryFilter === "All" || item.genre.toLowerCase() === adminCategoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

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
      emoji: form.emoji || "🎮",
      color: form.color || "#11B5A4",
      status: "processing",
      progress: 0,
      visible: true,
      uploadedAt: new Date().toLocaleString(),
      size: formatBytes(pendingFile.size),
      developerName: form.developerName.trim() || undefined,
      developerYoutube: form.developerYoutube.trim() || undefined,
      badge: (form.badge || undefined) as any,
      rating: form.rating,
      plays: form.plays,
    };

    onUpload(entry);
    setPendingFile(null);
    setPendingThumbnail(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview("");
    }
    setForm({
      title: "",
      genre: "Action",
      developerName: "",
      developerYoutube: "",
      emoji: "🎮",
      color: "#11B5A4",
      badge: "NEW",
      rating: 5.0,
      plays: "100",
    });
    toast.success(`"${entry.title}" is being processed with developer credits!`);
    setTab("manage");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col transition-all"
      >
        {editingItem ? (
          <>
            {/* ── Edit / Full Game Customizer Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Pencil size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Full Game Customizer</h2>
                  <p className="text-xs text-slate-500">Edit metadata, developer info, YouTube channel, and game files</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Edit Form Body ── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Game Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Genre */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Genre / Category</label>
                  <select
                    value={editForm.genre}
                    onChange={(e) => setEditForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors bg-white cursor-pointer"
                  >
                    {GENRE_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Developer Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <span>Developer Name</span>
                    <span className="text-[10px] text-teal-600 font-semibold">(Shows on frontend)</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.developerName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, developerName: e.target.value }))}
                    placeholder="e.g. AZYMAR Studios"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Developer YouTube Link */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Youtube size={14} className="text-red-600 fill-red-600" />
                    <span>YouTube Channel Link</span>
                  </label>
                  <input
                    type="url"
                    value={editForm.developerYoutube}
                    onChange={(e) => setEditForm(prev => ({ ...prev, developerYoutube: e.target.value }))}
                    placeholder="https://www.youtube.com/@channel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1">
                    <Star size={13} className="text-amber-500 fill-amber-500" />
                    <span>Rating (0.0 - 5.0)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editForm.rating}
                    onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Plays Count */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5 flex items-center gap-1">
                    <Users size={13} className="text-teal-600" />
                    <span>Custom Plays Display</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.plays}
                    onChange={(e) => setEditForm(prev => ({ ...prev, plays: e.target.value }))}
                    placeholder="e.g. 1.5K or 450"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors"
                  />
                </div>

                {/* Badge Selection */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Game Badge</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "", label: "No Badge" },
                      { id: "HOT", label: "🔥 HOT" },
                      { id: "NEW", label: "⚡ NEW" },
                      { id: "TRENDING", label: "✨ TRENDING" },
                    ].map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => setEditForm(prev => ({ ...prev, badge: b.id as any }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editForm.badge === b.id
                            ? "bg-teal-600 text-white shadow-sm"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thumbnail dropzone */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-slate-700">Update Thumbnail Image</label>
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
                    className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditThumbnail 
                        ? "border-teal-500 bg-teal-50/50" 
                        : "border-slate-300 bg-slate-50 hover:border-teal-500 hover:bg-white"
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
                      <div className="flex items-center gap-3 w-full">
                        <img
                          src={editThumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-16 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 truncate">{editThumbnail ? editThumbnail.name : "Current Thumbnail"}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Click or drag to replace image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 flex flex-col items-center justify-center">
                        <FolderOpen size={22} className="text-slate-400 mb-1" />
                        <p className="font-semibold text-xs text-slate-600">Click to upload new thumbnail</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Game File dropzone */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1.5 text-slate-700">Update Game File (.zip)</label>
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
                    className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                      draggingEditGame 
                        ? "border-teal-500 bg-teal-50/50" 
                        : "border-slate-300 bg-slate-50 hover:border-teal-500 hover:bg-white"
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
                      <div className="flex flex-col items-center justify-center w-full text-center py-1">
                        <p className="font-bold text-xs text-teal-700 truncate w-full px-2">{editGameFile.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{formatBytes(editGameFile.size)} · Click to replace</p>
                      </div>
                    ) : (
                      <div className="text-center py-2 flex flex-col items-center justify-center">
                        <Upload size={22} className="text-slate-400 mb-1" />
                        <p className="font-semibold text-xs text-slate-600">Drag & drop new .zip file</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Leave empty to keep existing build</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Edit Footer ── */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">All edits are reflected immediately on the live frontend.</span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
                        developerName: editForm.developerName.trim(),
                        developerYoutube: editForm.developerYoutube.trim(),
                        rating: editForm.rating,
                        plays: editForm.plays,
                        badge: editForm.badge,
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
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loadingEdit ? "Saving..." : "Save Customizations"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── Main Admin Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base">AZYMAR Admin Studio</h2>
                  <p className="text-xs text-slate-500">Full platform customization, game management & developer credits</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Storage Meter */}
                <div className="hidden sm:flex flex-col items-end mr-1" title={`${usedStorageMB} MB / ${totalStorageMB} MB Used`}>
                  <p className="text-[11px] font-semibold text-slate-700 mb-1">
                    Storage: <span className={storageLeftMB < 100 ? "text-red-500 font-bold" : "text-teal-600 font-bold"}>{storageLeftMB > 1000 ? (storageLeftMB / 1024).toFixed(1) + " GB" : storageLeftMB + " MB"} Left</span>
                  </p>
                  <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden relative">
                    <div className={`absolute top-0 left-0 h-full ${storagePercent > 90 ? "bg-red-500" : "bg-teal-500"}`} style={{ width: `${storagePercent}%` }} />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Navigation Tabs ── */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 bg-white">
              {[
                { id: "manage", label: `Games Manager (${displayItems.length})`, icon: Gamepad2 },
                { id: "upload", label: "Upload New Game", icon: Upload },
                { id: "stats", label: "Live Overview", icon: Trophy },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── Tab Contents ── */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              {tab === "upload" && (
                <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  {/* ZIP dropzone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragging 
                        ? "border-teal-500 bg-teal-50/40" 
                        : pendingFile 
                          ? "border-teal-500 bg-teal-50/20 text-teal-900" 
                          : "border-slate-300 hover:border-teal-400 hover:bg-slate-50"
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
                      <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mb-2">
                        <Upload size={22} />
                      </div>
                      {pendingFile ? (
                        <div>
                          <p className="font-bold text-xs uppercase text-teal-700">Game ZIP selected!</p>
                          <p className="font-bold text-sm text-slate-900 mt-0.5">{pendingFile.name}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{formatBytes(pendingFile.size)} · Click to change file</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-xs uppercase text-slate-800">Drag & drop game zip folder or click to browse</p>
                          <p className="text-[11px] text-slate-500 mt-1">HTML5 / WebGL games bundled as a standard .zip (must contain index.html at root)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Game Title</label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="My Awesome Arcade Game"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors shadow-2xs"
                      />
                    </div>

                    {/* Genre */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Genre</label>
                      <select
                        value={form.genre}
                        onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors bg-white cursor-pointer shadow-2xs"
                      >
                        {GENRE_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    {/* Developer Name */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1 flex items-center gap-1.5">
                        <span>Developer Name</span>
                        <span className="text-[10px] text-teal-600 font-semibold">(Custom Attribution)</span>
                      </label>
                      <input
                        type="text"
                        value={form.developerName}
                        onChange={(e) => setForm((f) => ({ ...f, developerName: e.target.value }))}
                        placeholder="e.g. AZYMAR Studios"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors shadow-2xs"
                      />
                    </div>

                    {/* Developer YouTube Link */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1 flex items-center gap-1.5">
                        <Youtube size={14} className="text-red-600 fill-red-600" />
                        <span>Developer YouTube Channel URL</span>
                      </label>
                      <input
                        type="url"
                        value={form.developerYoutube}
                        onChange={(e) => setForm((f) => ({ ...f, developerYoutube: e.target.value }))}
                        placeholder="https://www.youtube.com/@channel"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors shadow-2xs"
                      />
                    </div>

                    {/* Badge Selection */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Badge</label>
                      <select
                        value={form.badge}
                        onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value as any }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors bg-white cursor-pointer shadow-2xs"
                      >
                        <option value="">No Badge</option>
                        <option value="HOT">🔥 HOT</option>
                        <option value="NEW">⚡ NEW</option>
                        <option value="TRENDING">✨ TRENDING</option>
                      </select>
                    </div>

                    {/* Initial Rating */}
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Initial Rating</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={form.rating}
                        onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-teal-600 transition-colors shadow-2xs"
                      />
                    </div>

                    {/* Thumbnail uploader */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">Game Thumbnail Image</label>
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
                        className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all ${
                          draggingThumbnail 
                            ? "border-teal-500 bg-teal-50/40" 
                            : pendingThumbnail 
                              ? "border-teal-500 bg-teal-50/20" 
                              : "border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-white"
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
                          <div className="flex items-center gap-3.5 w-full">
                            {thumbnailPreview && (
                              <img
                                src={thumbnailPreview}
                                alt="Thumbnail preview"
                                className="w-16 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-slate-900 truncate">{pendingThumbnail.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">{formatBytes(pendingThumbnail.size)} · Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-2 flex flex-col items-center justify-center">
                            <FolderOpen size={22} className="text-slate-400 mb-1" />
                            <p className="font-bold text-xs text-slate-700">Drag & drop game thumbnail or click to browse</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, WEBP formats supported</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Card Preview */}
                  {(pendingFile || pendingThumbnail || form.title) && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Live Preview Card</p>
                      <div className="flex items-center gap-3.5 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="w-14 h-14 rounded-lg border border-slate-200 flex items-center justify-center text-2xl shrink-0 bg-slate-100 overflow-hidden">
                          {thumbnailPreview ? (
                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <span>{form.emoji || "🎮"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 text-sm truncate">{form.title || "Untitled Game"}</p>
                            {form.badge && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">{form.badge}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{form.genre}</span>
                            {form.developerName && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-700 font-semibold">
                                  {form.developerYoutube && <Youtube size={12} className="text-red-600 fill-red-600" />}
                                  {form.developerName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!pendingFile || !pendingThumbnail}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-teal-500/10 transition-all"
                  >
                    <Upload size={16} /> Upload & Publish to Live Playground
                  </button>
                </div>
              )}

              {tab === "manage" && (
                <div className="space-y-4">
                  {/* Search & Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Search games by title, genre, or developer..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-teal-600"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={adminCategoryFilter}
                        onChange={(e) => setAdminCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        {GENRE_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setTab("upload")}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Upload size={13} />
                        <span>Add Game</span>
                      </button>
                    </div>
                  </div>

                  {/* Games List */}
                  {filteredDisplayItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
                      <Package size={40} className="mx-auto mb-3 opacity-30 text-teal-600" />
                      <p className="font-bold text-slate-800 text-sm">No matching games found</p>
                      <p className="text-xs text-slate-500 mt-1">Try clearing your search query or upload a new game.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredDisplayItems.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition-all shadow-xs"
                        >
                          {/* Thumbnail */}
                          <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {entry.thumbnailUrl ? (
                              <img src={entry.thumbnailUrl} alt={entry.title} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl">{entry.emoji || "🎮"}</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm truncate">{entry.title}</h4>
                              {entry.badge && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  {entry.badge}
                                </span>
                              )}
                              {!entry.visible && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700">
                                  Hidden
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{entry.genre}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
                                <Star size={11} className="fill-amber-400 text-amber-400" /> {entry.rating}
                              </span>
                              <span>•</span>
                              <span className="text-[11px] text-slate-500">{entry.plays} plays</span>
                              
                              {/* Developer badge */}
                              {entry.developerName && (
                                <>
                                  <span>•</span>
                                  {entry.developerYoutube ? (
                                    <a
                                      href={entry.developerYoutube}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 border border-red-200/60 px-2 py-0.5 rounded"
                                    >
                                      <Youtube size={12} className="text-red-600 fill-red-600" />
                                      <span>{entry.developerName}</span>
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-600 font-semibold">By {entry.developerName}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingItem({
                                  id: entry.id,
                                  isDbGame: entry.isDbGame,
                                  title: entry.title,
                                  genre: entry.genre,
                                  thumbnailUrl: entry.thumbnailUrl || "",
                                  developerName: entry.developerName,
                                  developerYoutube: entry.developerYoutube,
                                  rating: entry.rating,
                                  plays: entry.plays,
                                  badge: entry.badge,
                                });
                              }}
                              className="p-2 border border-slate-200 hover:border-teal-500 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
                              title="Full Game Customizer"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => onToggleVisible(entry.id, entry.isDbGame)}
                              className={`p-2 border rounded-lg transition-colors cursor-pointer ${
                                entry.visible
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200"
                              }`}
                              title={entry.visible ? "Hide from site" : "Show on site"}
                            >
                              {entry.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete "${entry.title}" permanently?`)) {
                                  onDelete(entry.id, entry.isDbGame);
                                }
                              }}
                              className="p-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete game"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "stats" && (
                <div className="space-y-5">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <p className="text-xs text-slate-500 font-semibold">Total Games</p>
                      <p className="text-2xl font-black text-slate-900 mt-1">{displayItems.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <p className="text-xs text-slate-500 font-semibold">Live Visible</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{displayItems.filter(g => g.visible).length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <p className="text-xs text-slate-500 font-semibold">Developers Credited</p>
                      <p className="text-2xl font-black text-indigo-600 mt-1">{displayItems.filter(g => g.developerName).length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      <p className="text-xs text-slate-500 font-semibold">Active Categories</p>
                      <p className="text-2xl font-black text-teal-600 mt-1">{new Set(displayItems.map(g => g.genre)).size}</p>
                    </div>
                  </div>

                  {/* Storage Info Card */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Storage Consumption</h4>
                      <span className="text-xs font-semibold text-slate-600">{usedStorageMB} MB used of {totalStorageMB} MB</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 transition-all" style={{ width: `${storagePercent}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">Storage covers uploaded HTML5/WebGL game archives and thumbnail assets stored in Supabase.</p>
                  </div>
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
            developerName: g.developer_name || g.developerName || "",
            developerYoutube: g.developer_youtube || g.developerYoutube || "",
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
        rating: entry.rating ?? 0,
        plays: entry.plays ?? '0',
        badge: entry.badge ?? 'NEW',
        developerName: entry.developerName,
        developerYoutube: entry.developerYoutube,
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
    const newGame: any = {
      title: entry.title,
      genre: entry.genre,
      rating: entry.rating ?? 0,
      plays: entry.plays ?? '0',
      badge: entry.badge ?? 'NEW',
      developer_name: entry.developerName || null,
      developer_youtube: entry.developerYoutube || null,
      color: '#11B5A4', // default color fallback
      emoji: '🎮', // default emoji fallback
      zip_url: publicUrl,
      thumbnail_url: thumbnailUrl || null,
      is_uploaded: true,
      uploaded_at: new Date().toISOString(),
      visible: true,
    };

    let { data: dbData, error: dbError } = await supabase
      .from('games')
      .insert([newGame])
      .select();

    // Fallback if developer columns don't exist yet in Supabase schema
    if (dbError && (dbError.message?.includes('developer_') || dbError.message?.includes('column'))) {
      const fallbackGame = { ...newGame };
      delete fallbackGame.developer_name;
      delete fallbackGame.developer_youtube;
      const retry = await supabase.from('games').insert([fallbackGame]).select();
      dbData = retry.data;
      dbError = retry.error;
    }

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
        developerName: entry.developerName || g.developer_name,
        developerYoutube: entry.developerYoutube || g.developer_youtube,
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
    updatedFields: {
      title: string;
      genre: string;
      developerName?: string;
      developerYoutube?: string;
      rating?: number;
      plays?: string;
      badge?: "HOT" | "NEW" | "TRENDING" | "";
      thumbnailFile?: File | null;
      gameFile?: File | null;
    }
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
                    developerName: updatedFields.developerName,
                    developerYoutube: updatedFields.developerYoutube,
                    rating: updatedFields.rating ?? g.rating,
                    plays: updatedFields.plays ?? g.plays,
                    badge: (updatedFields.badge || undefined) as any,
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
          developer_name: updatedFields.developerName || null,
          developer_youtube: updatedFields.developerYoutube || null,
        };
        if (updatedFields.rating !== undefined) updateData.rating = updatedFields.rating;
        if (updatedFields.plays !== undefined) updateData.plays = updatedFields.plays;
        if (updatedFields.badge !== undefined) updateData.badge = updatedFields.badge || null;
        if (nextThumbnailUrl) {
          updateData.thumbnail_url = nextThumbnailUrl;
        }
        if (nextZipUrl) {
          updateData.zip_url = nextZipUrl;
        }

        let { error: dbError } = await supabase
          .from('games')
          .update(updateData)
          .eq('id', id);

        // Fallback retry if developer columns aren't in Supabase schema yet
        if (dbError && (dbError.message?.includes('developer_') || dbError.message?.includes('column'))) {
          const fallbackData = { ...updateData };
          delete fallbackData.developer_name;
          delete fallbackData.developer_youtube;
          const retry = await supabase.from('games').update(fallbackData).eq('id', id);
          dbError = retry.error;
        }

        if (dbError) throw dbError;

        setRemoteGames((prev) =>
          prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: updatedFields.title,
                  genre: updatedFields.genre,
                  developerName: updatedFields.developerName,
                  developerYoutube: updatedFields.developerYoutube,
                  rating: updatedFields.rating ?? g.rating,
                  plays: updatedFields.plays ?? g.plays,
                  badge: (updatedFields.badge || undefined) as any,
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
                  developerName: updatedFields.developerName,
                  developerYoutube: updatedFields.developerYoutube,
                  rating: updatedFields.rating ?? u.rating,
                  plays: updatedFields.plays ?? u.plays,
                  badge: updatedFields.badge || u.badge,
                  ...(nextThumbnailUrl ? { thumbnailUrl: nextThumbnailUrl } : {}),
                  ...(updatedFields.gameFile ? { file: updatedFields.gameFile } : {}),
                }
              : u
          )
        );
        toast.success("Upload entry updated!", { id: toastId });
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
          {/* ── Top Hero Header Area ── */}
          <section className="relative overflow-hidden pt-8 pb-10 bg-[#F8FAFC] border-b border-slate-200">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

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
                          {spotlightGame.developerName && (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="text-[10px] text-slate-400">By</span>
                              {spotlightGame.developerYoutube ? (
                                <a
                                  href={spotlightGame.developerYoutube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title={`Visit ${spotlightGame.developerName} on YouTube`}
                                  className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-red-600 transition-colors"
                                >
                                  <Youtube size={12} className="text-red-600 fill-red-600 shrink-0" />
                                  <span className="truncate max-w-[140px] underline decoration-slate-300 hover:decoration-red-600">{spotlightGame.developerName}</span>
                                </a>
                              ) : (
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{spotlightGame.developerName}</span>
                              )}
                            </div>
                          )}
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
              <div className="flex flex-wrap gap-2.5 mt-5">
                {[
                  { icon: Linkedin, label: "LinkedIn", url: "https://www.linkedin.com/company/azymar/posts/?feedView=all" },
                  { icon: Instagram, label: "Instagram", url: "https://www.instagram.com/azymar_studios/" },
                  {
                    icon: (props: { size: number }) => (
                      <svg viewBox="0 0 24 24" width={props.size} height={props.size} fill="currentColor">
                        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.53c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.25-1.49-1.4-1.74-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.17-.47-.29z"/>
                      </svg>
                    ),
                    label: "WhatsApp Channel",
                    url: "http://whatsapp.com/channel/0029Vb7UvOFIN9iemhBqrU0q"
                  },
                  {
                    icon: (props: { size: number }) => (
                      <svg viewBox="0 0 24 24" width={props.size} height={props.size} fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    ),
                    label: "X",
                    url: "https://x.com/azymar03"
                  },
                  { icon: Youtube, label: "YouTube", url: "https://www.youtube.com/@AZYMAR-GAMERS" },
                  {
                    icon: (props: { size: number }) => (
                      <svg viewBox="0 0 24 24" width={props.size} height={props.size} fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                    ),
                    label: "Discord",
                    url: "https://discord.gg/dnAXsrr8A"
                  },
                ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.label}
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
                            window.open("https://discord.gg/dnAXsrr8A", "_blank");
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
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{selectedGame.genre} · {selectedGame.plays} plays</p>
                  {selectedGame.developerName && (
                    <>
                      <span className="text-slate-300">•</span>
                      {selectedGame.developerYoutube ? (
                        <a
                          href={selectedGame.developerYoutube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2.5 py-0.5 rounded-full transition-colors"
                        >
                          <Youtube size={13} className="text-red-600 fill-red-600" />
                          <span>{selectedGame.developerName}</span>
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600">By {selectedGame.developerName}</span>
                      )}
                    </>
                  )}
                </div>
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
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-sm truncate max-w-[170px] sm:max-w-xs">{playingGame?.title}</h2>
                    {playingGame?.developerName && (
                      playingGame.developerYoutube ? (
                        <a
                          href={playingGame.developerYoutube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <Youtube size={12} className="text-red-600 fill-red-600" />
                          <span className="truncate max-w-[120px]">{playingGame.developerName}</span>
                        </a>
                      ) : (
                        <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">by {playingGame.developerName}</span>
                      )
                    )}
                  </div>
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
