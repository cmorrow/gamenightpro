const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE  = 'https://api.spotify.com/v1'
const STORAGE_KEY_VERIFIER = 'spotify_pkce_verifier'
const STORAGE_KEY_VERIFIER_PREFIX = 'spotify_pkce_verifier_'
const STORAGE_KEY_TOKEN    = 'spotify_access_token'
const STORAGE_KEY_EXPIRY   = 'spotify_token_expiry'
const STORAGE_KEY_SCOPE    = 'spotify_token_scope'
const STORAGE_KEY_DEVICE_ID = 'spotify_preferred_device_id'
const AUTH_POPUP_MESSAGE_TYPE = 'spotify-auth-success'
export const SPOTIFY_REAUTH_REQUIRED_EVENT = 'spotify-reauth-required'
let reauthPopupPromise = null

/**
 * After this many Spotify API responses that are still HTTP 429 after internal backoff retries,
 * prompt reauthorization (same modal flow as expired token).
 */
const SPOTIFY_CONSECUTIVE_429_REAUTH_THRESHOLD = 3

let consecutiveSpotify429Failures = 0

// Set from runtime config by plugins/music-bingo.client.js (NUXT_PUBLIC_SPOTIFY_CLIENT_ID).
let CLIENT_ID = ""
/** Must match the redirect URI registered in Spotify and used in the token request. */
let REDIRECT_URI = ""

