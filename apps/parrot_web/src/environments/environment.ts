// parrot-web and parrot-api are separate origins (nginx does not proxy /api), so API calls need an
// absolute base URL. Matches the PARROT_API_PUBLIC_ORIGIN default in deploy/compose.yml / .env.example.
export const environment = {
  apiUrl: 'http://localhost:10710',
};
