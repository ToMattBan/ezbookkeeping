import uaParser from 'ua-parser-js';

import { isNativeApp, getNativeServerConfig, setNativeServerConfig, resolveNativeServerUrl } from '@/lib/native.ts';

function isMobileDevice(): boolean {
    if (!navigator.userAgent) {
        return false;
    }

    const uaParseRet = uaParser(navigator.userAgent);

    if (!uaParseRet || !uaParseRet.device) {
        return false;
    }

    const device = uaParseRet.device;

    if (device.type === 'mobile' || device.type === 'wearable' || device.type === 'embedded') {
        return true;
    }

    return false;
}

function navigate(type: string): void {
    if (__EZBOOKKEEPING_IS_PRODUCTION__ && !isNativeApp()) {
        window.location.replace(`${type}#/`);
    } else {
        window.location.replace(`${type}.html#/`);
    }
}

function startApp(): void {
    if (isMobileDevice()) {
        navigate('mobile');
    } else {
        navigate('desktop');
    }
}

function showServerSetup(errorMessage?: string): void {
    const app = document.getElementById('app');

    if (!app) {
        return;
    }

    const inputStyle = 'width: 100%; box-sizing: border-box; padding: 12px; font-size: 16px; margin-bottom: 16px;';
    const labelStyle = 'display: block; margin-bottom: 4px; color: #666; font-size: 14px;';

    app.innerHTML = `
        <div style="max-width: 420px; margin: 0 auto; padding: 48px 24px; font-family: sans-serif;">
            <h2 style="margin: 0 0 24px;">ezBookkeeping</h2>
            <label style="${labelStyle}">Primary address (e.g. your home network)</label>
            <input id="server-primary" type="url" inputmode="url" autocapitalize="off" autocomplete="off"
                   placeholder="http://192.168.1.20:5555" style="${inputStyle}">
            <label style="${labelStyle}">Backup address (optional, used when the primary is unreachable)</label>
            <input id="server-backup" type="url" inputmode="url" autocapitalize="off" autocomplete="off"
                   placeholder="https://money.example.com" style="${inputStyle}">
            <button id="server-save" style="width: 100%; padding: 12px; font-size: 16px;">Connect</button>
            <p id="server-error" style="color: #c00; margin-top: 16px;"></p>
        </div>`;

    const primaryInput = document.getElementById('server-primary') as HTMLInputElement;
    const backupInput = document.getElementById('server-backup') as HTMLInputElement;
    const button = document.getElementById('server-save') as HTMLButtonElement;
    const error = document.getElementById('server-error') as HTMLElement;

    const config = getNativeServerConfig();
    primaryInput.value = config.primary;
    backupInput.value = config.backup;
    error.textContent = errorMessage || '';

    button.addEventListener('click', () => {
        if (!primaryInput.value.trim() && !backupInput.value.trim()) {
            error.textContent = 'Please enter at least one server address';
            return;
        }

        setNativeServerConfig({ primary: primaryInput.value, backup: backupInput.value });

        error.textContent = '';
        button.disabled = true;
        button.textContent = 'Connecting...';

        resolveNativeServerUrl().then(url => {
            if (url) {
                startApp();
            } else {
                error.textContent = 'Cannot reach any of the server addresses';
                button.disabled = false;
                button.textContent = 'Connect';
            }
        });
    });
}

function startNativeApp(): void {
    const config = getNativeServerConfig();

    if (!config.primary && !config.backup) {
        showServerSetup();
        return;
    }

    const app = document.getElementById('app');

    if (app) {
        app.innerHTML = '<p style="font-family: sans-serif; text-align: center; margin-top: 30vh; color: #666;">Connecting...</p>';
    }

    resolveNativeServerUrl().then(url => {
        if (url) {
            startApp();
        } else {
            showServerSetup('Cannot reach any of the server addresses');
        }
    });
}

if (isNativeApp()) {
    if (window.location.hash === '#setup') {
        showServerSetup();
    } else {
        startNativeApp();
    }
} else {
    startApp();
}
