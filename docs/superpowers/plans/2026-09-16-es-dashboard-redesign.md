# ES Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the ES Dashboard WelcomePanel using the global Sparta-Engineering palette (Black, Orange, Gray, White) with a Modern & Energetic glassmorphism UI and a realistic engineer SVG illustration.

**Architecture:** Create a new `EngineerIllustration` component containing the detailed SVG. Update `WelcomePanel` to use deep black background with a glass overlay (`bg-white/5`), precise typography, and the new illustration component.

**Tech Stack:** Next.js (React), Tailwind CSS, Lucide React (optional for accents, but we will use raw SVG for the main illustration).

## Global Constraints

- Must strictly adhere to the Sparta-Engineering color palette: Black, Orange, Gray, White.
- Must not use arbitrary CSS values unless necessary (prefer Tailwind utility classes).
- Must use active voice and Indonesian language for UI copy as per existing spec.

---

### Task 1: Create Engineer Illustration Component

**Files:**
- Create: `components/es-dashboard/engineer-illustration.tsx`

**Interfaces:**
- Consumes: None.
- Produces: `EngineerIllustration(): JSX.Element`

- [ ] **Step 1: Write the implementation**

```tsx
export function EngineerIllustration() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-32 drop-shadow-xl sm:size-40"
      aria-hidden="true"
    >
      {/* Background glow for depth */}
      <circle cx="100" cy="100" r="80" fill="#ff8a2a" fillOpacity="0.1" />
      
      {/* Body/Shoulders */}
      <path
        d="M40 180C40 135 70 110 100 110C130 110 160 135 160 180"
        fill="#e5e7eb"
        stroke="#ffffff"
        strokeWidth="4"
      />
      
      {/* Face/Head */}
      <circle cx="100" cy="85" r="25" fill="#f3f4f6" stroke="#ffffff" strokeWidth="4" />
      
      {/* Hardhat/Helmet */}
      <path
        d="M65 80C65 60 80 45 100 45C120 45 135 60 135 80"
        fill="#ff8a2a"
      />
      <rect x="60" y="80" width="80" height="8" rx="4" fill="#ea7a1f" />
      
      {/* Blueprint/Clipboard prop */}
      <rect x="120" y="120" width="40" height="50" rx="4" fill="#374151" stroke="#9ca3af" strokeWidth="2" />
      <line x1="128" y1="135" x2="152" y2="135" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      <line x1="128" y1="145" x2="145" y2="145" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/es-dashboard/engineer-illustration.tsx
git commit -m "feat(es-dashboard): add realistic engineer svg illustration"
```

---

### Task 2: Refactor WelcomePanel

**Files:**
- Modify: `components/es-dashboard/welcome-panel.tsx`

**Interfaces:**
- Consumes: `EngineerIllustration` from Task 1.
- Produces: Updated `WelcomePanel(): JSX.Element`

- [ ] **Step 1: Write the implementation**

Modify `components/es-dashboard/welcome-panel.tsx` to replace the old geometric shapes and apply the glassmorphism styling.

```tsx
import { EngineerIllustration } from "./engineer-illustration"

export function WelcomePanel() {
  return (
    <section className="relative mt-6 overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 shadow-xl shadow-black/40 border border-white/10">
      {/* Subtle glass overlay */}
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-balance text-2xl font-semibold leading-tight text-white">
            Welcome ES User
          </h2>
          <p className="mt-2 max-w-48 text-sm leading-6 text-gray-400">
            Pilih alur kerja untuk area BANJARMASIN.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-[#ff8a2a]/10 border border-[#ff8a2a]/20 px-4 py-2 text-xs font-semibold text-[#ff8a2a] shadow-[inset_0_0_10px_rgba(255,138,42,0.1)]">
            ENGINEERING SUPPORT
          </div>
        </div>
        
        {/* New Illustration Component */}
        <div className="relative shrink-0 -mr-2 sm:mr-0">
          <EngineerIllustration />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/es-dashboard/welcome-panel.tsx
git commit -m "refactor(es-dashboard): redesign welcome panel with glassmorphism and new illustration"
```
