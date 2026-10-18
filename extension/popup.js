import { normalizeVideoCandidates, toFirestoreVideoFields } from './video-capture.js'
import { isVideoRequest, isDirectDownloadRequest, safeRequestLabel } from './video-network.js'

const FIREBASE_PROJECT = window.MOONSTO_CONFIG?.firebaseProject || ''
const FIREBASE_KEY     = window.MOONSTO_CONFIG?.firebaseKey     || ''
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`

const KNOWN_BROKERS = {
  'gbm.com.mx':          'GBM+',
  'cetesdirecto.com.mx': 'CETESdirecto',
  'td.com':              'TD Bank',
  'tddi.com':            'TD Direct Investing',
  'rakuten-sec.co.jp':   '楽天証券 (Rakuten)',
}

// ─── helpers ────────────────────────────────────────────────

function detectBroker(url) {
  for (const [domain, name] of Object.entries(KNOWN_BROKERS)) {
    if (url.includes(domain)) return { domain, name }
  }
  return null
}

function showStatus(msg, type) {
  const el = document.getElementById('status')
  el.textContent = msg
  el.className = `status ${type}`
}

function setLoading(on) {
  const btn = document.getElementById('btnCapture')
  btn.disabled = on
  btn.innerHTML = on
    ? '<div class="spinner"></div> Capturando...'
    : `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
       </svg> Capturar página`
}

// ─── Firestore REST ──────────────────────────────────────────

async function firestoreAdd(collection, fields) {
  const body = JSON.stringify({ fields })
  console.log('[moonsto] POST to Firestore, fields keys:', Object.keys(fields))
  console.log('[moonsto] body size:', body.length, 'chars')
  const res = await fetch(`${FS_BASE}/${collection}?key=${FIREBASE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[moonsto] Firestore error response:', JSON.stringify(json))
    // log each field size to find the culprit
    for (const [k, v] of Object.entries(fields)) {
      const val = v.stringValue ?? v.integerValue ?? v.booleanValue ?? v.timestampValue ?? '?'
      console.log(`[moonsto]   field "${k}": type=${Object.keys(v)[0]}, len=${String(val).length}`)
    }
    throw new Error(json.error?.message || `HTTP ${res.status}`)
  }
  return json
}

async function firestoreList(collection, pageSize = 5) {
  const url = `${FS_BASE}/${collection}?key=${FIREBASE_KEY}&pageSize=${pageSize}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.documents || []
}

// Se ejecuta dentro de la pestaña activa; solo recoge referencias/metadatos, no descarga archivos.
function collectPageVideoInfo() {
  const candidates = []
  const pageUrl = window.location.href
  const pageTitle = document.title || ''
  const add = (url, metadata = {}) => {
    if (typeof url === 'string' && url.trim()) candidates.push({ ...metadata, url: url.trim() })
  }
  const mediaPattern = /\.(?:mp4|m4v|mov|webm|m3u8|mpd|m4s|ts)(?:$|[?#])/i

  document.querySelectorAll('video').forEach((video, index) => {
    const title = video.getAttribute('title') || video.getAttribute('aria-label') ||
      video.querySelector('track[kind="captions"][src]')?.getAttribute('label') || `Video ${index + 1}`
    const metadata = {
      title,
      poster: video.poster || '',
      width: video.videoWidth || video.width || 0,
      height: video.videoHeight || video.height || 0,
      durationSeconds: Number.isFinite(video.duration) ? video.duration : 0,
    }
    add(video.currentSrc || video.src, { ...metadata, source: 'video-element' })
    video.querySelectorAll('source[src]').forEach(source => {
      add(source.src || source.getAttribute('src'), {
        ...metadata,
        source: 'video-source',
        mimeType: source.type || '',
      })
    })
  })

  document.querySelectorAll('meta[property="og:video"], meta[property="og:video:url"], meta[name="twitter:player:stream"]')
    .forEach(meta => add(meta.content, { source: 'video-meta', title: pageTitle }))

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.href || ''
    if (mediaPattern.test(href)) {
      add(href, { source: 'video-link', title: link.getAttribute('aria-label') || link.title || '' })
    }
  })

  try {
    performance.getEntriesByType('resource').forEach(resource => {
      if (mediaPattern.test(resource.name) || /\/(?:videoplayback|manifest)(?:[/?]|$)/i.test(resource.name)) {
        add(resource.name, { source: 'network-resource', mimeType: resource.initiatorType || '' })
      }
    })
  } catch { /* Resource timing may be unavailable on some pages. */ }

  return { pageUrl, pageTitle, candidates }
}

// ─── UI ─────────────────────────────────────────────────────

function requestOriginsForPage(result, fallbackUrl) {
  const origins = new Set()
  const addOrigin = value => {
    try {
      const parsed = new URL(value)
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') origins.add(`${parsed.origin}/*`)
    } catch { /* Ignore blob and malformed URLs. */ }
  }
  addOrigin(result?.pageUrl || fallbackUrl)
  for (const candidate of result?.candidates || []) {
    addOrigin(candidate.url)
    addOrigin(candidate.poster)
  }
  return [...origins]
}

