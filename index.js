/**
 * MÉMÉ OS v0.1.7
 * Timing-safe bootstrap: wait for SillyTavern UI readiness and keep the launcher mounted.
 */
const MEME_ID = 'meme-os-stable-probe';

function mount() {
  if (document.getElementById(MEME_ID)) return true;
  const host = document.getElementById('leftSendForm') || document.body;
  if (!host) return false;

  const button = document.createElement('button');
  button.id = MEME_ID;
  button.type = 'button';
  button.textContent = 'MÉ';
  button.title = 'MÉMÉ OS v0.1.7';
  button.setAttribute('aria-label','打开 MÉMÉ OS');
  Object.assign(button.style,{
    position:'relative',
    zIndex:'2147483647',
    display:'inline-flex',
    alignItems:'center',
    justifyContent:'center',
    flex:'0 0 auto',
    width:'44px',
    height:'44px',
    margin:'0 4px',
    padding:'0',
    borderRadius:'12px',
    border:'1px solid rgba(109,75,117,.35)',
    background:'#f7eefb',
    color:'#6d4b75',
    fontWeight:'800',
    fontSize:'14px',
    cursor:'pointer'
  });
  button.addEventListener('click',()=>{
    globalThis.toastr?.success?.('MÉMÉ OS 已成功挂载。');
  });
  host.appendChild(button);
  console.info('[MÉMÉ OS] v0.1.7 launcher mounted');
  return true;
}

function start() {
  mount();
  // ST can redraw composer/navigation after extension activation; keep launcher alive.
  const timer = setInterval(() => mount(), 1000);
  globalThis.__meme_os_probe_timer__ = timer;
}

if (globalThis.jQuery) {
  globalThis.jQuery(() => start());
} else if (globalThis.$) {
  globalThis.$(() => start());
} else {
  setTimeout(start, 1000);
}
