# AZYMAR LIVE 🎮

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **AZYMAR LIVE** is a high-performance web gaming playground and arcade platform offering instant, zero-download, browser-based games with cloud persistence, dynamic genre categorization, interactive player spotlights, and an admin management dashboard.

---

## ✨ Features

- ⚡ **Zero-Lag Instant Play**: Run HTML5 and WebGL game bundles directly in the browser via an isolated, secure zip execution engine.
- 🖥️ **Immersive Fullscreen Mode**: 
  - Dedicated Fullscreen toggle and floating quick-access controls.
  - Native HTML5 Fullscreen API integration with keyboard shortcut (`F`).
- 🌟 **Daily Spotlight & Surprise Me Roller**:
  - Auto-showcases top-rated/trending community titles.
  - Interactive "🎲 Surprise Me" dice-roll game picker.
- 🎨 **Modern White & Clean UI**:
  - Neumorphic & modern card design, crisp typography, and responsive grid layouts.
  - Interactive floating arcade character animations.
- 📊 **Dynamic Category Synchronization**:
  - Live category filters with real-time game count computation.
  - Instant live search and quick-filter trending chips.
- 🛠️ **Built-in Admin Panel**:
  - Secure zip game upload and direct storage in Supabase.
  - Game metadata editor (title, category, thumbnail preview, ratings).
  - Visibility toggles and instant deletion controls.
- ☁️ **Cloud Database & Storage**:
  - Powered by Supabase PostgreSQL and Storage buckets.
  - Fallback local mode for offline development.

---

## 🚀 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 18, TypeScript |
| **Build Tool & Bundler** | Vite 6 |
| **Styling & Design System** | Tailwind CSS v4, Custom CSS Variables |
| **Motion & Animation** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **Game Engine Loader** | JSZip, WebGL / HTML5 Canvas sandbox |
| **Backend / BaaS** | Supabase (PostgreSQL, Storage, Auth) |
| **Notifications** | Sonner |

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm**, **pnpm**, or **yarn**

### 2. Clone the Repository
```bash
git clone https://github.com/azymar03-ux/AZYMAR-LIVE.git
cd AZYMAR-LIVE
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the keys with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Available Scripts

- `npm run dev`: Starts the local Vite development server with HMR.
- `npm run build`: Compiles TypeScript and builds production-ready bundles into `/dist`.
- `npm run preview`: Previews the production build locally.

---

## 📁 Project Structure

```text
AZYMAR-LIVE/
├── public/                 # Static 3D models and public assets
├── src/
│   ├── app/
│   │   └── App.tsx         # Main application dashboard, views & state
│   ├── imports/            # Arcade graphics, logos, and illustration assets
│   ├── lib/
│   │   ├── supabaseClient.ts  # Supabase client initialization
│   │   └── zipPlayer.ts       # HTML5 zip game bundle loader & extractor
│   ├── styles/
│   │   ├── fonts.css       # Typography styling
│   │   ├── index.css       # Global stylesheet entry
│   │   ├── tailwind.css    # Tailwind CSS configuration
│   │   └── theme.css       # Theme design tokens & CSS variables
│   └── main.tsx            # React application entry point
├── supabase/
│   ├── schema.sql          # Database tables, RLS policies & buckets schema
│   └── seed.sql            # Initial seed data
├── .env.example            # Environment variables template
├── package.json            # Project dependencies & npm scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build & plugin configuration
└── README.md               # Project documentation
```

---

## 🛡️ Database Schema (Supabase)

The platform requires a `games` table and a `game-files` storage bucket in Supabase. You can execute the SQL queries located in `supabase/schema.sql` inside the Supabase SQL Editor.

---

## 🌐 Community & Socials

- **LinkedIn**: [AZYMAR Posts](https://www.linkedin.com/company/azymar/posts/?feedView=all)
- **Instagram**: [@azymar_studios](https://www.instagram.com/azymar_studios/)
- **WhatsApp Channel**: [AZYMAR Channel](http://whatsapp.com/channel/0029Vb7UvOFIN9iemhBqrU0q)
- **X (Twitter)**: [@azymar03](https://x.com/azymar03)
- **YouTube**: [@AZYMAR-GAMERS](https://www.youtube.com/@AZYMAR-GAMERS)
- **Discord**: [Join AZYMAR Discord](https://discord.gg/dnAXsrr8A)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by **AZYMAR Studios**.
