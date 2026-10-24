# Plan prac deweloperskich

## W trakcie

brak

## Do przeglądu: wyniki przeglądu UX (Claude in Chrome, 2026-10-24)

Przegląd wykonany na koncie seed `john.davis` / `parrot123` oraz na świeżo
zarejestrowanym koncie, przez standardowe ścieżki: logowanie, feed, profil,
grupy, wydarzenia, czat/wiadomości, powiadomienia, wyszukiwanie, ustawienia,
rejestracja + onboarding. Poniższa lista to surowe znaleziska do przejrzenia
przez użytkownika — nie wszystko musi być zaadresowane.

### Prawdopodobne bugi (nie tylko UX)

_Punkty 1 i 2 (NG0951 na /profile i /groups; cover photo preview w Settings)
zostały naprawione — zob. `profile.ts`, `group-page.ts`, `masonry-columns.ts`,
`personal-info-form.ts`, `settings.ts`._

### Nawigacja i duplikacja

_Punkt 3 ("Chat"/"Messages" duplikat) zostało naprawione — `/messages`
usunięty z sidebara, `redirectTo: 'chat'` zostawiony dla starych linków. Zob.
`shell.html`, `app.routes.ts`._

### Brakujące funkcje / martwe elementy UI

_Punkt 4 (ikona "i" na loginie) okazał się false positive — przycisk już ma
działający popover z kontami demo (`title`/`aria-label`/`(click)` obecne w
`login.html`/`login.ts`), tylko tooltip nie był widoczny na screenshocie._

_Punkty 5, 6, 7, 8, 9 (powiadomienia nieklikalne/brak Accept-Decline; brak
"Dodaj znajomego" na profilu; autorzy postów i lista Members/Owner grupy nie
linkują do profili; mini-czat feedu nieklikalny) zostały zaadresowane — nowy
moduł `friendship` (`apps/parrot_api/src/friendship/`, DTO w
`packages/shared-dto/src/friendship/`), rozszerzone
`notifications.repository.ts`/`notification.mapper.ts` (JOIN z `friendship`
dla Accept/Decline bez nowej migracji), `friendship.service.ts` we frontendzie,
oraz klikalne linki w `post-card.html`, `group-page.html`/`group.model.ts`,
`profile.html`/`profile.ts`, `notifications.html`/`.ts`, `feed.html`/`.ts`
(mini-czat: kliknięcie kontaktu przełącza aktywną rozmowę, koperta linkuje do
`/chat`). Zob. też `apps/parrot_web/src/app/core/mock/mock-data.ts`
(zaktualizowany pod nowe typy `Group.members`/`AppNotification.type`).

_Punkt 11 (puste stany /chat i mini-chat bez komunikatu) zostało naprawione —
zob. `chat.html`/`chat.css`, `feed.html`/`feed.css`._

### Drobne/kosmetyczne

_Punkty 10 i 14 (nieklikalne karty wydarzeń / brak strony szczegółów; brak
pola lokalizacji w "Create event") zostały zaadresowane — zob.
`/events/:id` (`event-page.ts`/`.html`/`.css`), `events.ts`/`.html`/`.css`,
`apps/parrot_api/src/events/`, `deploy/liquibase/changelog/012-event-location.xml`._

_Punkt 12 (brak tooltipa różnicującego like/upvote) naprawiony — `title`/
`aria-label` dodane w `post-card.html`._

_Punkt 13 (identyczne zdjęcie placeholder "ticket" na wszystkich kartach
wydarzeń) zostało naprawione dwuetapowo: usunięto zahardkodowany
`FALLBACK_EVENT_IMAGE` w `events.service.ts` (`imageUrl` jest teraz opcjonalny
na `EventItem`, `events.html`/`event-page.html` pokazują neutralną ikonę
"event" w `.event-image-placeholder` gdy wydarzenie faktycznie nie ma zdjęcia),
a następnie przywrócono realne, unikalne zdjęcia z oryginalnych mock-danych
(`eventImg('event_N.png')`) dla 4 z 6 eventów seed przez nowy
`deploy/liquibase/seed/010-seed-event-images.xml` (pliki skopiowane z
`apps/parrot_web/public/resources/event/` do `deploy/liquibase/seed/media/`
dla łatwej podmiany w przyszłości). Tylko 4 unikalne obrazki istnieją w
mockach, więc "Underground Beats Night" i nowo tworzone eventy nadal
dostają neutralny placeholder zamiast duplikować zdjęcie — to oczekiwane._

_Punkty 15, 16, 17 zostały zaadresowane:_
- _15 (branding rejestracji): nagłówek "Parrot Social" dodany w `register.html`/`.css`._
- _16 (losowe zdjęcie dla nowego usera): to był frontendowy bug w mapperach
  (`user.mapper.ts`, `profile.service.ts`, `post.mapper.ts`, `chat.mapper.ts`),
  nie backend — podmieniały brakujący avatar/cover na zdjęcie realnej osoby z
  seed (`resources/person/men_1.png`) zamiast neutralnego placeholdera. Nowe
  assety `public/resources/placeholder/{avatar,cover}.svg`._
- _17 (puste avatary grup): ikona "groups" dodana w `groups-list.html`/`.css`._

### Seed media - wykorzystanie wszystkich zdjęć

Wszystkie zdjęcia w `deploy/liquibase/seed/media/` są teraz wykorzystane w
danych seed (żaden plik z puli mock-data nie zostaje bez przeznaczenia,
poza celowym zapasem 5 avatarów męskich + 5 żeńskich - `men_2,3,4,5,7` i
`women_2,3,4,5,6` - zarezerwowanym na przyszłość, gdyby ktoś chciał dodać
kolejnych userów seed). Zero duplikatów treści (zweryfikowane przez md5sum)
i zero duplikatów rozmiaru pliku wśród wszystkich plików w tym katalogu.

36 wcześniej nieużywanych `post_image_*.png` zostało przypisanych jako
dodatkowe posty (3-4 na usera) dla istniejących 10 kont seed przez nowy
`deploy/liquibase/seed/011-seed-more-posts.xml` - teksty dobrane konkretnie
do treści każdego zdjęcia, kontynuujące zainteresowania już ustalone w
`003-seed-posts.xml` (Jamal = szlaki/outdoor, Solomon = muzyka/tłumy,
Zakaria = dzika przyroda, Seamus = kemping, itd.). Stack przeszedł pełny
redeploy od zera (wolumen `parrot-social_postgres-data` usunięty i odtworzony
- zgodnie z założeniem że nic z tymi danymi nie było jeszcze wdrożone poza
tym środowiskiem), wszystkie 93 changesety zaaplikowały się czysto.
