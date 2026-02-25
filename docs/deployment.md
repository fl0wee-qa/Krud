# Deployment Guide

This project is full-stack (`Next.js + NestJS + PostgreSQL`), so it should not be deployed with GitHub Pages.

## Recommended Setup (GitHub-based)

- Source code: GitHub repository
- Web app (`apps/web`): Vercel
- API (`apps/api`): Render or Railway
- Database: managed PostgreSQL (Render, Railway, Neon, Supabase)
- Domain: custom domain connected to Vercel/Render

## 1. Push Project to GitHub

If repository is not connected yet:

```bash
git init
git add .
git commit -m "chore: setup krud platform"
git branch -M main
git remote add origin https://github.com/<your-user>/Krud.git
git push -u origin main
```

## 2. Deploy API (`apps/api`)

Create a new Render/Railway service from GitHub repo and set root directory to `apps/api`.

Build command:

```bash
npm ci && npm run build
```

Start command:

```bash
npm run start
```

Required environment variables:

- `NODE_ENV=production`
- `PORT=3001` (or provider default)
- `DATABASE_URL=<managed-postgres-url>`
- `JWT_SECRET=<strong-secret>`
- `JWT_REFRESH_SECRET=<strong-secret>`
- `JWT_ACCESS_TTL=900`
- `JWT_REFRESH_TTL=604800`
- `SLACK_MODE=mock`
- `GIT_MODE=links`

After first deploy, run migrations and seed once:

```bash
npm run db:deploy
npm run db:seed
```

## 3. Deploy Web (`apps/web`)

Create Vercel project from same GitHub repo with root directory `apps/web`.

Build command:

```bash
npm run build
```

Required environment variables:

- `NEXT_PUBLIC_API_URL=https://<your-api-domain>/api`

## 4. Connect Custom Domain

- Add domain in Vercel (web) and API provider (subdomain for API).
- Example:
  - Web: `https://krud.yourdomain.com`
  - API: `https://api.krud.yourdomain.com`
- Update `NEXT_PUBLIC_API_URL` to API domain and redeploy web.

## 5. GitHub Actions Integration

This repo includes:

- `ci.yml`: lint/build/e2e checks on push and PR
- `cd.yml`: container build and optional deploy hooks on `main`

To auto-trigger provider deploys via hooks, set repository secrets:

- `DEPLOY_HOOK_API`
- `DEPLOY_HOOK_WEB`

## Notes

- GitHub itself hosts code and CI/CD, but your running app still needs an app host (Vercel/Render/Railway/etc).
- GitHub Pages is only suitable for static frontend and does not run NestJS or PostgreSQL.
