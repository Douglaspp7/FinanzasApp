# AgendaPro LATAM

ERP ligero para microemprendedores de servicios en América Latina.

**Stack:** React + Vite + TypeScript + Tailwind CSS v4 + Supabase + PWA

---

## Inicio rápido

```bash
npm install
cp .env.example .env
# Editar .env con tus credenciales de Supabase
npm run dev
```

## Base de datos

Ejecuta `supabase/migrations/001_initial_schema.sql` en el SQL Editor de Supabase.

## Estructura

```
src/
├── components/   # ui, layout, auth, dashboard, shared
├── pages/        # landing, auth, app, admin
├── contexts/     # Auth, Theme, Business
├── hooks/
├── services/
├── types/        # TypeScript + Database types
├── constants/    # professions, countries, plans
├── lib/          # supabase client, utils
└── i18n/         # es, pt, en
```

## Roadmap

- [x] Fase 1 – Estructura
- [x] Fase 2 – Autenticación
- [x] Fase 3 – Base de datos
- [ ] Fase 4 – Agenda (calendario interactivo)
- [ ] Fase 5 – Clientes (CRUD completo)
- [ ] Fase 6 – Financiero
- [ ] Fase 7 – Dashboard (datos reales)
- [ ] Fase 8 – PWA (offline first)
- [ ] Fase 9 – Landing (SEO)
- [ ] Fase 10 – Admin
