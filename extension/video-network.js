const VIDEO_URL_PATTERN = /\.(?:mp4|m4v|mov|webm|m3u8|mpd|m4s|ts)(?:$|[?#])/i
const VIDEO_ROUTE_PATTERN = /\/(?:videoplayback|manifest|segment|chunk)(?:[/?._-]|$)/i
const STREAM_MIME_TYPES = [
  'application/vnd.apple.mpegurl',
  'application/x-mpegurl',
  'application/dash+xml',
  'video/mp2t',
  'video/iso.segment',
]

export function isVideoRequest({ url = '', type = '', contentType = '' } = {}) {
  const mime = contentType.toLowerCase().split(';', 1)[0].trim()
  return type === 'media' || mime.startsWith('video/') || mime.startsWith('audio/') ||
    STREAM_MIME_TYPES.includes(mime) || VIDEO_URL_PATTERN.test(url) || VIDEO_ROUTE_PATTERN.test(url)
}

export function isDirectDownloadRequest({ url = '', contentType = '' } = {}) {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return false
  const mime = contentType.toLowerCase().split(';', 1)[0].trim()
  if (STREAM_MIME_TYPES.includes(mime) || /\.(?:m3u8|mpd|m4s|ts)(?:$|[?#])/i.test(url)) return false
  return mime.startsWith('video/') || /\.(?:mp4|m4v|mov|webm)(?:$|[?#])/i.test(url)
}

export function redactRequestUrl(value = '') {
  try {
    const url = new URL(value)
    url.search = ''
    url.hash = ''
    return url.href
  } catch {
    return String(value).split(/[?#]/, 1)[0]
  }
}

export function safeRequestLabel(value = '') {
  try {
    const url = new URL(value)
    if (url.protocol === 'blob:') return 'blob: temporal (no descargable directamente)'
    return `${url.host}${url.pathname}${url.search ? ' [parámetros ocultos]' : ''}`
  } catch {
    return String(value).slice(0, 120)
  }
}