export function configureSpotify({ clientId = "", redirectUri = "" } = {}) {
  CLIENT_ID = clientId
  REDIRECT_URI = redirectUri
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function randomBytes(len) {
  return crypto.getRandomValues(new Uint8Array(len))
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(plain) {
  const encoded = new TextEncoder().encode(plain)
  return crypto.subtle.digest('SHA-256', encoded)
}

async function generatePKCE() {
  const verifier  = base64url(randomBytes(48))
  const challenge = base64url(new Uint8Array(await sha256(verifier)))
  return { verifier, challenge }
}

function authScopes() {
  return 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private user-read-playback-state user-modify-playback-state'
}

function randomState() {
  return base64url(randomBytes(18))
}

/** Appends the current origin so server/spotify-redirect.mjs can forward to the right Vite port. */
function encodeStateWithAppOrigin(nonce) {
  const encodedOrigin = base64url(new TextEncoder().encode(window.location.origin))
  return `${nonce}.${encodedOrigin}`
}

// ── Redirect URI ──────────────────────────────────────────────────────────────
// NUXT_PUBLIC_SPOTIFY_REDIRECT_URI, or same-origin /music-bingo/spotify-callback.
// Register that URL (per origin you use) in the Spotify Developer Dashboard.

function redirectUri() {
  if (REDIRECT_URI) return REDIRECT_URI
  return `${window.location.origin}/music-bingo/spotify-callback`
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

async function buildSpotifyAuthRequest(options = {}) {
  const { forceConsent = false } = options || {}
  const { verifier, challenge } = await generatePKCE()
  const state = encodeStateWithAppOrigin(randomState())
  localStorage.setItem(STORAGE_KEY_VERIFIER_PREFIX + state, verifier)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: authScopes(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
  })
  if (forceConsent) params.set('show_dialog', 'true')

  return { verifier, state, authUrl: `${SPOTIFY_AUTH_URL}?${params}` }
}

/** Opens Spotify login in the current window (default), optional popup override. */
export async function startSpotifyAuth(options = {}) {
  const { usePopup = false, forceConsent = false } = options || {}
  if (usePopup) return startSpotifyAuthPopup({ forceConsent })
  return startSpotifyAuthRedirect({ forceConsent })
}

export async function startSpotifyAuthRedirect(options = {}) {
  if (!CLIENT_ID) throw new Error('NUXT_PUBLIC_SPOTIFY_CLIENT_ID is not set in .env')
  const { verifier, authUrl } = await buildSpotifyAuthRequest(options)
  sessionStorage.setItem(STORAGE_KEY_VERIFIER, verifier)
  window.location.assign(authUrl)
}

export async function startSpotifyAuthPopup(options = {}) {
  if (reauthPopupPromise) return reauthPopupPromise
  if (!CLIENT_ID) throw new Error('NUXT_PUBLIC_SPOTIFY_CLIENT_ID is not set in .env')

  reauthPopupPromise = new Promise(async (resolve, reject) => {
    try {
      const { state, authUrl } = await buildSpotifyAuthRequest(options)

      const popup = window.open(
        authUrl,
        'spotify-auth',
        'width=520,height=760,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes'
      )

      if (!popup) {
        localStorage.removeItem(STORAGE_KEY_VERIFIER_PREFIX + state)
        reject(new Error('Popup was blocked. Please allow popups for this site.'))
        return
      }

      const cleanup = () => {
        window.removeEventListener('message', onMessage)
        window.clearInterval(closePoll)
        reauthPopupPromise = null
      }

      const onMessage = (event) => {
        if (event.origin !== window.location.origin) return
        if (event.data?.type !== AUTH_POPUP_MESSAGE_TYPE) return
        cleanup()
        resolve(getStoredToken())
      }

      window.addEventListener('message', onMessage)
      const closePoll = window.setInterval(() => {
        if (popup.closed) {
          cleanup()
          if (getStoredToken()) {
            resolve(getStoredToken())
          } else {
            reject(new Error('Spotify reauthorization was cancelled.'))
          }
        }
      }, 400)
    } catch (error) {
      reauthPopupPromise = null
      reject(error)
    }
  })

  return reauthPopupPromise
}

export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search)
  const code   = params.get('code')
  const error  = params.get('error')
  const state  = params.get('state')
  if (error) throw new Error(`Spotify auth denied: ${error}`)
  if (!code)  return false

  const keyedVerifier = state ? localStorage.getItem(STORAGE_KEY_VERIFIER_PREFIX + state) : null
  const verifier = keyedVerifier || sessionStorage.getItem(STORAGE_KEY_VERIFIER)
  if (!verifier) throw new Error('Missing PKCE verifier — please try connecting again.')
  if (!CLIENT_ID) throw new Error('NUXT_PUBLIC_SPOTIFY_CLIENT_ID is not set in .env')

  const body = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    redirect_uri:  redirectUri(),
    client_id:     CLIENT_ID,
    code_verifier: verifier,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)

  const data = await res.json()
  sessionStorage.removeItem(STORAGE_KEY_VERIFIER)
  if (state) localStorage.removeItem(STORAGE_KEY_VERIFIER_PREFIX + state)
  localStorage.setItem(STORAGE_KEY_TOKEN,  data.access_token)
  localStorage.setItem(STORAGE_KEY_EXPIRY, Date.now() + data.expires_in * 1000)
  if (typeof data.scope === 'string' && data.scope.trim()) {
    localStorage.setItem(STORAGE_KEY_SCOPE, data.scope.trim())
  }

  window.history.replaceState({}, '', window.location.pathname)
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: AUTH_POPUP_MESSAGE_TYPE }, window.location.origin)
    window.close()
  }
  return true
}

export function getStoredToken() {
  const token  = localStorage.getItem(STORAGE_KEY_TOKEN)
  const expiry = Number(localStorage.getItem(STORAGE_KEY_EXPIRY) || 0)
  if (token && Date.now() < expiry) return token
  return null
}

export function clearSpotifyAuth() {
  localStorage.removeItem(STORAGE_KEY_TOKEN)
  localStorage.removeItem(STORAGE_KEY_EXPIRY)
  localStorage.removeItem(STORAGE_KEY_SCOPE)
  sessionStorage.removeItem(STORAGE_KEY_VERIFIER)
}

