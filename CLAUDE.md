# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tripost** is a travel-focused SNS where users can create posts that combine Google Maps locations, routes, photos, and travel metadata (style, budget, country, etc.). Built with Laravel 12 + React 18 via Inertia.js — no separate API; the frontend communicates entirely through Inertia page props and Ziggy-generated routes.

All application code lives under `backend/`. The repo root contains docs and Docker config only.

## Development Commands

All commands run from `backend/`:

```bash
# Start dev environment (Docker)
./vendor/bin/sail up -d

# Full dev server (artisan + queue + pail + vite, concurrently)
./vendor/bin/sail composer run dev

# Or separately:
./vendor/bin/sail artisan serve
./vendor/bin/sail npm run dev

# Database
./vendor/bin/sail artisan migrate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail artisan migrate:fresh --seed

# Tests (only Unit suite is active; Feature suite is commented out in phpunit.xml)
./vendor/bin/sail artisan test
./vendor/bin/sail artisan test tests/Unit/SomeTest.php   # single test file
./vendor/bin/sail php vendor/bin/phpunit --filter TestName  # filter by name

# PHP linting (Laravel Pint)
./vendor/bin/sail vendor/bin/pint
./vendor/bin/sail vendor/bin/pint --test   # check only, no fix

# JS linting / formatting
./vendor/bin/sail npm run lint
./vendor/bin/sail npm run lint:fix
./vendor/bin/sail npm run format
./vendor/bin/sail npm run lint:format   # lint:fix + format together

# Build frontend
./vendor/bin/sail npm run build
```

Mailpit UI: `http://localhost:8025`

## Architecture

### Stack
- **Backend**: Laravel 12 / PHP 8.3, MySQL, Redis (queue/cache), S3 (file storage)
- **Frontend**: React 18, Tailwind CSS 3, Vite — served via **Inertia.js** (no REST API)
- **Routing**: Ziggy exposes named Laravel routes to JS as `route('name')`
- **Auth**: Laravel Breeze + Sanctum, email verification required for most actions

### Directory Structure (under `backend/`)

```
app/
  Http/Controllers/   # PostController, ProfileController, FollowController,
                      # PostLikeController, CommentController,
                      # NotificationController, PlaceController, ContactController
  Models/             # User, Post, Place, Like, Follow, Comment,
                      # Notification, Style, Purpose, Budget, Country
  Notifications/      # CustomVerifyEmail (email verification)
  Rules/              # DisplayIdFormat, PasswordComplexity (custom validation)
resources/js/
  Pages/              # Inertia page components (Auth/, Posts/, Profile/)
  Components/         # Shared React components (GoogleMap, PostActions,
                      # NotificationsModal, TripDayRoutes, etc.)
  Layouts/            # App shell layouts
routes/
  web.php             # All routes; some guest-accessible, most behind auth+verified
  auth.php            # Breeze auth routes
database/
  migrations/         # Standard migrations; posts have places, styles, purposes, budget
```

### Key Data Relationships
- `Post` has many `Place` records (ordered trip stops with lat/lng/Google Place ID)
- `Post` has `Style`, `Purpose`, `Budget` (enum-like master tables seeded via `countries.json`)
- `Post` has `share_scope`: `public` / `follower` / `private` (+ `draft` status)
- `User` follows `User` via `follows` pivot; likes via `likes` pivot
- Notifications are stored in `notifications` table (custom, not Laravel's built-in)

### Google Maps Integration
Three APIs are used together:
1. **Places API** — autocomplete / place search when creating posts
2. **Maps JavaScript API** — display markers and routes on `<GoogleMap>` component
3. **Directions API** — draw routes between trip stops

`GOOGLE_MAPS_API_KEY` must be set in `.env`. The key is injected into the frontend via Inertia shared data.

### CI/CD
GitHub Actions runs on push to `main`: PHPUnit (Unit tests only) → Laravel Pint → deploy to EC2. Feature tests are commented out in `phpunit.xml`.

### Production
EC2 + Docker Compose (`docker-compose.production.yml`), Nginx (`docker/nginx.conf`), RDS for MySQL, S3 for media, Redis, Mailgun for email.
