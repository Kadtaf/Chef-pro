# Chef Pro Bordeaux - Culinary SaaS Platform

A comprehensive full-stack culinary management platform for professional chefs and food consultants, built with React, TypeScript, Supabase, and Tailwind CSS.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Production Deployment](#production-deployment)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Useful Commands](#useful-commands)

---

## Overview

Chef Pro Bordeaux is a premium culinary management SaaS designed for freelance chefs, culinary consultants, and food industry professionals. The platform includes:

1. **Public Showcase Website** - Professional portfolio with recipes, services, pricing, and contact
2. **Private Admin Dashboard** - Complete management system with authentication
3. **AI-Generated Content** - Automatic recipe, technical sheet, and menu generation
4. **Nutrition Module** - Complete nutritional analysis and Nutri-Score calculation
5. **REST API** - Full API for external integrations

---

## Features

### Public Website
- Responsive, SEO-optimized pages
- Recipe gallery with nutritional info
- Service catalog and pricing
- Portfolio showcase
- Client reviews and testimonials
- Contact form with email notifications
- Legal mentions

### Admin Dashboard
- Statistics overview with charts
- Recipe management (CRUD)
- Technical sheets with cost analysis
- Menu and card creation
- HACCP compliance tracking
- Mission/revenue tracking
- Comment moderation
- Portfolio management
- AI content generation
- Site settings management

### AI Module
- Automatic recipe generation
- Technical sheet creation
- Seasonal menu generation
- HACCP checklist creation
- Cost optimization suggestions

### Nutrition
- Calorie calculation
- Macronutrient tracking (proteins, carbs, fats, fiber, salt)
- Automatic Nutri-Score calculation
- Per-serving nutrition display

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│  Public Pages         │         Admin Dashboard          │
│  - Home               │         - Statistics              │
│  - About              │         - Recipes CRUD            │
│  - Services           │         - Technical Sheets        │
│  - Pricing            │         - Menus/Cards             │
│  - Portfolio          │         - HACCP Records           │
│  - Recipes            │         - Missions                │
│  - Contact            │         - Revenues                │
│  - Reviews            │         - Comments                │
│  - Legal              │         - Settings                │
│                       │         - AI Studio                │
├───────────────────────┴───────────────────────────────────┤
│                    Supabase Backend                       │
├───────────────────────────────────────────────────────────┤
│  Authentication │ PostgreSQL Database │ Row Level Security │
│  Realtime       │ Edge Functions      │ Storage            │
└───────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Modern web browser

---

## Installation

### 1. Clone or Download

```bash
# If you have the ZIP file, extract it
unzip chef-pro-bordeaux.zip
cd chef-pro-bordeaux
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > API and copy:
   - Project URL
   - Anon/Public key
   - Service Role key (for admin operations)

4. Go to Authentication > Providers and enable Email provider

### 4. Create Your First Admin User

1. In Supabase dashboard, go to Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter your admin email and password
4. The user will be automatically added to the `profiles` table with admin role

---

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Setup

The database schema is applied automatically via migrations. The initial migration creates all necessary tables:

- `profiles` - User profiles
- `settings` - Site configuration
- `recipes` - Recipe catalog
- `recipe_ingredients` - Recipe ingredients
- `recipe_steps` - Recipe instructions
- `technical_sheets` - Technical documentation
- `menus` - Menu collections
- `cards` - Menu cards
- `haccp_records` - HACCP compliance
- `missions` - Freelance missions
- `revenues` - Income tracking
- `comments` - Reviews/testimonials
- `portfolio_items` - Work portfolio
- `ai_generations` - AI content history
- `notifications` - Admin notifications
- `contact_submissions` - Contact form entries
- `services` - Service catalog

---

## Running Locally

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 2: Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables

### Option 3: Self-Hosted

```bash
# Build
npm run build

# The dist/ folder contains static files
# Deploy to any static hosting (nginx, apache, etc.)
```

---

## Project Structure

```
chef-pro-bordeaux/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminLayout.tsx
│   │   └── public/
│   │       └── PublicLayout.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── SettingsContext.tsx
│   ├── lib/
│   │   ├── ai-service.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Recipes.tsx
│   │   │   ├── RecipeEditor.tsx
│   │   │   ├── TechnicalSheets.tsx
│   │   │   ├── TechnicalSheetEditor.tsx
│   │   │   ├── Menus.tsx
│   │   │   ├── MenuEditor.tsx
│   │   │   ├── Cards.tsx
│   │   │   ├── CardEditor.tsx
│   │   │   ├── HACCP.tsx
│   │   │   ├── Missions.tsx
│   │   │   ├── MissionEditor.tsx
│   │   │   ├── Revenues.tsx
│   │   │   ├── Comments.tsx
│   │   │   ├── PortfolioAdmin.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── AIStudio.tsx
│   │   │   └── ContactSubmissions.tsx
│   │   ├── auth/
│   │   │   └── Login.tsx
│   │   └── public/
│   │       ├── Home.tsx
│   │       ├── About.tsx
│   │       ├── Services.tsx
│   │       ├── Pricing.tsx
│   │       ├── Portfolio.tsx
│   │       ├── Recipes.tsx
│   │       ├── RecipeDetail.tsx
│   │       ├── Contact.tsx
│   │       ├── Reviews.tsx
│   │       └── Legal.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .env
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Modules

### 1. Public Website (No Authentication)
- **Home**: Hero section, services preview, recipes, testimonials
- **About**: Bio, values, timeline, certifications
- **Services**: Service catalog with features
- **Pricing**: Pricing cards with FAQ
- **Portfolio**: Project showcase with filtering
- **Recipes**: Recipe gallery with search/filters
- **Recipe Detail**: Full recipe with nutrition
- **Contact**: Contact form with Google Maps
- **Reviews**: Client testimonials with ratings
- **Legal**: Legal mentions and privacy

### 2. Admin Dashboard (Authentication Required)
- **Dashboard**: Statistics, charts, activity feed
- **Recipes**: CRUD, nutrition, publish/draft
- **Technical Sheets**: CRUD, cost analysis, margins
- **Menus**: Create seasonal/balanced menus
- **Cards**: Restaurant/event cards
- **HACCP**: Compliance tracking, checklists
- **Missions**: Freelance mission management
- **Revenues**: Income tracking with charts
- **Comments**: Moderation, approval, replies
- **Portfolio**: Manage showcase projects
- **Settings**: Site configuration, SEO
- **AI Studio**: Generate recipes, menus, etc.
- **Messages**: Contact form submissions

### 3. AI Generation Module
- Automatic recipe generation with nutrition
- Technical sheet creation with cost analysis
- Seasonal menu creation (Spring/Summer/Fall/Winter)
- HACCP checklist generation

### 4. Nutrition Module
- Calorie counting per serving
- Macronutrient breakdown (proteins, carbs, fats, fiber, salt)
- Automatic Nutri-Score calculation (A-E)
- Allergen tracking

---

## API Reference

### Authentication Endpoints
All `/api/*` endpoints require authentication via Supabase Auth.

### Recipes API
```
GET    /api/recipes           - List all recipes
GET    /api/recipes/:id       - Get single recipe
POST   /api/recipes           - Create recipe
PUT    /api/recipes/:id       - Update recipe
DELETE /api/recipes/:id       - Delete recipe
```

### Technical Sheets API
```
GET    /api/technical-sheets           - List all sheets
GET    /api/technical-sheets/:id      - Get single sheet
POST   /api/technical-sheets          - Create sheet
PUT    /api/technical-sheets/:id      - Update sheet
DELETE /api/technical-sheets/:id      - Delete sheet
```

### Menus API
```
GET    /api/menus           - List all menus
GET    /api/menus/:id        - Get single menu
POST   /api/menus            - Create menu
PUT    /api/menus/:id        - Update menu
DELETE /api/menus/:id        - Delete menu
```

### HACCP API
```
GET    /api/haccp            - List all records
POST   /api/haccp            - Create record
PUT    /api/haccp/:id        - Update record
DELETE /api/haccp/:id        - Delete record
```

### Missions API
```
GET    /api/missions           - List all missions
POST   /api/missions            - Create mission
PUT    /api/missions/:id        - Update mission
DELETE /api/missions/:id        - Delete mission
```

### Revenues API
```
GET    /api/revenues           - List all revenues
POST   /api/revenues             - Create revenue entry
DELETE /api/revenues/:id        - Delete revenue entry
```

---

## Database Schema

### Main Tables

**profiles**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (FK to auth.users) |
| email | text | User email |
| full_name | text | Display name |
| role | text | admin/editor/viewer |
| avatar_url | text | Profile picture |

**recipes**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Recipe name |
| slug | text | URL slug |
| category | text | Entrée/Plat/Dessert |
| season | text | Seasonal availability |
| difficulty | text | facile/moyen/difficile |
| prep_time | int | Prep minutes |
| cook_time | int | Cook minutes |
| servings | int | Portion count |
| calories_per_serving | decimal | Nutritional info |
| nutri_score | text | A/B/C/D/E |

**technical_sheets**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Sheet name |
| category | text | Classification |
| total_cost | decimal | Total ingredient cost |
| selling_price | decimal | Menu price |
| margin_ratio | decimal | Price/cost ratio |
| portions | int | Serving count |

**missions**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Mission name |
| client_name | text | Client |
| status | text | en_attente/en_cours/terminee/annulee |
| type | text | chef/second/consulting/formation/evenementiel |
| daily_rate | decimal | Day rate |
| total_revenue | decimal | Total earnings |

---

## Useful Commands

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Create production build
npm run preview      # Preview production build

# Linting
npm run lint         # Check for errors
npm run typecheck    # Type checking

# Install dependencies
npm install          # Install all dependencies
```

---

## Customizing the Platform

### Adding New Services
Edit `src/pages/public/Services.tsx` and `src/pages/admin/Settings.tsx`

### Changing Colors
Edit `tailwind.config.js` to modify primary, secondary, and accent colors

### Adding New Recipe Categories
Edit `src/lib/utils.ts` and update `RECIPE_CATEGORIES` constant

### Modifying Nutri-Score Calculation
Edit `calculateNutriScore()` function in `src/lib/utils.ts`

---

## Support

For issues or questions, please contact the developer or submit an issue on the project repository.

---

## License

MIT License - feel free to use and modify for your own projects.

---

Built with React, TypeScript, Tailwind CSS, and Supabase.