export function spotifyGrantedScopes() {
  return (localStorage.getItem(STORAGE_KEY_SCOPE) || '')
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function hasPlaylistModifyScope() {
  const scopes = spotifyGrantedScopes()
  if (!scopes.length) return false
  return (
    scopes.includes('playlist-modify-public') ||
    scopes.includes('playlist-modify-private')
  )
}

export function isSpotifyInsufficientScopeError(error) {
  const msg = String(error?.message || error || '').toLowerCase()
  return msg.includes('insufficient client scope') || msg.includes('insufficient scope')
}

export function hasClientId() {
  return Boolean(CLIENT_ID)
}

export function getPreferredSpotifyDeviceId() {
  return localStorage.getItem(STORAGE_KEY_DEVICE_ID) || ''
}

export function setPreferredSpotifyDeviceId(deviceId) {
  const value = String(deviceId || '').trim()
  if (!value) {
    localStorage.removeItem(STORAGE_KEY_DEVICE_ID)
    return
  }
  localStorage.setItem(STORAGE_KEY_DEVICE_ID, value)
}

// ── Playlist parsing & fetching ───────────────────────────────────────────────

export function parsePlaylistId(url) {
  if (/^[A-Za-z0-9]+$/.test(url)) return url
  const webMatch = url.match(/playlist\/([A-Za-z0-9]+)/)
  if (webMatch) return webMatch[1]
  const uriMatch = url.match(/spotify:playlist:([A-Za-z0-9]+)/)
  if (uriMatch) return uriMatch[1]
  return null
}

/** Spotify playlist IDs from the Web API are 22-character base62 strings (config slugs like `80s-hits` are not). */
export function isLikelySpotifyPlaylistId(id) {
  return /^[A-Za-z0-9]{22}$/.test(String(id || '').trim())
}

/**
 * ID to pass to `GET /v1/playlists/{id}` — prefers the ID parsed from `playlistUrl`, then a bare Spotify id field.
 * Returns null for bundle-only rows (e.g. config id with no Spotify URL).
 */
export function spotifyApiPlaylistId(playlist) {
  if (!playlist || typeof playlist !== 'object') return null
  const fromUrl = parsePlaylistId(String(playlist.playlistUrl || '').trim())
  if (fromUrl) return fromUrl
  const bare = String(playlist.id || '').trim()
  return isLikelySpotifyPlaylistId(bare) ? bare : null
}

async function readSpotifyError(res) {
  const base = res.status
  try {
    const j = await res.json()
    const m = j?.error?.message
    if (m) return `${base}: ${m}`
  } catch {
    // ignore
  }
  return String(base)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Seconds to wait after 429; caps Spotify Retry-After to avoid excessive waits. */
function retryAfterSeconds(res, attemptIndex) {
  const raw = res.headers.get('Retry-After')
  if (raw) {
    const n = parseInt(raw, 10)
    if (Number.isFinite(n)) return Math.min(Math.max(n, 1), 120)
  }
  return Math.min(2 ** attemptIndex, 30)
}

/**
 * True when a 429 is the app's quota being exhausted (body `reason: "QUOTA_EXCEEDED"`).
 * Spotify then asks for a retry hours later, and browsers can't read `Retry-After`
 * (it isn't CORS-exposed), so short backoff retries only delay the error.
 */
async function isQuotaExceeded(res) {
  if (res.status !== 429) return false
  try {
    const body = await res.clone().json()
    return body?.error?.reason === 'QUOTA_EXCEEDED'
  } catch {
    return false
  }
}

async function authorizedFetch(path, token, init = {}, allowReauth = true, attempt = 0) {
  /* Prefer storage so popup reauth updates API calls without syncing every composable ref. */
  const MAX_429_ATTEMPTS = 5
  const currentToken = getStoredToken() || token
  const first = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${currentToken}`,
    },
  })
  if (first.status === 429 && attempt < MAX_429_ATTEMPTS && !(await isQuotaExceeded(first))) {
    await sleep(retryAfterSeconds(first, attempt) * 1000)
    return authorizedFetch(path, token, init, allowReauth, attempt + 1)
  }
  if (first.status !== 429) {
    consecutiveSpotify429Failures = 0
  } else if (attempt >= MAX_429_ATTEMPTS) {
    consecutiveSpotify429Failures += 1
    if (
      consecutiveSpotify429Failures >= SPOTIFY_CONSECUTIVE_429_REAUTH_THRESHOLD &&
      allowReauth &&
      !window.opener
    ) {
      window.dispatchEvent(new CustomEvent(SPOTIFY_REAUTH_REQUIRED_EVENT))
      consecutiveSpotify429Failures = 0
    }
  }
  if (first.status === 401 && allowReauth && !window.opener) {
    window.dispatchEvent(new CustomEvent(SPOTIFY_REAUTH_REQUIRED_EVENT))
  }
  return first
}

async function spotifyGet(path, token) {
  const res = await authorizedFetch(path, token)
  if (res.status === 401) {
    const detail = await readSpotifyError(res)
    throw new Error(
      'Spotify token expired or invalid — please complete Spotify reauthorization. (' +
        detail +
        ')'
    )
  }
  if (await isQuotaExceeded(res)) {
    throw new Error(
      'Spotify API quota exceeded for this app (HTTP 429 QUOTA_EXCEEDED). Spotify blocks further requests for several hours — try again later.'
    )
  }
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    let msg = 'Spotify API error: ' + detail
    if (res.status === 403) {
      msg +=
        ' This is usually caused by one of: the playlist not being yours or shared with you, missing Spotify permission scopes (reconnect Spotify), or — if this keeps happening on playlists you do own — the Spotify app behind this integration being in Development Mode with your account not added to its allowed users list in the Spotify Developer Dashboard.'
    }
    throw new Error(msg)
  }
  return res.json()
}

function firstPlaylistItemsPage(playlistId) {
  // Keep this unfiltered: Spotify has changed playlist item payload shapes (`track` -> `item`)
  // and strict fields filters can hide names/artists unexpectedly.
  return `/playlists/${playlistId}/items?limit=100&additional_types=track`
}

/**
 * One pagination pass over playlist items — used for both track rows and playback URIs.
 */
export async function fetchPlaylistTracksAndUris(playlistId, token) {
  const tracks = []
  const uris = []
  let url = firstPlaylistItemsPage(playlistId)

  while (url) {
    const data = await spotifyGet(url, token)
    if (!Array.isArray(data?.items)) {
      const [currentUserId, ownerId] = await Promise.all([
        fetchCurrentUserId(token).catch(() => null),
        fetchPlaylistOwner(playlistId, token).catch(() => null),
      ])
      if (currentUserId && ownerId && currentUserId !== ownerId) {
        throw new Error(
          `This Spotify playlist is owned by "${ownerId}", not your connected account ("${currentUserId}"). Reconnect Spotify with the account that owns it, or ask the owner to share it.`
        )
      }
      throw new Error(
        'Spotify returned playlist metadata but not item details, even though the playlist is owned by your connected account. This looks like a transient Spotify API issue — try again in a moment.'
      )
    }

    for (const item of data.items) {
      const media = item?.item ?? item?.track
      if (!media || !media.name) continue
      if (media.type && media.type !== 'track') continue
      const artists = (media.artists || [])
        .map((a) => (a?.name ? String(a.name).trim() : ''))
        .filter(Boolean)
      const artist = artists[0] || ''
      const uri = typeof media.uri === 'string' ? media.uri : ''
      tracks.push({
        text: media.name,
        sub: artist,
        artists,
        duration_ms: Number(media.duration_ms) || 0,
        uri,
      })
      if (uri.startsWith('spotify:track:')) uris.push(uri)
    }
    url = data.next ? data.next.replace(SPOTIFY_API_BASE, '') : null
  }

  return { tracks, uris }
}

export async function fetchPlaylistTracks(playlistId, token) {
  const { tracks } = await fetchPlaylistTracksAndUris(playlistId, token)
  return tracks
}

export async function fetchPlaylistName(playlistId, token) {
  const data = await spotifyGet(`/playlists/${playlistId}?fields=name`, token)
  return data.name || ''
}

/**
 * Trimmed https URL for display, or '' if missing / invalid (use a gradient fallback).
 */
export function effectivePlaylistCoverUrl(storedUrl) {
  if (typeof storedUrl !== 'string') return ''
  const u = storedUrl.trim()
  if (!u) return ''
  if (/^data:image\//i.test(u)) return u
  // Same-origin bundled asset (e.g. Vite `/src/assets/...` in dev, `/assets/...` in prod)
  if (u.startsWith('/') && !u.startsWith('//')) return u
  try {
    const parsed = new URL(u)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
  } catch {
    return ''
  }
  return u
}

/**
 * Largest playlist cover URL when Spotify provides artwork (`images` non-empty).
 * Empty `images` means no cover (e.g. local-only tracks) — use a UI fallback instead.
 */
export function playlistSpecifiedCoverImageUrl(meta) {
  const images = Array.isArray(meta?.images) ? meta.images : []
  const withUrl = images.filter((i) => i && typeof i.url === 'string' && i.url.trim())
  if (!withUrl.length) return ''
  const sorted = [...withUrl].sort((a, b) => {
    const area = (img) => (Number(img.width) || 0) * (Number(img.height) || 0)
    return area(b) - area(a)
  })
  return effectivePlaylistCoverUrl(sorted[0].url)
}

export async function fetchUserPlaylists(token, limit = 50, offset = 0) {
  const data = await spotifyGet(
    `/me/playlists?limit=${limit}&offset=${offset}`,
    token,
  )
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total) || 0,
    next: data?.next ? data.next.replace(SPOTIFY_API_BASE, '') : null,
  }
}

export async function fetchPlaylistMeta(playlistId, token) {
  return spotifyGet(`/playlists/${playlistId}?fields=id,name,uri,items(total),tracks(total),images`, token)
}

export async function fetchCurrentPlayback(token) {
  const res = await authorizedFetch('/me/player', token)
  if (res.status === 204) return null
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    throw new Error('Unable to read Spotify playback state: ' + detail)
  }
  return res.json()
}

export async function fetchAvailableDevices(token) {
  const res = await authorizedFetch('/me/player/devices', token)
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    throw new Error('Unable to fetch Spotify devices: ' + detail)
  }
  const data = await res.json()
  return Array.isArray(data?.devices) ? data.devices : []
}

export async function playPlaylistContext(token, playlistUri, deviceId = '') {
  async function requestPlayBody(body, targetDeviceId = '') {
    const query = targetDeviceId ? `?device_id=${encodeURIComponent(targetDeviceId)}` : ''
    return authorizedFetch(`/me/player/play${query}`, token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  let res = await requestPlayBody({ context_uri: playlistUri }, deviceId)
  if (res.ok) return

  const firstDetail = await readSpotifyError(res)
  const isNoActiveDevice =
    res.status === 404 &&
    firstDetail.toUpperCase().includes('NO_ACTIVE_DEVICE')

  if (isNoActiveDevice) {
    const devicesRes = await authorizedFetch('/me/player/devices', token)
    if (devicesRes.ok) {
      const devicesData = await devicesRes.json()
      const devices = Array.isArray(devicesData?.devices) ? devicesData.devices : []
      const preferredId = getPreferredSpotifyDeviceId()
      const preferredDevice = preferredId ? devices.find((d) => d?.id === preferredId && !d.is_restricted) : null
      const fallbackDevice =
        preferredDevice ||
        devices.find((d) => d?.id && d.is_active && !d.is_restricted) ||
        devices.find((d) => d?.id && !d.is_restricted)
      if (fallbackDevice?.id) {
        res = await requestPlayBody({ context_uri: playlistUri }, fallbackDevice.id)
        if (res.ok) return
      }
    }

    throw new Error(
      'No active Spotify device found. Open Spotify on your phone/computer/web player, start playback there, then try Play again.'
    )
  }

  throw new Error('Unable to start playlist playback: ' + firstDetail)
}

export async function playTrackUris(token, uris, deviceId = '') {
  const playableUris = Array.isArray(uris) ? uris.filter(Boolean) : []
  if (!playableUris.length) {
    throw new Error('No playable tracks found for this playlist.')
  }

  async function requestPlayBody(body, targetDeviceId = '') {
    const query = targetDeviceId ? `?device_id=${encodeURIComponent(targetDeviceId)}` : ''
    return authorizedFetch(`/me/player/play${query}`, token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  let res = await requestPlayBody({ uris: playableUris }, deviceId)
  if (res.ok) return

  const firstDetail = await readSpotifyError(res)
  const isNoActiveDevice =
    res.status === 404 &&
    firstDetail.toUpperCase().includes('NO_ACTIVE_DEVICE')

  if (isNoActiveDevice) {
    const devicesRes = await authorizedFetch('/me/player/devices', token)
    if (devicesRes.ok) {
      const devicesData = await devicesRes.json()
      const devices = Array.isArray(devicesData?.devices) ? devicesData.devices : []
      const preferredId = getPreferredSpotifyDeviceId()
      const preferredDevice = preferredId ? devices.find((d) => d?.id === preferredId && !d.is_restricted) : null
      const fallbackDevice =
        preferredDevice ||
        devices.find((d) => d?.id && d.is_active && !d.is_restricted) ||
        devices.find((d) => d?.id && !d.is_restricted)
      if (fallbackDevice?.id) {
        res = await requestPlayBody({ uris: playableUris }, fallbackDevice.id)
        if (res.ok) return
      }
    }
    throw new Error(
      'No active Spotify device found. Open Spotify on your phone/computer/web player, start playback there, then try Play again.'
    )
  }

  throw new Error('Unable to start playlist playback: ' + firstDetail)
}

export async function fetchPlaylistTrackUris(playlistId, token) {
  const { uris } = await fetchPlaylistTracksAndUris(playlistId, token)
  return uris
}

/** Remove up to 100 tracks per request; batches automatically. */
export async function removeTracksFromPlaylist(playlistId, trackUris, token) {
  const uris = Array.isArray(trackUris)
    ? trackUris.filter((u) => typeof u === 'string' && u.startsWith('spotify:track:'))
    : []
  if (!uris.length) return

  const BATCH = 100
  for (let i = 0; i < uris.length; i += BATCH) {
    const chunk = uris.slice(i, i + BATCH)
    const itemsBody = { items: chunk.map((uri) => ({ uri })) }
    const tracksBody = { tracks: chunk.map((uri) => ({ uri })) }

    let res = await authorizedFetch(`/playlists/${playlistId}/items`, token, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemsBody),
    })
    if (res.status === 404) {
      res = await authorizedFetch(`/playlists/${playlistId}/tracks`, token, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tracksBody),
      })
    }
    if (!res.ok) {
      const detail = await readSpotifyError(res)
      let msg = 'Unable to remove tracks from playlist: ' + detail
      if (res.status === 403) {
        msg +=
          ' Reconnect Spotify and allow playlist editing (playlist-modify scope).'
      }
      throw new Error(msg)
    }
  }
}

export async function searchTracks(query, token, limit = 5) {
  const params = new URLSearchParams({
    q: String(query || '').trim(),
    type: 'track',
    limit: String(Math.min(Math.max(limit, 1), 10)),
  })
  const data = await spotifyGet(`/search?${params}`, token)
  const items = data?.tracks?.items
  return Array.isArray(items) ? items : []
}

/**
 * Replace the entire playlist with the given URIs (preserves order, no duplicates).
 * Uses PUT for the first 100 tracks, then POST to append the rest.
 */
export async function fetchCurrentUserId(token) {
  const data = await spotifyGet('/me', token)
  return data?.id ?? null
}

export async function fetchPlaylistOwner(playlistId, token) {
  const data = await spotifyGet(`/playlists/${playlistId}?fields=owner`, token)
  return data?.owner?.id ?? null
}

export async function replacePlaylistTracks(playlistId, trackUris, token) {
  const uris = Array.isArray(trackUris)
    ? trackUris.filter((u) => typeof u === 'string' && u.startsWith('spotify:track:'))
    : []

  const first = uris.slice(0, 100)
  let res = await authorizedFetch(`/playlists/${playlistId}/tracks`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uris: first }),
  })
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    console.error('[replacePlaylistTracks] PUT failed', { status: res.status, detail, playlistId })
    let msg = 'Unable to replace playlist tracks: ' + detail
    if (res.status === 403) {
      const isScopeError = detail.toLowerCase().includes('scope')
      msg += isScopeError
        ? ' Reconnect Spotify and allow playlist editing.'
        : ' You do not own this Spotify playlist — only the owner can modify its tracks.'
    }
    throw new Error(msg)
  }

  for (let i = 100; i < uris.length; i += 100) {
    const chunk = uris.slice(i, i + 100)
    res = await authorizedFetch(`/playlists/${playlistId}/tracks`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: chunk }),
    })
    if (!res.ok) {
      const detail = await readSpotifyError(res)
      throw new Error('Unable to append tracks to playlist: ' + detail)
    }
  }
}

/** Add up to 100 track URIs per request; batches automatically. */
export async function addTracksToPlaylist(playlistId, trackUris, token) {
  const uris = Array.isArray(trackUris)
    ? trackUris.filter((u) => typeof u === 'string' && u.startsWith('spotify:track:'))
    : []
  if (!uris.length) return

  const BATCH = 100
  for (let i = 0; i < uris.length; i += BATCH) {
    const chunk = uris.slice(i, i + BATCH)
    let res = await authorizedFetch(`/playlists/${playlistId}/items`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: chunk }),
    })
    if (res.status === 404) {
      res = await authorizedFetch(`/playlists/${playlistId}/tracks`, token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uris: chunk }),
      })
    }
    if (!res.ok) {
      const detail = await readSpotifyError(res)
      let msg = 'Unable to add tracks to playlist: ' + detail
      if (res.status === 403) {
        msg +=
          ' Disconnect and reconnect Spotify so the app can edit playlists.'
      }
      throw new Error(msg)
    }
  }
}

export async function pausePlayback(token, deviceId = '') {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
  const res = await authorizedFetch(`/me/player/pause${query}`, token, {
    method: 'PUT',
  })
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    throw new Error('Unable to pause playback: ' + detail)
  }
}

/** Resume paused playback on the current device (continues same track / position when possible). */
export async function resumePlayback(token, deviceId = '') {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
  const res = await authorizedFetch(`/me/player/play${query}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!res.ok && res.status !== 204) {
    const detail = await readSpotifyError(res)
    throw new Error('Unable to resume playback: ' + detail)
  }
}

async function playerAction(token, actionPath, deviceId = '') {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''
  const res = await authorizedFetch(`/me/player/${actionPath}${query}`, token, {
    method: 'POST',
  })
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    throw new Error(`Unable to ${actionPath} track: ` + detail)
  }
}

export async function nextTrack(token, deviceId = '') {
  return playerAction(token, 'next', deviceId)
}

export async function previousTrack(token, deviceId = '') {
  return playerAction(token, 'previous', deviceId)
}

export async function seekPlayback(token, positionMs, deviceId = '') {
  const safeMs = Math.max(0, Math.floor(Number(positionMs) || 0))
  const query = new URLSearchParams({ position_ms: String(safeMs) })
  if (deviceId) query.set('device_id', deviceId)
  const res = await authorizedFetch(`/me/player/seek?${query.toString()}`, token, {
    method: 'PUT',
  })
  if (!res.ok) {
    const detail = await readSpotifyError(res)
    throw new Error('Unable to seek current track: ' + detail)
  }
}
