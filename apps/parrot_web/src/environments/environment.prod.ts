// apiUrl is resolved at container start, not at build time: parrot-web and parrot-api are
// separate origins, and the production image is built once in CI then deployed to any host
// (compose.yml's PARROT_API_PUBLIC_ORIGIN), so it cannot be baked in during `ng build`.
// index.html loads /env.js before the app bundle; nginx renders that file from
// PARROT_API_PUBLIC_ORIGIN via envsubst on container start (see nginx.conf.template).
declare global {
  interface Window {
    __env?: { apiUrl?: string };
  }
}

export const environment = {
  get apiUrl(): string {
    return window.__env?.apiUrl || 'http://localhost:10710';
  },
};
