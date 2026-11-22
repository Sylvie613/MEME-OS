// MÉMÉ OS bootstrap diagnostic v0.1.3
// Intentionally has zero local imports. If this button appears, manifest + index.js loading works.
(function () {
    const ID = 'meme-os-bootstrap-test';

    function mount() {
        if (document.getElementById(ID)) return;

        const button = document.createElement('button');
        button.id = ID;
        button.type = 'button';
        button.textContent = 'MÉ TEST';
        button.setAttribute('aria-label', 'MÉMÉ OS bootstrap test');
        Object.assign(button.style, {
            position: 'fixed',
            right: '14px',
            bottom: '86px',
            zIndex: '2147483647',
            display: 'block',
            visibility: 'visible',
            opacity: '1',
            width: '72px',
            height: '44px',
            borderRadius: '22px',
            border: '2px solid #6d4b75',
            background: '#f7eefb',
            color: '#4d3156',
            fontWeight: '800',
            fontSize: '13px',
            boxShadow: '0 4px 18px rgba(0,0,0,.25)',
        });
        button.addEventListener('click', () => {
            if (globalThis.toastr?.success) {
                globalThis.toastr.success('MÉMÉ OS index.js 已成功运行。');
            } else {
                alert('MÉMÉ OS index.js 已成功运行。');
            }
        });
        document.body.appendChild(button);
        console.log('[MÉMÉ OS] bootstrap diagnostic v0.1.3 mounted');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }
})();
