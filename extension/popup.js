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
  const res = await fetch(`${FS_BASE}/${collection}?key=${FIREBASE_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${res.status}`)
  }
  return res.json()
}

async function firestoreList(collection, pageSize = 5) {
  const url = `${FS_BASE}/${collection}?key=${FIREBASE_KEY}&pageSize=${pageSize}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.documents || []
}

// ─── UI ─────────────────────────────────────────────────────

function renderHistory(docs) {
  if (!docs.length) return
  document.getElementById('historySection').style.display = 'block'
  const container = document.getElementById('historyItems')
  container.innerHTML = ''
  docs.slice(0, 4).forEach(doc => {
    const f = doc.fields || {}
    const broker = f.broker?.stringValue || '—'
    const ts     = f.capturedAt?.timestampValue
    const date   = ts ? new Date(ts).toLocaleString('es-MX', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—'
    const el = document.createElement('div')
    el.className = 'capture-item'
    el.innerHTML = `<span class="capture-broker">${broker}</span><span class="capture-meta">${date}</span>`
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

  // cargar historial
  firestoreList('page_captures').then(renderHistory).catch(() => {})

  // botón capturar
  document.getElementById('btnCapture').addEventListener('click', async () => {
    setLoading(true)
    showStatus('Inyectando script en la página...', 'info')

    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          html:  document.documentElement.outerHTML,
          title: document.title,
          url:   window.location.href,
        }),
      })

      const b = detectBroker(result.url)
      const MAX_CHARS = 800_000 // Firestore string limit ~1MB; cap at ~800KB
      const truncated = result.html.length > MAX_CHARS
      const html = truncated ? result.html.slice(0, MAX_CHARS) : result.html
      const sizeKB = Math.round(result.html.length / 1024)

      showStatus(`Guardando ${sizeKB} KB en Firestore...`, 'info')

      await firestoreAdd('page_captures', {
        broker:       { stringValue: b?.name   || 'Unknown' },
        brokerDomain: { stringValue: b?.domain || new URL(result.url).hostname },
        pageUrl:      { stringValue: result.url },
        pageTitle:    { stringValue: result.title },
        html:         { stringValue: html },
        capturedAt:   { timestampValue: new Date().toISOString() },
        status:       { stringValue: 'pending_analysis' },
        sizeKB:       { integerValue: sizeKB },
        truncated:    { booleanValue: truncated },
      })

      showStatus(`✓ Captura guardada (${sizeKB} KB)`, 'success')

      const docs = await firestoreList('page_captures')
      renderHistory(docs)

    } catch (err) {
      console.error('[moonsto]', err)
      showStatus(`Error: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  })
})
