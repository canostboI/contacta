# Contacta

App web (PWA) de proveedores compartida por Bosch Pascual, RECOP y Munné.

- Dirección: https://canostboi.github.io/contacta/
- Datos: Supabase, proyecto «Contacta» (`ggnvohvdyxeyowbwpjws`). La clave de `config.js` es la pública (anon); la seguridad está en las reglas RLS.
- Solo pueden registrarse correos @boschpascual.com, @recop.net y @cmunne.com (lo controla la base de datos).
- Archivos: `index.html`, `styles.css`, `app.js` (toda la lógica), `config.js`, `sw.js` (funciona sin conexión), `manifest.webmanifest`, `img/`.
- `.github/workflows/despertar.yml` llama a Supabase cada día para que el plan gratuito no se pause.

En este repositorio no hay datos de proveedores ni claves secretas.
