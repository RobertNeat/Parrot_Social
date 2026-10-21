<p align="center">
  <img src="apps/parrot_web/public/parrot_image.png" width="150" alt="HIS logo">
</p>

<h1 align="center">ParrotSocial - social media platform</h1>

<p align="center">
ParrotSocial to kompletna platforma społecznościowa łącząca ludzi wokół tego, co naprawdę się liczy — rozmów, wspomnień i wspólnych wydarzeń. Pozwala budować profil, dzielić się chwilami na tablicy, rozmawiać na czacie w czasie rzeczywistym, dołączać do grup zainteresowań i śledzić nadchodzące wydarzenia. Projekt powstał jako pełnoprawna aplikacja produkcyjna — od frontendu po infrastrukturę — z naciskiem na bezpieczeństwo, solidną architekturę i jakość kodu na poziomie, którego nie wstydziłby się żaden zespół komercyjny.
</p>

# Used technologies

### Bezpieczeństwo
- **Własna implementacja hashowania haseł (`node:crypto` scrypt)** — hasła nigdy nie trafiają do bazy w czystej formie; każde hasło jest solone losową 16-bajtową solą i przetwarzane przez `scrypt`, algorytm odporny na łamanie przy użyciu kart graficznych (GPU/ASIC).
- **Porównanie haszy w czasie stałym (`timingSafeEqual`)** — zabezpiecza logowanie przed atakami typu timing-attack, czyli odgadywaniem hasła na podstawie czasu odpowiedzi serwera.
- **Logowanie przez tokeny JWT** z wymuszonym sekretem konfiguracyjnym i czasem życia tokenu — dostęp do aplikacji jest zawsze weryfikowany, a brak klucza konfiguracyjnego zatrzymuje start serwera (fail-fast) zamiast działać w niebezpiecznym trybie.
- **Autorski, jednorazowy system dostępu do zdjęć** — każde zdjęcie (avatar, post, czat) jest udostępniane przez bezpieczny, tymczasowy token powiązany z ciasteczkiem sesji, zużywany jednorazowo. Dzięki temu zdjęcia nie są publicznie dostępne pod stałym adresem i nie mogą być „podlinkowane” przez osoby z zewnątrz.
- **Ochrona przed podstawianiem ścieżek plików (path traversal)** — pliki na dysku serwera są zapisywane pod losowymi identyfikatorami, niezależnymi od nazw podawanych przez użytkownika.
- **Automatyczne skanowanie obrazów Dockera (Trivy)** w procesie budowania — każda nowa wersja aplikacji jest sprawdzana pod kątem znanych podatności bezpieczeństwa, a budowa zatrzymuje się, jeśli wykryte zostaną krytyczne zagrożenia.
- **Kontenery działające z ograniczonymi uprawnieniami** — aplikacja nie działa jako administrator systemu (root), co ogranicza skutki potencjalnego włamania.

### Baza danych
- **PostgreSQL** jako główna baza danych — przechowuje użytkowników, posty, komentarze, grupy, wydarzenia, wiadomości i powiadomienia.
- **Liquibase** do zarządzania wersjami struktury bazy danych oraz do zasilania środowiska danymi testowymi (seed) — każda zmiana w strukturze bazy jest opisana, odwracalna i możliwa do odtworzenia na każdym środowisku.
- **Starannie zaprojektowane relacje między danymi** — reguły usuwania dopasowane do sensu biznesowego (np. usunięcie konta nie usuwa cichcem historii czatu innym uczestnikom rozmowy), indeksy przyspieszające najczęstsze operacje (np. szybkie wczytywanie historii czatu i powiadomień).
- **Bezpośrednia, kontrolowana komunikacja z bazą danych** (bez warstwy pośredniej typu ORM) — pełna kontrola nad zapytaniami i ich wydajnością, z zabezpieczeniem przed SQL injection na poziomie każdego zapytania.
- **Transakcyjne bezpieczeństwo przy przesyłaniu plików** — jeśli zapis informacji o pliku do bazy się nie powiedzie, plik jest automatycznie usuwany z dysku, co zapobiega powstawaniu „osieroconych” danych.

### Backend
- **NestJS (Node.js/TypeScript)** — modularna architektura serwera, gdzie każda funkcja biznesowa (konta, posty, grupy, wydarzenia, czat, powiadomienia, media) jest odseparowanym, niezależnie testowalnym modułem.
- **Współdzielone typy danych między frontendem i backendem** (osobny pakiet `shared-dto`) — eliminuje niezgodności danych między aplikacją w przeglądarce i serwerem.
- **Wzorzec Mapper** oddzielający dane bazy od danych wysyłanych do użytkownika — pozwala zmieniać wewnętrzną strukturę bazy bez wpływu na frontend.
- **Przejrzysta obsługa błędów bazy danych** — zamiast ujawniania szczegółów technicznych, aplikacja zwraca użytkownikowi zrozumiałe komunikaty (np. „ten adres e-mail jest już zajęty”).

