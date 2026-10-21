# `pre_merge_check`

## Uruchomienie

- `push` do każdej gałęzi poza `release_*` i `deploy_*`;
- `pull_request` do `main` lub `master`;
- ręcznie przez `workflow_dispatch`.

## Cel i kroki

Weryfikuje kod przed scaleniem. Workflow uruchamia reużywalny
`.github/workflows/_job_check.yaml`, który:

1. waliduje `.github/ci/projects.json`;
2. tworzy macierz wszystkich aplikacji;
3. dla każdej aplikacji uruchamia właściwy check Node.js, Python lub Spring
   Boot.

Dla Node.js wykonywany jest skrypt wskazany w `check_script`; pozostałe kroki
kontroli wynikają ze skryptów `.github/steps/check_*.sh`.

`check_node.sh` przed uruchomieniem `check_script` aplikacji najpierw buduje
(`build`), a następnie uruchamia `check` każdej zależności workspace tej
aplikacji (np. `packages/shared-dto`) przez filtr pnpm `"${PACKAGE_NAME}^..."`
(zależności danego pakietu, bez niego samego). Dzięki temu błąd lint/typecheck/
format w bibliotece współdzielonej failuje check tak samo jak błąd w
aplikacji. `packages` nie jest osobnym wpisem w `projects.json` (nie jest w
`pipeline.project_roots`), więc ten krok jest jedynym miejscem, w którym
`shared-dto` jest sprawdzane w CI — uruchamia się raz na każdą aplikację,
która go używa (obecnie dwukrotnie: dla `parrot-api` i `parrot-web`).
Pipeline nie filtruje kroków po zmienionych ścieżkach — każdy push/PR
uruchamia check dla całego zestawu aplikacji, więc zmiana tylko w
`packages/shared-dto` i tak wywoła ten krok.
