# Techno Sreshtha — Cyber Safety Club Website

The official website for **Techno Sreshtha Cyber Safety Club** at DAV Public School, Sreshtha Vihar.

## 🚀 Stack & Architecture

- **Framework**: [Astro 5](https://astro.build/) (Static Site Generation)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a clean, grounded neutral design system (no artificial neon gradients)
- **Hosting**: [Vercel](https://vercel.com/) (Zero-config static deployment with `@astrojs/vercel`)
- **Typography**: Inter via clean system font fallback stack
- **Features**:
  - Full responsive layout with accessible mobile navigation
  - Dark / Light mode toggle with local storage persistence
  - Interactive Cybersecurity & AI ethics knowledge-base chatbot
  - Interactive multi-album modal lightbox for the gallery
  - Automatic legacy URL redirection via `vercel.json` (`/student_games.html` -> `/projects`, etc.)

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🌐 Deploying to Vercel

Push to your GitHub repository connected to Vercel. Vercel automatically detects the Astro framework:
- **Build Command**: `astro build` (or `npm run build`)
- **Output Directory**: Automatically handled by `@astrojs/vercel` (or `dist`)
