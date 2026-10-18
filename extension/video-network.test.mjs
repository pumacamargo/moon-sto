import test from 'node:test'
import assert from 'node:assert/strict'
import { isVideoRequest, isDirectDownloadRequest, redactRequestUrl } from './video-network.js'

test('recognizes media requests by resource type, MIME type, and stream URL', () => {
  assert.equal(isVideoRequest({ url: 'https://cdn.example/asset', type: 'media' }), true)
  assert.equal(isVideoRequest({ url: 'https://cdn.example/asset', contentType: 'video/mp4; codecs=avc1' }), true)
  assert.equal(isVideoRequest({ url: 'https://cdn.example/course/master.m3u8?sig=x', type: 'xmlhttprequest' }), true)
  assert.equal(isVideoRequest({ url: 'https://api.example/user/profile', type: 'xmlhttprequest', contentType: 'application/json' }), false)
})

test('offers downloads only for direct video files, not blobs or stream manifests', () => {
  assert.equal(isDirectDownloadRequest({ url: 'https://cdn.example/movie.mp4?token=secret' }), true)
  assert.equal(isDirectDownloadRequest({ url: 'https://cdn.example/master.m3u8', contentType: 'application/vnd.apple.mpegurl' }), false)
  assert.equal(isDirectDownloadRequest({ url: 'blob:https://site.example/id', contentType: 'video/mp4' }), false)
})

test('redacts query strings and fragments before sending paths to Firebase', () => {
  assert.equal(redactRequestUrl('https://cdn.example/v/clip.mp4?token=secret#part'), 'https://cdn.example/v/clip.mp4')
})
