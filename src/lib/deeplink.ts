// Handles links like ezbk://transaction/add?type=3&amount=1500&comment=Coffee
//
// "ezbk://<path>?<query>" opens the in-app page "/<path>?<query>".
// Only the pages listed below can be opened this way, since any app or web page can fire an ezbk:// link.
const DEEP_LINK_SCHEME = 'ezbk://';

const DEEP_LINK_ALLOWED_PATHS: string[] = [
    '/',
    '/transaction/add',
    '/transaction/list',
    '/account/list',
    '/statistic/transaction',
    '/template/list'
];

const DEEP_LINK_DUPLICATE_WINDOW_MS = 2000;
const LAUNCH_URL_HANDLED_STORAGE_KEY = 'ezbookkeeping_handled_launch_url';

let lastHandledUrl = '';
let lastHandledTime = 0;

// Returns the in-app route (path + query) for a deep link, or null if it is not a supported link
export function parseDeepLink(url: string): string | null {
    if (!url || url.toLowerCase().indexOf(DEEP_LINK_SCHEME) !== 0) {
        return null;
    }

    let rest = url.substring(DEEP_LINK_SCHEME.length);
    let query = '';

    const hashIndex = rest.indexOf('#');

    if (hashIndex >= 0) {
        rest = rest.substring(0, hashIndex);
    }

    const queryIndex = rest.indexOf('?');

    if (queryIndex >= 0) {
        query = rest.substring(queryIndex + 1);
        rest = rest.substring(0, queryIndex);
    }

    const path = '/' + rest.replace(/^\/+|\/+$/g, '');

    if (DEEP_LINK_ALLOWED_PATHS.indexOf(path) < 0) {
        return null;
    }

    return query ? `${path}?${query}` : path;
}

// Android can report the same link twice on a cold start (launch url + url-open event), so ignore quick repeats
export function shouldHandleDeepLink(url: string, isLaunchUrl: boolean): boolean {
    const now = Date.now();

    if (url === lastHandledUrl && now - lastHandledTime < DEEP_LINK_DUPLICATE_WINDOW_MS) {
        return false;
    }

    if (isLaunchUrl) {
        // the launch url stays available while the app runs, don't reopen it when the page reloads
        try {
            if (sessionStorage.getItem(LAUNCH_URL_HANDLED_STORAGE_KEY) === url) {
                return false;
            }

            sessionStorage.setItem(LAUNCH_URL_HANDLED_STORAGE_KEY, url);
        } catch {
            // ignore storage errors
        }
    }

    lastHandledUrl = url;
    lastHandledTime = now;
    return true;
}
