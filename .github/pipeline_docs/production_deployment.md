# `production_deployment`

## Uruchomienie

- automatycznie po `push` do `main` lub `master`;
- ręcznie przez `workflow_dispatch`, opcjonalnie z pełnym `sha`.

## Cel i kroki

Zapewnia, że na produkcji działa kompletny zestaw aplikacji z jednego commita.
Kroki są wykonywane sekwencyjnie:

1. `context` wybiera i normalizuje pełny SHA;
2. `check` sprawdza wszystkie aplikacje;
3. `build` buduje, skanuje Trivy i publikuje obrazy pod SHA do rejestru
   lokalnego;
4. `deploy` kopiuje Compose/config przez SSH i uruchamia zestaw obrazów o tym
   samym SHA.

## Konfiguracja produkcyjna

Plik `config.env` w katalogu `remote_dir` jest trwałą konfiguracją produkcji.
Przy pierwszym wdrożeniu, jeśli zdalny plik nie istnieje, pipeline kopiuje do
niego plik wskazany przez `deploy.config_file`. Przy kolejnych wdrożeniach
istniejący zdalny `config.env` pozostaje bez zmian i jest używany przez Docker
Compose.

Adres hosta, użytkownik, rejestr, pliki i katalog zdalny są w sekcji `deploy`
pliku [`../ci/projects.json`](../ci/projects.json). Wartości te (host, rejestr,
katalog zdalny) zależą od docelowej infrastruktury i muszą zostać ustawione
przez zespół wdrażający projekt — patrz [kontrakt konfiguracji](../ci/README.md#sekcja-deploy).

## `projects.env`

`deploy/compose.yml` nie zawiera nazw obrazów ani portów na stałe — odwołuje
się do zmiennych `<PROJECT>_IMAGE`, `<PROJECT>_HOST_PORT` i
`<PROJECT>_CONTAINER_PORT`, gdzie `<PROJECT>` to nazwa aplikacji z `name` w
`projects.json` zapisana wielkimi literami z podkreśleniami zamiast myślników
(np. dla `name: "parrot-api"` zmienne to `PARROT_API_IMAGE`,
`PARROT_API_HOST_PORT`, `PARROT_API_CONTAINER_PORT`). Plik
`deploy_compose_ssh.sh` generuje je z `projects.json` do `projects.env` i
kopiuje na hosta obok `config.env`; `docker compose` musi być zawsze wywoływany
z obydwoma plikami (`--env-file config.env --env-file projects.env`), inaczej
obrazy i porty pozostaną nierozwiązane. Ten sam skrypt kopiuje też katalog
`deploy/liquibase` na hosta (obok `compose.yml`), bo kontener `liquibase` w
`compose.yml` montuje go jako wolumen ze changelogami migracji.

## Układ Compose (produkcja vs lokalnie)

`deploy/compose.yml` jest kanonicznym plikiem dla usług wdrażanych na
produkcję (aplikacje opisane w `projects.json`: `parrot_web`, `parrot_api`,
oraz usługi pomocnicze `postgres` i jednorazowy `liquibase`). Nie zawiera
`build:` — deploy kopiuje na host tylko ten plik (plus katalog
`deploy/liquibase`). Obrazy/porty mają wartości domyślne `${VAR:-default}`
równe wartościom z `projects.json`, a `REGISTRY`/`IMAGE_TAG` domyślnie
`local`/`dev`; zgodność defaultów z `projects.json` sprawdza
`validate_projects.sh`.

`deploy/compose.dev.yml` jest nakładką lokalną (nadpisuje porty/budowanie na
potrzeby developmentu, bez zmiany pliku kanonicznego); `.env`/`.env.example`
w katalogu głównym repozytorium zawierają lokalne wartości zmiennych
środowiskowych do uruchomienia stosu na maszynie deweloperskiej.

Szczegółowy opis serwisów, sieci, healthchecków i zmiennych środowiskowych w
Compose utrzymywany jest w plikach `deploy/compose.yml`, `deploy/compose.dev.yml`
oraz `.env.example` w katalogu głównym repozytorium — to one są źródłem prawdy
dla konfiguracji środowiska uruchomieniowego, nie ten dokument.

## PostgreSQL i Liquibase

`parrot_api` jest jedyną aplikacją czytającą/zapisującą dane w bazie. Serwis
`postgres` w `deploy/compose.yml` używa trwałego wolumenu Docker
(`postgres-data`) i nie publikuje portu na produkcji — jest dostępny tylko w
sieci wewnętrznej `parrot-internal`. Lokalnie `deploy/compose.dev.yml` dodaje
pętlę zwrotną na porcie `PARROT_DB_HOST_PORT` (domyślnie `10720`) do podglądu
bazy z maszyny deweloperskiej. Nazwę bazy, użytkownika i hasło ustawia się
przez `PARROT_DB_NAME`, `PARROT_DB_USER` i `PARROT_DB_PASSWORD` w
`.env`/`.env.example` (na serwerze produkcyjnym hasło należy zmienić przed
pierwszym wdrożeniem).

Migracje schematu wykonuje jednorazowy kontener `liquibase`
(`restart: "no"`), uruchamiany po `postgres` (`condition: service_healthy`) i
przed `parrot-api` (`depends_on: liquibase: condition:
service_completed_successfully`). Changelogi leżą w `deploy/liquibase/` i są
montowane do kontenera jako wolumen tylko do odczytu — ten katalog jest
kopiowany na host obok `compose.yml` przez `deploy_compose_ssh.sh`. Seed danych
startowych (`deploy/liquibase/seed/changelog-seed.xml`) uruchamia się tylko w
kontekście `seed`, włączanym przez `PARROT_LIQUIBASE_CONTEXTS=schema,seed`
(domyślnie `schema` - bez seeda, bezpieczne dla produkcji).

Ten projekt nie korzysta z mTLS, FHIR, SNOMED/Snowstorm ani usług mockowych
Spring Boot — są to elementy specyficzne dla innego, niezwiązanego projektu
(platformy bankowej), z którego pierwotnie skopiowano narzędzia pipeline.
