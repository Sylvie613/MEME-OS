/**
 * MÉMÉ OS v0.1.8
 * Compact launcher, anchored above the send button to avoid accidental sends.
 */
const MEME_ID = 'meme-os-stable-probe';

function positionLauncher(button) {
  const send = document.getElementById('send_but');
  if (!send) {
    button.style.right = '18px';
    button.style.bottom = '92px';
    return;
  }

  const rect = send.getBoundingClientRect();
  const size = 34;
  const gap = 9;
  const left = rect.left + (rect.width - size) / 2;
  const top = Math.max(8, rect.top - size - gap);

  button.style.left = left + 'px';
  button.style.top = top + 'px';
  button.style.right = 'auto';
  button.style.bottom = 'auto';
}

function mount() {
  let button = document.getElementById(MEME_ID);

  if (!button) {
    button = document.createElement('button');
    button.id = MEME_ID;
    button.type = 'button';
    button.textContent = 'MÉ';
    button.title = '打开 MÉMÉ OS';
    button.setAttribute('aria-label','打开 MÉMÉ OS');

    Object.assign(button.style,{
      position:'fixed',
      zIndex:'2147483647',
      display:'inline-flex',
      alignItems:'center',
      justifyContent:'center',
      width:'34px',
      height:'34px',
      minWidth:'34px',
      minHeight:'34px',
      margin:'0',
      padding:'0',
      borderRadius:'12px',
      border:'1px solid rgba(109,75,117,.28)',
      background:'rgba(247,238,251,.96)',
      color:'#6d4b75',
      fontWeight:'800',
      fontSize:'12px',
      lineHeight:'1',
      boxShadow:'0 3px 12px rgba(70,45,80,.16)',
      cursor:'pointer',
      WebkitTapHighlightColor:'transparent'
    });

    button.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopPropagation();
      globalThis.toastr?.success?.('MÉMÉ OS 已成功挂载。');
    });

    document.body.appendChild(button);
    console.info('[MÉMÉ OS] v0.1.8 launcher mounted');
  }

  positionLauncher(button);
  return true;
}

function start() {
  mount();
  const timer = setInterval(mount, 1000);
  globalThis.__meme_os_probe_timer__ = timer;
  window.addEventListener('resize', mount, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(mount, 150), { passive:true });
}

if (globalThis.jQuery) {
  globalThis.jQuery(() => start());
} else if (globalThis.$) {
  globalThis.$(() => start());
} else {
  setTimeout(start, 1000);
}
