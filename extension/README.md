# Moonsto Capture — extensión de Chrome

Carga esta carpeta como extensión desempaquetada en `chrome://extensions` (modo desarrollador → **Cargar descomprimida**) después de configurar `config.js` a partir de `config.example.js`.

## Capturar páginas

**Capturar página** conserva el texto visible de la pestaña, URL, título y broker detectado.

## Buscar videos

**Buscar videos de esta página** revisa elementos `<video>` y `<source>`, metadatos Open Graph/Twitter, enlaces multimedia y recursos de red visibles para la página. Guarda solo metadatos y URLs candidatas; **no descarga los archivos**. Una URL `blob:` o una playlist protegida puede no servir como descarga directa.

Los registros de video se escriben en Firebase en `page_captures`, con `captureType: "video"` (las capturas normales no llevan ese valor). Para revisar o limpiar esa categoría, filtra la colección por el campo `captureType` igual a `video` y elimina los documentos correspondientes. El campo `videos` contiene URLs y metadatos estructurados.

## Pruebas locales

Desde la raíz del repo: `node --test extension/video-capture.test.mjs`.
