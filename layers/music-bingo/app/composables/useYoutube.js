const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// Set from runtime config by plugins/music-bingo.client.js (NUXT_PUBLIC_YOUTUBE_API_KEY).
let API_KEY = ""

export function configureYoutube({ apiKey = "" } = {}) {
  API_KEY = apiKey
}

export function hasYoutubeApiKey() {
  return Boolean(API_KEY)
}

/** Accepts a full playlist URL, a `list=` query value, or a bare playlist ID. */
export function parseYoutubePlaylistId(input) {
  const value = String(input || '').trim()
  if (!value) return null
  if (/^[A-Za-z0-9_-]{10,}$/.test(value) && !value.includes('/')) return value
  try {
    const url = new URL(value)
    const listParam = url.searchParams.get('list')
    if (listParam) return listParam
  } catch {
    // not a URL — fall through
  }
  const match = value.match(/[?&]list=([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

async function youtubeGet(path, params) {
  if (!API_KEY) throw new Error('NUXT_PUBLIC_YOUTUBE_API_KEY is not set in .env')
  const query = new URLSearchParams({ ...params, key: API_KEY })
  const res = await fetch(`${YOUTUBE_API_BASE}${path}?${query}`)
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    const message = detail?.error?.message || `${res.status}`
    throw new Error(`YouTube API error: ${message}`)
  }
  return res.json()
}

export async function fetchYoutubePlaylistMeta(playlistId) {
  const data = await youtubeGet('/playlists', {
    part: 'snippet',
    id: playlistId,
    maxResults: '1',
  })
  const item = data?.items?.[0]
  if (!item) throw new Error('Playlist not found or not public.')
  const thumbs = item.snippet?.thumbnails || {}
  const thumbnail =
    thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || ''
  return { title: item.snippet?.title || '', thumbnail }
}

/** Strips common noise from YouTube video titles (official video/audio tags, etc). */
function cleanVideoTitle(title) {
  return String(title || '')
    .replace(/[([][^()[\]]*(official|video|audio|lyric|lyrics|hd|4k|visualizer)[^()[\]]*[)\]]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Matches "Artist - Song", "Artist – Song", "Artist — Song", "Artist ; Song"
const ARTIST_SEPARATOR = /\s*[-–—;]\s*/

/** Splits a cleaned video title into { name, artist } by the first artist/song separator. */
function splitTitleAndArtist(title, fallbackArtist) {
  const parts = title.split(ARTIST_SEPARATOR)
  if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
    return { name: parts.slice(1).join(' ').trim(), artist: parts[0].trim() }
  }
  return { name: title, artist: fallbackArtist }
}

/** Paginates through all items in a YouTube playlist, returning { name, artist } rows. */
export async function fetchYoutubePlaylistTracks(playlistId) {
  const tracks = []
  let pageToken = ''
  do {
    const data = await youtubeGet('/playlistItems', {
      part: 'snippet',
      playlistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    })
    for (const item of data?.items || []) {
      const snippet = item.snippet
      if (!snippet || snippet.title === 'Deleted video' || snippet.title === 'Private video') continue
      const cleaned = cleanVideoTitle(snippet.title)
      const channelTitle = snippet.videoOwnerChannelTitle || snippet.channelTitle || ''
      tracks.push(splitTitleAndArtist(cleaned, channelTitle))
    }
    pageToken = data?.nextPageToken || ''
  } while (pageToken)
  return tracks
}
