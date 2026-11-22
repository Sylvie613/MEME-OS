import { initMemeOS } from './src/ui.js';

const LOAD_FLAG = '__meme_os_v012_loaded__';

function boot() {
    if (globalThis[LOAD_FLAG]) return;
    try {
        initMemeOS();
        globalThis[LOAD_FLAG] = true;
    } catch (error) {
        console.error('[MÉMÉ OS] Initialization failed:', error);
    }
}

// Third-party extension scripts may execute after APP_READY has already fired.
// Mount immediately when the document is ready; do not depend solely on APP_READY.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
    boot();
}
