# Wariant dla compose.dev.yml: zakłada, że `dist/` jest już zbudowany lokalnie
# (pnpm --filter his-frontend build) przed `docker compose up --build`. Omija
# `pnpm install` w kontenerze - unika wolnego/niestabilnego rejestru npm przy
# lokalnym budowaniu obrazu. Dla CI/produkcji nadal służy angular.Dockerfile.
FROM 192.168.1.162:5000/library/nginx:1.29-alpine
RUN apk upgrade --no-cache
ARG BUILD_OUTPUT
ARG SERVER_CONFIG
ARG APP_PORT
COPY ${BUILD_OUTPUT} /usr/share/nginx/html
# templates/*.template -> conf.d/* via envsubst is the base image's own entrypoint
# behavior - lets env.js's ${PARROT_API_PUBLIC_ORIGIN} resolve at container start.
COPY ${SERVER_CONFIG} /etc/nginx/templates/default.conf.template
EXPOSE ${APP_PORT}
