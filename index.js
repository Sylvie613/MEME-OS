import { initMemeOS } from './src/ui.js';

const LOAD_FLAG = '__meme_os_v010_loaded__';

function boot() {
    if (globalThis[LOAD_FLAG]) return;
    globalThis[LOAD_FLAG] = true;
    initMemeOS();
}

try {
    const { eventSource, eventTypes } = SillyTavern.getContext();
    eventSource.on(eventTypes.APP_READY, boot);
} catch (error) {
    console.error('[MÉMÉ OS] Failed to register APP_READY listener.', error);
}
