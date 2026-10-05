# CLAUDE.md — moonsto

## Proyecto

Webapp de inversiones personales de Arturo (México, radicado en Osaka, Japón).

- **Stack:** Vite + React + TypeScript + Tailwind CSS
- **Firebase Hosting:** proyecto `moon-sto` → https://moon-sto.web.app
- **Firestore:** proyecto `moonsto-e2176` (distinto al de hosting)
- **GitHub:** pumacamargo/moon-sto
- **Monedas:** CAD, MXN, JPY — almacenar en moneda original, mostrar convertida

---

## Chrome Extension

Captura páginas de brokers y las guarda en Firestore `page_captures` para parsear después.

- **Firestore project:** `moonsto-e2176`
- **API key:** en `extension/config.js` (gitignored — crear manualmente en cada máquina)
- **Colección:** `page_captures` con campos: `broker`, `brokerDomain`, `pageUrl`, `pageTitle`, `text`, `capturedAt`, `status`, `sizeKB`
- **Reglas Firestore:** `page_captures` permite read/write sin autenticación (ver `firestore.rules`)

### Corrección pendiente en popup.js
El dominio de CETESdirecto en `KNOWN_BROKERS` debe ser `cetesdirecto.com` (no `cetesdirecto.com.mx`), actualmente queda como `Unknown`.

---

## Brokers — Protocolo de captura con la extensión

### CETESdirecto

**URL base:** https://www.cetesdirecto.com

#### Capturas recurrentes (cada 2 semanas)

El usuario debe hacer 2 capturas por sesión:

1. **Detalle BONDDIA**
   - Ir a: `Portafolio` → hacer click en el texto **"BONDDIA"**
   - Muestra: monto valuado, títulos, tasa de compra, monto disponible, plusvalía, precio de mercado, fecha de inversión, fecha de vencimiento
   - URL: `loadPortafolio` (misma página, contenido dinámico)

2. **Detalle CETES**
   - Ir a: `Portafolio` → hacer click en el texto **"CETES"**
   - Muestra: monto valuado por serie, títulos, tasa de compra, precio de adquisición, plazo, monto invertido por posición
   - URL: `loadPortafolio` (misma página, contenido dinámico)

#### Captura de origen (solo cuando se deposita dinero nuevo)

3. **Ingresos de efectivo**
   - Ir a: `Movimientos` → sección **"Ingresos de efectivo"**
   - Navegar al mes en que se hizo el depósito y capturar
   - Muestra: fecha de ingreso, tipo (SPEI/domiciliación), importe original, importe ingresado
   - URL: `loadMovimientos`
   - **Importante:** va mes por mes — si se depositó en varios meses, capturar cada mes por separado

#### Datos del portafolio actual de Arturo (oct 2026)

- **Origen:** $592,600 MXN depositados (feb y mar 2026)
- **BONDDIA:** $327,128.18 invertidos, tasa 6.40% anual
- **CETES:** $287,189.02 invertidos (~6.05% prom.), series 261022 y 261029 (vencen oct 2026)
- **Valor total:** $614,430.33 | Ganancia real: ~$21,830 (3.68% en 8 meses ≈ 5.5% anualizado)

#### Notas de scraping

- CETESdirecto carga el portafolio dinámicamente vía AJAX — el resumen y los detalles son la misma URL `loadPortafolio` con contenido diferente según el click
- El resumen general (tabla con BONDDIA + CETES + totales) **no es necesario** capturarlo — los detalles individuales ya contienen toda la información necesaria
- El texto capturado con `innerText` es limpio y parseable (~700-1300 chars por captura)
- `integerValue` en Firestore REST API debe enviarse como string (e.g. `"45"` no `45`)

---

## Deploy y snapshot AI-readable

### Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run deploy` | **Usar siempre este.** Genera snapshot → build → firebase deploy |
| `npm run snapshot` | Solo regenera `public/snapshot.html` con datos reales de Firestore |
| `npm run build` | Solo compila (sin snapshot ni deploy) |
| `firebase deploy --only hosting` | Solo sube dist/ — **no** regenera el snapshot |

### Qué es el snapshot

`public/snapshot.html` es una página HTML estática sin JavaScript que contiene todas las posiciones del portafolio con datos reales leídos de Firestore. Se genera con `scripts/generate-snapshot.ts` vía la REST API de Firestore (no requiere auth porque `page_captures` es público).

**URL pública:** https://moon-sto.web.app/snapshot.html

Esta página permite que herramientas de AI (ChatGPT, Claude, etc.) lean el portafolio completo sin ejecutar JavaScript. El `index.html` principal también tiene JSON-LD y `<noscript>` con metadata del portafolio.

### Cuándo regenerar el snapshot

- **Siempre que hagas deploy** → usa `npm run deploy` en vez de `firebase deploy`
- **Después de capturar datos nuevos con la extensión** → corre `npm run deploy`
- Si el snapshot se desactualiza, los AI verán datos viejos

### Cómo funciona el script

`scripts/generate-snapshot.ts`:
1. Lee `.env` para obtener API key y project ID de Firestore
2. Llama a la REST API de Firestore (`/documents/page_captures`)
3. Corre los mismos parsers que la app (`src/lib/parsers/`)
4. Construye posiciones con la misma lógica que `useAllPositions`
5. Escribe `public/snapshot.html` con HTML puro (dark theme, tablas, totales por moneda)

---

## Lógica de actualización en la webapp

- Si la última captura de un broker tiene **más de 2 semanas**, mostrar aviso pidiendo actualizar
- Al parsear capturas, identificar el tipo por URL + contenido:
  - `loadMovimientos` + "Ingresos de efectivo" → tipo `deposit_origin`
  - `loadPortafolio` + "BONDDIA" + "Precio de mercado" → tipo `bonddia_detail`
  - `loadPortafolio` + "CETES" + "Serie:" → tipo `cetes_detail`
