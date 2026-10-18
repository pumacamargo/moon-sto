import { redactRequestUrl } from './video-network.js'

const MAX_CANDIDATES = 40
const MAX_TEXT_LENGTH = 500
const MAX_URL_LENGTH = 5_000
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'blob:'])

function cleanText(value, maxLength = MAX_TEXT_LENGTH) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalizeUrl(value, baseUrl) {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_URL_LENGTH) return ''
  try {
    const url = new URL(value.trim(), baseUrl)
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

export function normalizeVideoCandidates(rawCandidates = [], pageUrl = '') {
  const seen = new Set()
  const normalized = []

  for (const candidate of rawCandidates) {
    if (!candidate || typeof candidate !== 'object') continue
    const url = normalizeUrl(candidate.url, pageUrl)
    if (!url || seen.has(url)) continue
    seen.add(url)

    const poster = normalizeUrl(candidate.poster, pageUrl)
    const duration = Number(candidate.durationSeconds)
    const width = Number(candidate.width)
    const height = Number(candidate.height)

    normalized.push({
      url,
      source: cleanText(candidate.source, 80) || 'unknown',
      title: cleanText(candidate.title),
      poster: poster || '',
      mimeType: cleanText(candidate.mimeType, 120),
      width: Number.isFinite(width) && width > 0 ? Math.round(width) : 0,
      height: Number.isFinite(height) && height > 0 ? Math.round(height) : 0,
      durationSeconds: Number.isFinite(duration) && duration >= 0 ? duration : 0,
    })

    if (normalized.length >= MAX_CANDIDATES) break
  }

  return normalized
}

function stringField(value) {
  return { stringValue: cleanText(value, MAX_URL_LENGTH) }
}

export function toFirestoreVideoFields({
  pageUrl = '',
  pageTitle = '',
  candidates = [],
  capturedAt = new Date().toISOString(),
} = {}) {
  const videos = candidates.slice(0, MAX_CANDIDATES)
  return {
    captureType: { stringValue: 'video' },
    broker: { stringValue: 'video_capture' },
    pageUrl: stringField(redactRequestUrl(pageUrl)),
    pageTitle: stringField(pageTitle),
    capturedAt: { timestampValue: capturedAt },
    status: { stringValue: videos.length ? 'videos_found' : 'no_videos_found' },
    videoCount: { integerValue: String(videos.length) },
    videos: {
      arrayValue: {
        values: videos.map(video => ({
          mapValue: {
            fields: {
              url: stringField(redactRequestUrl(video.url)),
              source: stringField(video.source),
              title: stringField(video.title),
              poster: stringField(redactRequestUrl(video.poster)),
              mimeType: stringField(video.mimeType),
              width: { integerValue: String(video.width || 0) },
              height: { integerValue: String(video.height || 0) },
              durationSeconds: { doubleValue: Number(video.durationSeconds || 0) },
            },
          },
        })),
      },
    },
  }
}
