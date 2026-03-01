# Barber Booking System (React + TypeScript + Node API)

Frontend viser klient-dashboard som startside.
Admin logger ind via backend-session (`HttpOnly` cookie).

## Funktioner

- Klient kan se ledige tider i kalender og sende tidsanmodning uden login.
- Admin login via backend (`/api/auth/admin/*`).
- Admin-endpoints er beskyttet (`/api/admin/*`).
- E-mail kan sendes ved ny anmodning og ved godkend/afvis.

## Lokal udvikling

Installer:

```bash
npm install
```

Start backend (terminal 1):

```bash
npm run dev:server
```

Start frontend (terminal 2):

```bash
npm run dev:client
```

Vite proxy sender `/api/*` requests til `http://localhost:3001`.

## Environment variabler

Lav en `.env` fil ud fra `.env.example`:

```bash
cp .env.example .env
```

Noedvendige variabler:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt hash af admin password)
- `ADMIN_LOGIN_WINDOW_MS` (valgfri, default `600000`)
- `ADMIN_LOGIN_MAX_ATTEMPTS` (valgfri, default `8`)
- `ADMIN_LOGIN_LOCK_MS` (valgfri, default `900000`)
- `MONGODB_URI` (fx MongoDB Atlas connection string)
- `MONGODB_DB` (fx `barber_booking`)
- `SMTP_HOST` (typisk `smtp.gmail.com`)
- `SMTP_PORT` (typisk `465`)
- `SMTP_USER` (din Gmail)
- `SMTP_PASS` (Gmail App Password, 16 tegn)
- `MAIL_TO` (hvor anmodningsmails skal sendes hen)

## MongoDB setup

Backend bruger nu MongoDB til:

- ledige/bookede tider
- kundeanmodninger
- notifikationslog

Du skal derfor have en gyldig `MONGODB_URI`.
Du kan bruge enten lokal MongoDB eller MongoDB Atlas.

For at generere hash til `ADMIN_PASSWORD_HASH` kan du koere:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('DIT_PASSWORD', 12));"
```

## Launch paa Vercel

Projektet er sat op til Vercel med:

- Static frontend fra `dist`
- Serverless API handler i `api/[...path].mjs`
- Fuld backend-routing paa `/api/*`

Deploy:

1. Push kode til GitHub.
2. Import repo i Vercel.
3. Build command: `npm run build` (sat i `vercel.json`).
4. Output directory: `dist` (sat i `vercel.json`).
5. Tilfoej alle env vars fra `.env.example` i Vercel Project Settings -> Environment Variables.
6. Deploy.

Efter deploy:

- Frontend kalder automatisk samme domain paa `/api/*`.
- Admin login/session virker via cookie paa samme origin.

## Vigtig note om data

Data bliver nu gemt i MongoDB og overlever server-genstart og deploy.
Admin sessions ligger stadig i memory og kan nulstilles ved backend-restart.

Backend har desuden:
- HttpOnly + Secure (production) + SameSite=Strict admin-session cookie
- Basic rate limit paa admin login
