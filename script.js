const slides = [...document.querySelectorAll('.slide')];
const counter = document.querySelector('#counter');
const progressBar = document.querySelector('#progressBar');
const dots = document.querySelector('#dots');
const notesDialog = document.querySelector('#notesDialog');
const notesContent = document.querySelector('#notesContent');
const sourcesDialog = document.querySelector('#sourcesDialog');
let current = 0;
let locked = false;
let touchStartY = 0;

slides.forEach((slide, index) => {
  const button = document.createElement('button');
  button.setAttribute('aria-label', `第${index + 1}页 ${slide.dataset.title}`);
  button.addEventListener('click', () => goTo(index));
  dots.append(button);
});

function setMediaState(slide, active) {
  slide.querySelectorAll('video').forEach(video => {
    if (active) video.play().catch(() => {});
    else video.pause();
  });
}

function updateNotes() {
  notesContent.textContent = slides[current].querySelector('.notes')?.textContent.trim() || '本页没有讲稿。';
}

function goTo(index) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  if (next === current && slides[current].classList.contains('is-active')) return;
  slides.forEach((slide, i) => {
    slide.classList.toggle('is-active', i === next);
    slide.classList.toggle('is-before', i < next);
    setMediaState(slide, i === next);
  });
  current = next;
  counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
  [...dots.children].forEach((dot, i) => dot.classList.toggle('is-current', i === current));
  document.querySelectorAll('.chapters button').forEach(button => {
    button.classList.toggle('is-current', button.textContent === slides[current].dataset.chapter);
  });
  history.replaceState(null, '', `#s${current + 1}`);
  updateNotes();
}

function step(direction) {
  if (locked) return;
  locked = true;
  goTo(current + direction);
  window.setTimeout(() => { locked = false; }, 680);
}

document.addEventListener('wheel', event => {
  if (Math.abs(event.deltaY) < 18 || document.querySelector('dialog[open]')) return;
  step(event.deltaY > 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', event => {
  if (document.querySelector('dialog[open]') && event.key !== 'Escape') return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); step(1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); step(-1); }
  if (event.key.toLowerCase() === 'n') { updateNotes(); notesDialog.showModal(); }
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
  if (event.key === 'Home') goTo(0);
  if (event.key === 'End') goTo(slides.length - 1);
});

document.addEventListener('touchstart', event => { touchStartY = event.changedTouches[0].clientY; }, { passive: true });
document.addEventListener('touchend', event => {
  const distance = touchStartY - event.changedTouches[0].clientY;
  if (Math.abs(distance) > 48) step(distance > 0 ? 1 : -1);
}, { passive: true });

document.querySelectorAll('[data-go]').forEach(button => {
  button.addEventListener('click', () => goTo(Number(button.dataset.go) - 1));
});

document.querySelectorAll('[data-reveal]').forEach(button => {
  button.addEventListener('click', () => {
    const panel = document.getElementById(button.dataset.reveal);
    panel.hidden = !panel.hidden;
    button.setAttribute('aria-expanded', String(!panel.hidden));
  });
});

document.querySelectorAll('.media-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const videos = button.closest('.slide').querySelectorAll('video');
    const shouldPlay = [...videos].some(video => video.paused);
    videos.forEach(video => shouldPlay ? video.play().catch(() => {}) : video.pause());
    button.textContent = shouldPlay ? '暂停视频' : '播放视频';
  });
});

document.querySelectorAll('[data-vote]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-vote]').forEach(item => item.classList.remove('is-selected'));
    button.classList.add('is-selected');
    const messages = {
      tool: '工具视角更关注稳定、效率和人的控制权。',
      performer: '表演者视角会把角色、排练和观众期待带进策划。',
      art: '作品视角会继续追问作者、媒介和表达意义。'
    };
    document.querySelector('#pollResult').textContent = messages[button.dataset.vote];
  });
});

document.querySelectorAll('[data-city]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-city]').forEach(item => item.classList.remove('is-selected'));
    button.classList.add('is-selected');
    document.querySelector('#cityText').textContent = `${button.dataset.city}：${button.dataset.text}`;
  });
});

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

document.querySelector('#fullscreenButton').addEventListener('click', toggleFullscreen);
document.querySelector('#notesButton').addEventListener('click', () => { updateNotes(); notesDialog.showModal(); });
document.querySelector('#sourcesButton').addEventListener('click', () => sourcesDialog.showModal());
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});

const requested = Number(location.hash.replace('#s', '')) - 1;
goTo(Number.isFinite(requested) && requested >= 0 ? requested : 0);
