# Mavuno Direct — Commodity Ordering & Delivery Tracking Prototype

Full-stack agricultural and household commodity ordering platform featuring live warehouse stock availability, atomic order placement, step-by-step delivery tracking, and an admin/dispatcher console.

## Project Structure

- `src/App.tsx` — Root application shell, auth state, real-time catalog & order subscriptions
- `src/components/CatalogSection.tsx` — Searchable, category-filtered commodity storefront with live stock caps
- `src/components/CartDrawer.tsx` — Slide-over cart & checkout drawer with atomic order submission
- `src/components/OrdersTrackingView.tsx` — Order reference lookup, customer order cards, and 5-stage delivery timeline
- `src/components/DispatchConsoleView.tsx` — Admin/dispatcher queue, stock replenishment, and demo seeding
- `src/services/firestoreService.ts` — Firebase Auth + Firestore transactions & real-time listeners
- `firestore.rules` & `firebase-blueprint.json` — Hardened Firestore security rules and schema blueprint
- `postgres/schema.sql` & `postgres/seed.sql` — Relational PostgreSQL DDL & seed data (`users`, `commodities`, `orders`, `order_items`, `delivery_tracking`)
- `docker-compose.yml` — One-command local PostgreSQL setup with automatic schema & seed initialization
- `vercel.json` — Vercel deployment configuration

## 1. Run Locally in VS Code

1. Open the project folder in VS Code and install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Optional local PostgreSQL database via Docker:
   ```bash
   POSTGRES_PASSWORD=your_local_password docker compose up -d
   ```

## 2. Push to GitHub & Deploy on Vercel

1. Initialize Git and push to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Mavuno Direct prototype"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), click **Add New Project**, and import your GitHub repository.
3. Vercel automatically detects `vercel.json` (`npm run build`, output directory `dist`).
4. In Firebase Console (**Authentication → Settings → Authorized domains**), add your `<your-app>.vercel.app` domain so Google Sign-In works in production, then click **Deploy**.
