import { isNativeApp, getNativeServerUrl } from './native.ts';

export function getBasePath(): string {
    if (isNativeApp()) {
        // inside the Capacitor app, all server requests go to the configured server
        return getNativeServerUrl();
    }

    const path = window.location.pathname;
    const lastSlashIndex = path.lastIndexOf('/');

    if (lastSlashIndex < 0) {
        return path;
    }

    return path.substring(0, lastSlashIndex);
}

export function navigateToHomePage(type: 'desktop' | 'mobile'): void {
    if (__EZBOOKKEEPING_IS_PRODUCTION__ && !isNativeApp()) {
        window.location.replace(`${type}#/`);
    } else {
        window.location.replace(`${type}.html#/`);
    }
}
