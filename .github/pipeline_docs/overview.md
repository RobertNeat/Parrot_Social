# Założenia ogólne

Pipeline GitHub Actions jest niezależną warstwą automatyzacji. Aplikacje
pozostają właścicielem kodu, zależności, testów i komend jakości; pipeline
wywołuje tylko kontrakt opisany w `projects.json`.

Pipeline sprawdza, buduje i wdraża aplikacje znajdujące się w tym repozytorium,
nie zewnętrzne projekty. Działa dla wielu technologii (Node.js/Angular/NestJS,
Python i Spring Boot) i traktuje je jako jeden zestaw współpracujących
kontenerów. Ten sam commit SHA identyfikuje cały zestaw obrazów.

W tym repozytorium zestaw obejmuje frontend Angular (`parrot_web`) oraz
backend NestJS (`parrot_api`).

## Ścieżki

- `check` — walidacja konfiguracji, kontrola jakości, testy, budowanie aplikacji,
  SAST i skanowanie zależności/obrazu;
- `build` — budowa obrazu, skan Trivy i zapis obrazu w lokalnym rejestrze pod
  pełnym SHA;
- `deploy` — uruchomienie dokładnie tego zestawu obrazów na produkcji;
- `release` — publikacja obrazów wybranego SHA do GHCR;
- `github_release` — utworzenie wydania o nazwie taga.

Workflowy korzystają z self-hosted runnera. Obrazy są niezmienne, `latest` nie
jest używany, a operacje build/deploy/release są serializowane.

## Lokalne rejestry zależności

Runner i obrazy Docker korzystają z lokalnych rejestrów zamiast publicznych,
żeby budowy nie zależały od dostępności/limitów zewnętrznych usług:

- obrazy bazowe (`FROM`) używane przez Dockerfile w `.github/docker/` — lokalny
  rejestr ZOT (adres w `FROM` w tych plikach, np. `192.168.1.162:5000`), ten sam
  rejestr co cel push dla zbudowanych obrazów aplikacji. ZOT ma włączony `sync`
  z `on-demand pull-through` do `registry-1.docker.io` (z kontem Docker Hub po
  stronie serwera, dla wyższych limitów) — obraz jest pobierany i cache'owany
  przy pierwszym żądaniu, więc ścieżka w `FROM`/`image:` musi odzwierciedlać
  dokładną ścieżkę z Docker Hub: oficjalne obrazy (`node`, `nginx`, `python`,
  `maven`, `eclipse-temurin`) są pod `library/`, obrazy użytkowników/organizacji
  bez tego prefiksu;
- zależności npm/pnpm — Verdaccio (adres w `ENV COREPACK_NPM_REGISTRY` w
  `.github/docker/angular.Dockerfile` i `node.Dockerfile`, przez nginx na
  porcie 80; aplikacja nasłuchuje tylko na `127.0.0.1:4873`), skonfigurowany
  w `.npmrc` w katalogu głównym repozytorium (kopiowany do stage'u `build` w
  Dockerfile, nieobecny w finalnym obrazie); corepack kieruje się tam przez
  `COREPACK_NPM_REGISTRY`; fetch-timeout/fetch-retries dla pnpm 11 są w
  `pnpm-workspace.yaml` (ustawienia CLI `--config.fetch-*` powodują crash w
  pnpm 11.17.0);
- zależności Maven — Reposilite, przez nginx na porcie 80 (aplikacja nasłuchuje
  tylko na `127.0.0.1:8080`), konfigurowany jako mirror w `.mvn/settings.xml`.

## Lokalny development (poza CI)

Root `package.json` udostępnia `dev:frontend`/`dev:backend` oraz
`build:frontend`/`build:backend` — budują jednorazowo zależności workspace
danej aplikacji (np. `packages/shared-dto`, filtr pnpm `"<nazwa-aplikacji>^..."`,
bez nazywania konkretnego pakietu), a następnie uruchamiają *jednym* poleceniem
(`pnpm --filter "<nazwa-aplikacji>..." --parallel run --if-present dev`) zarówno
`dev` aplikacji (watch mode: `ng serve` / `nest start --watch`), jak i `dev`
każdej jej zależności workspace (np. `packages/shared-dto` → `tsc -w`) —
równolegle, w jednym procesie grupowym. Jednorazowy build na starcie jest
potrzebny, bo świeży klon repo lub obraz Docker nie ma jeszcze katalogu
`dist/` pakietu współdzielonego; od tego momentu edycja plików w
`packages/shared-dto/src` przebudowuje `dist/` automatycznie, a dev server
aplikacji podchwytuje zmianę bez ręcznego restartu — zweryfikowano
empirycznie dla `apps/parrot_api` (edycja DTO wywołała rebuild `shared-dto`
i automatyczny restart `nest --watch`). Dla `apps/parrot_web` dodatkowo
wyłączono Vite-owe "prebundlowanie" pakietu `@parrot-social/shared-dto`
(`serve.options.prebundle.exclude` w `angular.json`), bo inaczej Vite
cache'uje raz zbudowany `dist/*.js` tego pakietu i nie obserwuje jego zmian.

Niezweryfikowane: czy Ctrl+C w terminalu z `dev:frontend`/`dev:backend`
czysto zatrzymuje całą grupę procesów (pnpm `--parallel` + oba `dev`
skrypty) na Windows — podczas testowania procesy były zatrzymywane
manualnie (`Stop-Process` po PID), nie przez Ctrl+C. Po zatrzymaniu
dev session'u sprawdź `Get-NetTCPConnection -LocalPort <port>` i
`Get-Process node,tsc`, czy nie zostały osierocone procesy.
