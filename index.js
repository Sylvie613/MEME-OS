/**
 * MÉMÉ OS v0.1.6 activation-hook diagnostic
 */
function mountProbe(id, text, bottom, background) {
    if (document.getElementById(id)) return;
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.textContent = text;
    Object.assign(button.style, {
        position:'fixed', right:'14px', bottom,
        zIndex:'2147483647', display:'block', visibility:'visible', opacity:'1',
        minWidth:'82px', height:'44px', margin:'0', padding:'0 10px',
        borderRadius:'22px', border:'2px solid #6d4b75',
        background, color:'#4d3156', fontWeight:'800', fontSize:'12px',
        boxShadow:'0 4px 18px rgba(0,0,0,.25)', cursor:'pointer'
    });
    document.body.appendChild(button);
}

// If the ES module itself is imported, this appears immediately.
mountProbe('meme-os-top-probe', 'MÉ TOP', '138px', '#fff6fb');
console.info('[MÉMÉ OS] v0.1.6 module top-level executed');

// SillyTavern 1.19 should explicitly invoke this via manifest hooks.activate.
export function activate() {
    mountProbe('meme-os-hook-probe', 'MÉ HOOK', '86px', '#f7eefb');
    console.info('[MÉMÉ OS] v0.1.6 activate hook called');
    globalThis.toastr?.success?.('MÉMÉ OS activate hook 已执行。');
}
