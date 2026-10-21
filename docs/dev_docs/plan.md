# Plan prac deweloperskich

## Wdrożenie realnego API (parrot_web <-> parrot_api), per komponent UI

Biblioteki: `pg` (parametryzowany SQL, bez ORM - schemat zarządzany przez
Liquibase), `@nestjs/jwt` + Node `crypto.scrypt` (hashowanie haseł).

Po każdym kroku: `pnpm run check` (lint/typecheck/prettier/testy), pauza,
czekam na dalsze dyspozycje użytkownika.

- [ ] 3. Feed (lista stron, create/like/upvote/comment/delete)
- [ ] 4. Profile (publiczny profil po id)
- [ ] 5. Groups (lista + strona grupy, join/leave)
- [ ] 6. Events (lista, interested toggle)
- [ ] 7. Chat (konwersacje, wysyłanie wiadomości)
- [ ] 8. Notifications (lista, markAllRead)
- [ ] 9. Upload zdjęć (nowy endpoint POST /media/upload - obecnie nie istnieje)
