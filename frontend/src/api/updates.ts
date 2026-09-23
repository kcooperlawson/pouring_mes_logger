import { api } from './client'

export interface UpdateStatus {
  current_version: string
  latest_version: string | null
  update_available: boolean
  notes: string | null
  published_at: string | null
  error: string | null
  publish_enabled: boolean
}

export interface ApplyUpdateResult {
  ok: boolean
  version: string
  log: string
  restarting: boolean
  restart_mode: 'supervised' | 'relaunch' | 'manual'
}

export interface PublishUpdateResult {
  html_url: string
  tag_name: string
  asset_name: string
  asset_size: number
}

export interface UpdateSource {
  kind: 'server' | 'github'
  address: string
  repo: string
  token_set: boolean
}

export interface AvailableUpdate {
  version: string
  notes: string
  published_at: string
  size: number | null
  current: boolean
  newer: boolean
}

export interface ChangelogOut {
  version: string
  markdown: string
}

export interface UpdateAttempt {
  at: string
  from_version: string
  to_version: string
  ok: boolean
  detail: string
}

export interface RestorePoint {
  name: string
  version: string
  at: string
}

export const updatesApi = {
  /** What this PC has actually been through, newest first - the failures too. */
  history: () => api.get<UpdateAttempt[]>('/updates/history'),
  restorePoints: () => api.get<RestorePoint[]>('/updates/restore-points'),
  /** The release notes for the version this PC is actually running - read
   *  from the CHANGELOG.md that shipped in the package with it. */
  changelog: () => api.get<ChangelogOut>('/updates/changelog'),
  status: () => api.get<UpdateStatus>('/updates/status'),
  // Skips the server's 15-minute cache - the "Check now" button.
  checkNow: () => api.get<UpdateStatus>('/updates/status?force=true'),
  apply: () => api.post<ApplyUpdateResult>('/updates/apply', {}),
  applyVersion: (version: string, allowOlder: boolean) =>
    api.post<ApplyUpdateResult>('/updates/apply', { version, allow_older: allowOlder }),

  source: () => api.get<UpdateSource>('/updates/source'),
  setSource: (address: string, token: string | null) =>
    api.put<UpdateSource>('/updates/source', { address, token }),
  available: () => api.get<AvailableUpdate[]>('/updates/available'),
  publish: (from_version: string, notes: string) =>
    api.post<PublishUpdateResult>('/updates/publish', { from_version, notes }),
}
