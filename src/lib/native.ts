import { Capacitor } from '@capacitor/core';

// The active key must stay in sync with the inline script in mobile.html / desktop.html
const ACTIVE_SERVER_URL_STORAGE_KEY = 'ezbookkeeping_native_server_url';
const SERVER_CONFIG_STORAGE_KEY = 'ezbookkeeping_native_server_config';

const PRIMARY_SERVER_TIMEOUT_MS = 3000; // short, so falling back to the backup address is quick when away from home
const DEFAULT_SERVER_TIMEOUT_MS = 10000;

export interface NativeServerConfig {
    primary: string; // e.g. the address on the home network, tried first
    backup: string; // e.g. a Cloudflare tunnel, used when the primary is unreachable
}

export function isNativeApp(): boolean {
    return Capacitor.isNativePlatform();
}

export function normalizeServerUrl(url: string): string {
    let ret = (url || '').trim();

    if (!ret) {
        return '';
    }

    if (!/^https?:\/\//i.test(ret)) {
        ret = 'http://' + ret;
    }

    return ret.replace(/\/+$/, '');
}

export function getNativeServerUrl(): string {
    try {
        return localStorage.getItem(ACTIVE_SERVER_URL_STORAGE_KEY) || '';
    } catch {
        return '';
    }
}

export function getNativeServerConfig(): NativeServerConfig {
    try {
        const config = JSON.parse(localStorage.getItem(SERVER_CONFIG_STORAGE_KEY) || '{}');
        return {
            primary: normalizeServerUrl(config.primary),
            backup: normalizeServerUrl(config.backup)
        };
    } catch {
        return { primary: '', backup: '' };
    }
}

export function setNativeServerConfig(config: NativeServerConfig): void {
    localStorage.setItem(SERVER_CONFIG_STORAGE_KEY, JSON.stringify({
        primary: normalizeServerUrl(config.primary),
        backup: normalizeServerUrl(config.backup)
    }));
}

export function isServerReachable(url: string, timeoutMs: number = DEFAULT_SERVER_TIMEOUT_MS): Promise<boolean> {
    // "no-cors" yields an opaque response, which is enough to know the server answered
    const request = fetch(url + '/server_settings.js', { mode: 'no-cors', cache: 'no-store' })
        .then(response => response.type === 'opaque' || response.ok)
        .catch(() => false);

    const timeout = new Promise<boolean>(resolve => setTimeout(() => resolve(false), timeoutMs));

    return Promise.race([request, timeout]);
}

// Tries the primary address first, then the backup. Stores and returns the first reachable one ('' if none).
export async function resolveNativeServerUrl(): Promise<string> {
    const config = getNativeServerConfig();
    const candidates: { url: string, timeout: number }[] = [];

    if (config.primary) {
        candidates.push({ url: config.primary, timeout: config.backup ? PRIMARY_SERVER_TIMEOUT_MS : DEFAULT_SERVER_TIMEOUT_MS });
    }

    if (config.backup && config.backup !== config.primary) {
        candidates.push({ url: config.backup, timeout: DEFAULT_SERVER_TIMEOUT_MS });
    }

    for (const candidate of candidates) {
        if (await isServerReachable(candidate.url, candidate.timeout)) {
            localStorage.setItem(ACTIVE_SERVER_URL_STORAGE_KEY, candidate.url);
            return candidate.url;
        }
    }

    return '';
}

// The server builds avatar / picture urls from its "root_url" setting, which can differ from the address
// the app is currently using (e.g. home address vs. tunnel address), so point them at the active server.
export function rebaseServerFileUrl(url: string): string {
    const serverUrl = getNativeServerUrl();

    if (!isNativeApp() || !serverUrl || !/^https?:\/\//i.test(url)) {
        return url;
    }

    try {
        const parsed = new URL(url);
        const matches = parsed.pathname.match(/\/(avatar|pictures)\/[^/]+$/);

        if (!matches) {
            return url; // external url, e.g. gravatar
        }

        return serverUrl + matches[0] + parsed.search;
    } catch {
        return url;
    }
}