function renderNetworkRequests(requests) {
  const section = document.getElementById('networkRequestsSection')
  const container = document.getElementById('networkRequestsItems')
  const candidates = requests.filter(request => isVideoRequest(request))
  container.replaceChildren()
  if (!candidates.length) {
    section.style.display = 'none'
    return
  }
  section.style.display = 'block'

  candidates.slice(-20).reverse().forEach((request, index) => {
    const row = document.createElement('div')
    row.className = 'capture-item'
    const label = document.createElement('span')
    label.className = 'capture-meta'
    label.textContent = `${request.type || 'resource'} · ${safeRequestLabel(request.url)}`
    row.appendChild(label)

    const openLink = document.createElement('a')
    openLink.href = request.url
    openLink.target = '_blank'
    openLink.rel = 'noopener noreferrer'
    openLink.textContent = 'Abrir'
    openLink.style.marginLeft = '8px'
    row.appendChild(openLink)

    if (isDirectDownloadRequest(request)) {
      const downloadButton = document.createElement('button')
      downloadButton.type = 'button'
      downloadButton.textContent = 'Descargar'
      downloadButton.style.marginLeft = '8px'
      downloadButton.addEventListener('click', async () => {
        try {
          const granted = await chrome.permissions.request({ permissions: ['downloads'] })
          if (!granted) {
            showStatus('Chrome no concedió permiso de descargas.', 'error')
            return
          }
          const extMatch = new URL(request.url).pathname.match(/\.(mp4|m4v|mov|webm)$/i)
          const ext = extMatch?.[1]?.toLowerCase() || (request.contentType.includes('webm') ? 'webm' : 'mp4')
          const filename = `Moonsto/${Date.now()}-video-${index + 1}.${ext}`
          chrome.downloads.download({ url: request.url, filename, saveAs: true }, () => {
            if (chrome.runtime.lastError) showStatus(`Descarga fallida: ${chrome.runtime.lastError.message}`, 'error')
            else showStatus('Descarga iniciada por Chrome.', 'success')
          })
        } catch (error) {
          showStatus(`No se pudo iniciar la descarga: ${error.message}`, 'error')
        }
      })
      row.appendChild(downloadButton)
    }
    container.appendChild(row)
  })
}

async function getCurrentTabVideoRequests(tabId) {
  const state = await chrome.storage.local.get(['moonstoVideoMonitorTabId', 'moonstoVideoNetworkRequests'])
  return state.moonstoVideoMonitorTabId === tabId ? (state.moonstoVideoNetworkRequests || []) : []
}

