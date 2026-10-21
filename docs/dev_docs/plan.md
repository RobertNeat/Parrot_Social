# Plan prac deweloperskich

## Wdrożenie realnego API (parrot_web <-> parrot_api), per komponent UI

Biblioteki: `pg` (parametryzowany SQL, bez ORM - schemat zarządzany przez
Liquibase), `@nestjs/jwt` + Node `crypto.scrypt` (hashowanie haseł).

Po każdym kroku: `pnpm run check` (lint/typecheck/prettier/testy), pauza,
czekam na dalsze dyspozycje użytkownika.

- [ ] 8. Upload zdjęć (nowy endpoint POST /media/upload - obecnie nie istnieje)
