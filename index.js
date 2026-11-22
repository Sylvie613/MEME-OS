/**
 * MÉMÉ OS v0.1.10
 * Pink heart launcher. Keeps the proven timing-safe mount logic.
 */
const MEME_ID = 'meme-os-stable-probe';

function positionLauncher(button) {
  const send = document.getElementById('send_but');
  if (!send) {
    button.style.right = '18px';
    button.style.bottom = '112px';
    return;
  }

  const rect = send.getBoundingClientRect();
  const width = 44;
  const height = 40;
  const gap = 18;
  const left = Math.min(window.innerWidth - width - 10, rect.left + (rect.width - width) / 2 - 8);
  const top = Math.max(8, rect.top - height - gap);

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
    button.title = '打开 MÉMÉ OS';
    button.setAttribute('aria-label','打开 MÉMÉ OS');

    Object.assign(button.style,{
      position:'fixed',
      zIndex:'2147483647',
      display:'block',
      width:'44px',
      height:'40px',
      minWidth:'44px',
      minHeight:'40px',
      margin:'0',
      padding:'0',
      border:'0',
      outline:'0',
      background:'transparent',
      cursor:'pointer',
      WebkitTapHighlightColor:'transparent',
      filter:'drop-shadow(0 4px 8px rgba(202,93,137,.22))'
    });

    button.innerHTML = `
      <svg viewBox="0 0 100 90" width="44" height="40" aria-hidden="true"
           style="position:absolute;inset:0;overflow:visible;">
        <path d="M50 84
                 C43 76 11 57 7 34
                 C4 17 15 6 29 6
                 C39 6 46 12 50 20
                 C54 12 61 6 71 6
                 C85 6 96 17 93 34
                 C89 57 57 76 50 84Z"
              fill="#f5a7c2"
              stroke="#dc789d"
              stroke-width="3"/>
        <path d="M24 18 C31 11 40 12 46 21"
              fill="none"
              stroke="rgba(255,255,255,.68)"
              stroke-width="5"
              stroke-linecap="round"/>
      </svg>
      <span style="
        position:absolute;
        left:50%;
        top:46%;
        transform:translate(-50%,-50%);
        color:#8f3f61;
        font-size:11px;
        line-height:1;
        font-weight:900;
        letter-spacing:-.2px;
        font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','PingFang SC',sans-serif;
        pointer-events:none;
      ">MÉ</span>
    `;

    button.addEventListener('click',(event)=>{
      event.preventDefault();
      event.stopPropagation();
      globalThis.toastr?.success?.('MÉMÉ OS 已成功挂载。');
    });

    document.body.appendChild(button);
    console.info('[MÉMÉ OS] v0.1.10 heart launcher mounted');
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
