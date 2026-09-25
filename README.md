<div align="center">

  <img src="./public/ismaili-official-logo.png" alt="Ismaili Center Houston Logo" width="360" />

  # Ismaili Center Houston
  ### Digital Guide, Jamatkhana Schedules & Voice Telephony Phonebot

  [![Deploy to GitHub Pages](https://github.com/eileen-a-rehman/Ismaili-Center-Houston-Phonebot-websites-app-/actions/workflows/deploy.yml/badge.svg)](https://github.com/eileen-a-rehman/Ismaili-Center-Houston-Phonebot-websites-app-/actions/workflows/deploy.yml)

</div>

---

## Overview

The **Ismaili Center Houston** application is a modern web experience and interactive telephone concierge representing the first purpose-built Ismaili Center in the United States, located in Houston's historic Montrose district.

### Key Features
- **Official Brand Identity**: Featuring the official geometric heptagonal emblem and typography formatted for high-definition displays and dark/light modes.
- **GitHub & GitHub Pages Compatible**: 100% static hosting compatible via GitHub Pages, featuring built-in SPA 404 redirect handler (`public/404.html`), dynamic subpath base routing (`BASE_PATH`), zero-network base64 asset fallbacks, and local browser speech recognition and synthesis.
- **Clean Stacked Layout**: Modern horizontal/desktop layout placing the **Phone Console** and **Keypad** side-by-side on the top row, with the **Live Conversation Stream** spanning full width directly beneath them.
- **Smooth Animations**:
  - **Fluid Tab Transitions**: Powered by `motion` (`AnimatePresence`) for seamless cross-fading and gentle slide-in animations between navigation tabs.
  - **Tactile Button Clicks**: Spring micro-interactions and active scaling (`active:scale-[0.965]`) on keypad buttons, action controls, and quick-reply chips.
  - **Smooth Scroll & Reveal**: Intersectional observer scroll-reveals with cubic-bezier easing, smooth scrolling throughout, and an automated floating quick-scroll-to-top button.
- **Interactive Voice Telephony Phonebot**: Simulated telecom system featuring an authentic phonebot IVR greeting, DTMF touch-tone dialpad, live speech recognition, acoustic loopback echo suppression, and conversational audio responses.
- **Dedicated Information Line Fallback**: Automated routing to the official Information Line at `+1 (713) 522-2026` for complex or unmatched inquiries.
- **US Central Time Prayer Schedules**: Daily Bandagi, Morning Dua, and Evening Jamatkhana congregational prayer timetables with real-time countdown.
- **Visitor Planning & Architectural Tours**: Information on visiting days (Tuesdays, Thursdays, Saturdays, and Sundays 10:00 AM – 4:00 PM CT), free admission, and tour booking.
- **Architecture & Gardens**: Showcasing Farshid Moussavi's architecture, shaded verandas, ceramic screens, and Nelson Byrd Woltz's 11-acre Persian-inspired gardens.

---

## Logo Assets for GitHub

The repository includes optimized logo assets in both `./public/` and `./src/assets/`:
- **Official Full Logo (Light Theme)**: `public/ismaili-official-logo.png`
- **Official Full Logo (Dark Theme)**: `public/ismaili-official-logo-dark.png`
- **Emblem Mark (Light Theme)**: `public/ismaili-emblem.png`
- **Emblem Mark (Dark Theme)**: `public/ismaili-emblem-dark.png`

All web components utilize bundled Vite imports, relative paths, and zero-network base64 fallbacks to guarantee 100% display reliability across GitHub Pages subpaths, custom domains, and local development.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Contact & Information Line
- **Ismaili Center Houston Dedicated Information Line**: +1 (713) 522-2026
- **Location**: Montrose Boulevard & Allen Parkway, Houston, TX 77019
- **Official Website**: [ismailicenter.org](https://ismailicenter.org/)
