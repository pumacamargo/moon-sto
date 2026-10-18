import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeVideoCandidates, toFirestoreVideoFields } from './video-capture.js'

test('normalizes video URLs and removes duplicates and unsafe protocols', () => {
  const videos = normalizeVideoCandidates([
    { url: '/media/clip.m3u8', source: 'video-element', title: 'Mi video' },
    { url: 'https://cdn.example/clip.mp4', source: 'network' },
    { url: 'https://cdn.example/clip.mp4', source: 'network' },
    { url: 'javascript:alert(1)', source: 'link' },
  ], 'https://broker.example/account')

  assert.deepEqual(videos.map(video => video.url), [
    'https://broker.example/media/clip.m3u8',
    'https://cdn.example/clip.mp4',
  ])
  assert.equal(videos[0].title, 'Mi video')
})

test('stores video captures with an explicit cleanup category and structured candidates', () => {
  const fields = toFirestoreVideoFields({
    pageUrl: 'https://broker.example/videos',
    pageTitle: 'Videos',
    candidates: [{ url: 'https://cdn.example/clip.mp4', source: 'video-element' }],
    capturedAt: '2026-10-16T12:00:00.000Z',
  })

  assert.equal(fields.captureType.stringValue, 'video')
  assert.equal(fields.status.stringValue, 'videos_found')
  assert.equal(fields.videoCount.integerValue, '1')
  assert.equal(fields.videos.arrayValue.values[0].mapValue.fields.url.stringValue,
    'https://cdn.example/clip.mp4')
})

test('records an empty scan as no_videos_found without losing the category', () => {
  const fields = toFirestoreVideoFields({ pageUrl: 'https://broker.example', candidates: [] })
  assert.equal(fields.captureType.stringValue, 'video')
  assert.equal(fields.status.stringValue, 'no_videos_found')
  assert.equal(fields.videoCount.integerValue, '0')
})