### Frontend
- **Angular 22** z najnowszymi mechanizmami frameworka (Signals, komponenty standalone, leniwe wczytywanie stron) — aplikacja jest szybka i responsywna, a strony ładują się tylko wtedy, kiedy są potrzebne.
- **Spójna obsługa sesji logowania** — automatyczne dołączanie tokenu użytkownika do każdego zapytania oraz płynne odtwarzanie sesji po odświeżeniu strony, bez niepotrzebnego wylogowywania przy chwilowych problemach z siecią.
- **Nowoczesny, funkcyjny styl pisania komponentów** — czytelny, łatwy w utrzymaniu i rozwijaniu kod interfejsu.

### DevOps i infrastruktura
- **Docker i Docker Compose** — cała platforma (baza danych, migracje, backend, frontend) uruchamia się jednym poleceniem, identycznie na komputerze dewelopera i na serwerze produkcyjnym.
- **Zautomatyzowane budowanie obrazów (multi-stage Docker build)** — finalne obrazy aplikacji są lekkie i zawierają tylko to, co potrzebne do działania, bez narzędzi developerskich.
- **Frontend serwowany przez nginx** — sprawdzony, wydajny serwer WWW używany przez największe serwisy internetowe na świecie.
- **Pipeline CI/CD oparty na GitHub Actions** — każda zmiana w kodzie jest automatycznie budowana, skanowana pod kątem bezpieczeństwa i publikowana jako gotowa do wdrożenia wersja z unikalnym numerem.
- **Automatyczne wdrożenia produkcyjne** z systemem wersjonowanych wydań (release) i publikacją obrazów w prywatnym rejestrze kontenerów.
- **Health-checki usług** — system sam sprawdza, czy baza danych i serwer są gotowe do pracy, zanim wystartuje kolejny element platformy, co eliminuje błędy przy starcie.

### Jakość kodu i testy
- **Testy jednostkowe i end-to-end (Vitest)** — w tym testy napisane specjalnie pod kątem scenariuszy bezpieczeństwa (np. próba użycia wygasłego lub cudzego tokenu dostępu do zdjęcia).
- **Statyczna analiza kodu (oxlint) i automatyczne formatowanie (Prettier)** — spójny, czytelny styl kodu w całym projekcie.
- **TypeScript w trybie strict** w każdej części projektu — błędy w typach danych są wychwytywane zanim kod trafi na serwer.
- **Jedna komenda weryfikująca jakość** (lint + typy + formatowanie + testy), używana identycznie lokalnie i w procesie CI — żadna zmiana nie trafia do produkcji bez przejścia tej samej bramki jakości.

# Features

- **Konto i logowanie** — rejestracja, logowanie (nazwą użytkownika lub e-mailem), bezpieczne wylogowanie oraz proces wdrożenia nowego użytkownika (onboarding) po pierwszym zalogowaniu.
- **Profil użytkownika** — edycja danych osobowych (opis, praca, edukacja, status związku, lokalizacja), zmiana zdjęcia profilowego i zdjęcia w tle, przeglądanie profili innych osób wraz z ich aktywnością.
- **Tablica i posty** — publikowanie postów z tekstem i zdjęciem, usuwanie własnych wpisów, polubienia i głosy „upvote”, komentowanie wpisów innych użytkowników.
- **Znajomi i kontakty** — lista znajomych, zarządzanie kontaktami i relacjami między użytkownikami.
- **Grupy** — przeglądanie i tworzenie grup zainteresowań, dołączanie i opuszczanie grup, własna tablica postów widoczna tylko dla członków grupy, lista uczestników.
- **Wydarzenia** — przeglądanie i tworzenie wydarzeń, oznaczanie zainteresowania udziałem oraz wycofywanie deklaracji.
- **Czat w czasie rzeczywistym** — lista konwersacji, wysyłanie wiadomości tekstowych i ze zdjęciami, dostęp ograniczony wyłącznie do uczestników rozmowy.
- **Powiadomienia** — lista aktywności dotyczących użytkownika oraz możliwość oznaczenia wszystkich powiadomień jako przeczytane.
- **Wyszukiwanie** — szybkie znajdowanie osób, grup i wydarzeń w ramach platformy.
- **Media** — bezpieczne przesyłanie i przechowywanie zdjęć (profilowych, w postach, w czacie) z ochroną przed nieautoryzowanym dostępem.
- **Ustawienia konta** — zarządzanie danymi profilowymi i preferencjami konta w jednym miejscu.

# Project gallery

- **Dołącz do społeczności** — zarejestruj się, uzupełnij swój profil i rozpocznij podróż w ParrotSocial.
- **Dziel się chwilami** — publikuj posty, dodawaj zdjęcia i reaguj na treści przyjaciół poprzez polubienia i komentarze.
- **Łącz się z ludźmi** — dodawaj znajomych, przeglądaj ich profile i buduj swoją sieć kontaktów.
- **Rozmawiaj na żywo** — pisz wiadomości do przyjaciół na czacie, wysyłaj zdjęcia i bądź w stałym kontakcie.
- **Twórz i dołączaj do grup** — znajdź społeczność wokół swoich zainteresowań i publikuj na tablicy grupy.
- **Nie przegap żadnego wydarzenia** — przeglądaj nadchodzące wydarzenia i oznaczaj, w których chcesz wziąć udział.
- **Bądź na bieżąco** — otrzymuj powiadomienia o aktywności dotyczącej Twojego konta.
