# Moonsto Capture — extensión de Chrome

Carga esta carpeta como extensión desempaquetada en `chrome://extensions` (modo desarrollador → **Cargar descomprimida**) después de configurar `config.js` a partir de `config.example.js`.

## Capturar páginas

**Capturar página** conserva el texto visible de la pestaña, URL, título y broker detectado.

## Buscar videos

**Buscar videos de esta página** revisa elementos `<video>` y `<source>`, metadatos Open Graph/Twitter, enlaces multimedia y recursos de red visibles para la página. Guarda metadatos y URLs candidatas; no descarga archivos por sí sola. Una URL `blob:` o una playlist protegida no es un enlace directo de descarga.

## Capturar solicitudes durante la reproducción

1. En la lección, pulsa **Preparar monitor de red** y concede el permiso temporal del dominio de la página y de los CDN detectados.
2. Regresa a la pestaña y reproduce o recarga el video para generar solicitudes nuevas.
3. Abre la extensión de nuevo. Las solicitudes multimedia aparecen con sus parámetros completos solo en el almacenamiento local de Chrome.
4. Si aparece una fuente MP4/WebM directa, **Descargar** inicia la descarga de Chrome (Chrome pedirá permiso la primera vez). Las playlists/segmentos HLS o DASH se muestran para inspección, pero no se ensamblan ni se evita DRM.
5. **Guardar rutas sin tokens en Firebase** registra el resultado en `page_captures` con `captureType: "video"`. En Firebase se omiten query strings y fragmentos; las URLs completas permanecen localmente en el navegador.

Para revisar o limpiar los registros de video, filtra `page_captures` por `captureType == "video"` y elimina esos documentos.

## Pruebas locales

Desde la raíz del repo: `node --test extension/*.test.mjs`.
