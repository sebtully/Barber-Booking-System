# Barber Booking System (React + TypeScript)

En frontend prototype til et barber bookingsystem.

## Funktioner

- Admin kan oprette og se ledige tider.
- Klienter kan booke en ledig tid.
- Klienter kan sende tidsanmodninger.
- Admin kan acceptere/afslå anmodninger.
- Simuleret e-mail log viser hvilke data der bør sendes via backend (navn, dato, tidspunkt).

## Kom i gang

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Næste skridt (backend)

- Gem slots/bookinger/anmodninger i database.
- Tilføj autentifikation for admin.
- Send rigtige e-mails via fx SendGrid, Resend eller SMTP.
