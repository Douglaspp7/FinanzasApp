# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.0] – 2026-06-20

### Added – Phase 1: Project Structure
- Vite + React + TypeScript scaffold
- Tailwind CSS v4 with design tokens (light/dark mode)
- Path aliases (`@/`)
- Full directory structure: `components`, `pages`, `hooks`, `contexts`, `services`, `types`, `utils`, `constants`, `lib`, `i18n`

### Added – Phase 2: Authentication
- AuthContext with Supabase Auth (email/password, Google, Apple, Magic Link)
- ThemeContext (dark/light/system)
- BusinessContext (active business for logged-in user)
- Sign In, Sign Up, Forgot Password pages
- Onboarding flow (profession selector + business setup)
- Protected routes + auth redirect guards

### Added – Phase 3: Database
- Full normalized schema: `profiles`, `businesses`, `clients`, `services`, `appointments`, `products`, `transactions`
- Row Level Security on all tables
- Auto `updated_at` triggers
- Full-text search index on clients (pg_trgm)

### Added – UI Components
- Button, Input, Card, Badge, Skeleton, Avatar, Toast, EmptyState

### Added – Layout
- Sidebar (desktop) + TopBar + MobileNav (bottom nav)
- App shell with React Router lazy-loaded routes

### Added – Pages (scaffolded)
- Dashboard with KPIs and quick actions
- Agenda with day/week/month view toggle
- Clients, Services, Products, Financial, Reports, Settings
- Admin panel
- Landing page with hero, features, pricing, FAQ

### Added – i18n
- Spanish (default), Portuguese, English
- Auto-detection from browser
- i18next + react-i18next

### Added – PWA
- vite-plugin-pwa with Workbox
- Offline caching strategy (NetworkFirst for Supabase)
- Web manifest with icons
