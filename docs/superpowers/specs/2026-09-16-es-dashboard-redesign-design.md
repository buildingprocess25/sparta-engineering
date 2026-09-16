# ES Dashboard Redesign: Welcome Panel

## Goal
Redesign the `WelcomePanel` component in the Engineering Support (ES) Dashboard to look more premium, modern, and engaging ("Modern & Energetik"), moving away from the default, rigid "AI-generated" look. 

**Global Standard:** The new design must adhere to the Sparta-Engineering color palette constraints: Black, Orange, Gray, and White. This styling and color treatment (The "Modern & Energetik" execution) will serve as the baseline for the entire `sparta-engineering` project, including other roles and dashboards in the future. 

For this specific task, it also replaces the abstract geometrical avatar with a high-quality, realistic SVG illustration of an engineer.

## User Context & Vibe
- **Target Audience:** Engineering Support users in the Sparta application.
- **Vibe:** Modern & Energetic, Professional, Premium.
- **Palette Constraint:** Black, Orange, Gray, White.

## Architecture & Components
While this specific UI upgrade is localized to `components/es-dashboard/welcome-panel.tsx`, the design principles established here (Glassmorphism-lite on deep black backgrounds, strategic use of orange, and realistic SVGs) will become the standard for the app. 

Currently, we will not change the overall `DashboardShell` background, but we will upgrade the `WelcomePanel` UI as the first step in this global direction.

### 1. The Floating Glass Card (Base)
Instead of a flat dark gray/black background (`#111111`), we will implement a "Glassmorphism-lite" card:
- **Background:** Deep rich black (`bg-[#0a0a0a]` or `bg-black`) with a subtle white transparency overlay (`bg-white/5`) to create depth.
- **Border & Shadow:** A 1px translucent white border (`border border-white/10`) and a soft drop shadow (`shadow-xl shadow-black/40`) to make the card float above the main background.
- **Border Radius:** Softened from `rounded-[1.35rem]` to standard Tailwind `rounded-2xl` or `rounded-3xl` for a smoother, less arbitrary feel.

### 2. Typography
- **Welcome Text:** Crisp White (`text-white`) for the "Welcome ES User" heading.
- **Subtitle Text:** Cool Gray (`text-[#a1a1aa]`) for "Pilih alur kerja untuk area BANJARMASIN."
- **Spacing:** Increase padding and line heights slightly for better readability.

### 3. Accent & Badge (Orange)
- The "ENGINEERING SUPPORT" badge will use the Sparta Orange (`#ff8a2a`).
- Instead of solid orange with white text or vice versa, we'll use a polished approach: `bg-[#ff8a2a]/10` (translucent orange) with `text-[#ff8a2a]` (solid orange text) and an orange border `border border-[#ff8a2a]/20`. This creates a premium, glowing effect.

### 4. Engineer SVG Illustration
- Replace the current DOM-based geometric avatar (composed of absolute positioned divs).
- Create a dedicated React component `EngineerIllustration` that renders a detailed SVG of an engineer (e.g., hardhat, clipboard/gear).
- The SVG will use `#ffffff`, `#e5e7eb` (gray), and `#ff8a2a` (orange) to seamlessly blend with the UI constraints.
- Position this illustration on the right side of the panel, allowing it to subtly overlap the bottom or top for a more dynamic, "breaking the grid" composition.

## Data Flow
No changes to data flow. The component remains a static presentation layer for now.

## Verification
- Review the `WelcomePanel` locally in the browser to ensure the glass effect and SVG illustration render correctly across different viewport sizes (mobile responsiveness).
- Verify color contrast for readability.