function renderHistory(docs) {
  const pageDocs = docs.filter(doc => doc.fields?.captureType?.stringValue !== 'video')
  if (!pageDocs.length) return
  document.getElementById('historySection').style.display = 'block'
  const container = document.getElementById('historyItems')
  container.replaceChildren()
  pageDocs.slice(0, 4).forEach(doc => {
    const f = doc.fields || {}
    const broker = f.broker?.stringValue || '—'
    const ts = f.capturedAt?.timestampValue
    const date = ts ? new Date(ts).toLocaleString('es-MX', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—'
    const el = document.createElement('div')
    el.className = 'capture-item'
    const brokerEl = document.createElement('span')
    brokerEl.className = 'capture-broker'
    brokerEl.textContent = broker
    const dateEl = document.createElement('span')
    dateEl.className = 'capture-meta'
    dateEl.textContent = date
    el.append(brokerEl, dateEl)
    container.appendChild(el)
  })
}

function renderVideoHistory(docs) {
  const videoDocs = docs.filter(doc => doc.fields?.captureType?.stringValue === 'video')
  if (!videoDocs.length) return
  document.getElementById('videoHistorySection').style.display = 'block'
  const container = document.getElementById('videoHistoryItems')
  container.replaceChildren()
  videoDocs.slice(0, 4).forEach(doc => {
    const f = doc.fields || {}
    const count = Number(f.videoCount?.integerValue || 0)
    const ts = f.capturedAt?.timestampValue
    const date = ts ? new Date(ts).toLocaleString('es-MX', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—'
    const el = document.createElement('div')
    el.className = 'capture-item'
    const titleEl = document.createElement('span')
    titleEl.className = 'capture-broker'
    titleEl.textContent = `${count} fuente${count === 1 ? '' : 's'} candidata${count === 1 ? '' : 's'}`
    const dateEl = document.createElement('span')
    dateEl.className = 'capture-meta'
    dateEl.textContent = date
    el.append(titleEl, dateEl)
    container.appendChild(el)
  })
}

// ─── init ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url   = tab?.url   || ''
  const title = tab?.title || ''

  document.getElementById('siteName').textContent = title || '(sin título)'
  document.getElementById('siteUrl').textContent  = url

  const broker = detectBroker(url)
  const pill   = document.getElementById('brokerPill')

  if (broker) {
    pill.textContent = `✓ ${broker.name}`
    pill.className   = 'broker-pill'
    pill.style.display = 'inline-block'
  } else {
    pill.textContent = 'Broker no reconocido — se capturará igual'
    pill.className   = 'broker-pill unknown'
    pill.style.display = 'inline-block'
  }

  const initialRequests = await getCurrentTabVideoRequests(tab.id)
  renderNetworkRequests(initialRequests)

  // cargar historial
  firestoreList('page_captures').then(docs => {
    renderHistory(docs)
    renderVideoHistory(docs)
  }).catch(() => {})

  // botón capturar
  document.getElementById('btnCapture').addEventListener('click', async () => {
    setLoading(true)
    showStatus('Inyectando script en la página...', 'info')

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          text:  document.body.innerText,
          title: document.title,
          url:   window.location.href,
        }),
      })

      const b = detectBroker(result.url)
      // strip null bytes and other control chars Firestore rejects
      const cleanText = result.text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ').trim()
      const sizeKB = Math.round(cleanText.length / 1024)
      console.log('[moonsto] text length after clean:', cleanText.length, 'chars')

      showStatus(`Guardando ${sizeKB} KB en Firestore...`, 'info')

      await firestoreAdd('page_captures', {
        broker:       { stringValue: b?.name   || 'Unknown' },
        brokerDomain: { stringValue: b?.domain || new URL(result.url).hostname },
        pageUrl:      { stringValue: result.url },
        pageTitle:    { stringValue: result.title },
        text:         { stringValue: cleanText },
        capturedAt:   { timestampValue: new Date().toISOString() },
        status:       { stringValue: 'pending_analysis' },
        sizeKB:       { integerValue: String(sizeKB) },
      })

      showStatus(`✓ Captura guardada (${sizeKB} KB)`, 'success')

      const docs = await firestoreList('page_captures')
      renderHistory(docs)
      renderVideoHistory(docs)

    } catch (err) {
      console.error('[moonsto]', err)
      showStatus(`Error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  })

  const videoButton = document.getElementById('btnCaptureVideos')
  videoButton.addEventListener('click', async () => {
    videoButton.disabled = true
    videoButton.textContent = 'Buscando videos...'
    showStatus('Revisando elementos y recursos multimedia de la página...', 'info')

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectPageVideoInfo,
      })
      const candidates = normalizeVideoCandidates(result?.candidates || [], result?.pageUrl || url)
      const fields = toFirestoreVideoFields({
        pageUrl: result?.pageUrl || url,
        pageTitle: result?.pageTitle || title,
        candidates,
      })
      await firestoreAdd('page_captures', fields)

      if (candidates.length) {
        showStatus(`Guardé ${candidates.length} fuente(s) posible(s) como captura de video. No se descargaron los archivos.`, 'success')
      } else {
        showStatus('No encontré una URL directa de video; guardé el intento para revisarlo después.', 'info')
      }

      const docs = await firestoreList('page_captures')
      renderHistory(docs)
      renderVideoHistory(docs)
    } catch (err) {
      console.error('[moonsto] video scan', err)
      showStatus(`Error al buscar videos: ${err.message}`, 'error')
    } finally {
      videoButton.disabled = false
      videoButton.textContent = 'Buscar videos de esta página'
    }
  })

  document.getElementById('btnArmVideoMonitor').addEventListener('click', async () => {
    const monitorButton = document.getElementById('btnArmVideoMonitor')
    monitorButton.disabled = true
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: collectPageVideoInfo,
      })
      const origins = requestOriginsForPage(result, url)
      const granted = await chrome.permissions.request({ origins })
      if (!granted) {
        showStatus('No se concedieron los permisos del sitio/CDN; no se inició el monitor.', 'error')
        return
      }
      await chrome.storage.local.set({
        moonstoVideoMonitorTabId: tab.id,
        moonstoVideoNetworkRequests: [],
      })
      renderNetworkRequests([])
      showStatus('Monitor listo. Regresa a la página, reproduce o recarga el video y luego abre la extensión para revisar las solicitudes.', 'success')
    } catch (error) {
      showStatus(`No se pudo preparar el monitor: ${error.message}`, 'error')
    } finally {
      monitorButton.disabled = false
    }
  })

  document.getElementById('btnSaveNetworkCandidates').addEventListener('click', async () => {
    const saveButton = document.getElementById('btnSaveNetworkCandidates')
    saveButton.disabled = true
    try {
      const requests = await getCurrentTabVideoRequests(tab.id)
      const rawCandidates = requests.filter(request => isVideoRequest(request)).map(request => ({
        url: request.url,
        source: `network:${request.type || 'resource'}`,
        mimeType: request.contentType || '',
      }))
      const candidates = normalizeVideoCandidates(rawCandidates, url)
      const fields = toFirestoreVideoFields({
        pageUrl: url,
        pageTitle: title,
        candidates,
      })
      await firestoreAdd('page_captures', fields)
      showStatus(`Guardé ${candidates.length} rutas de video en Firebase sin parámetros de URL; las URLs completas siguen solo en este navegador.`, 'success')
      const docs = await firestoreList('page_captures')
      renderHistory(docs)
      renderVideoHistory(docs)
    } catch (error) {
      showStatus(`No se pudieron guardar las rutas: ${error.message}`, 'error')
    } finally {
      saveButton.disabled = false
    }
  })

})
