const slides = [...document.querySelectorAll('.slide')];
const counter = document.querySelector('#counter');
const progressBar = document.querySelector('#progressBar');
const dots = document.querySelector('#dots');
const notesDialog = document.querySelector('#notesDialog');
const notesContent = document.querySelector('#notesContent');
const sourcesDialog = document.querySelector('#sourcesDialog');
const galleryDialog = document.querySelector('#galleryDialog');
const galleryGrid = document.querySelector('#galleryGrid');
const galleryCount = document.querySelector('#galleryCount');
const mediaViewer = document.querySelector('#mediaViewer');
const viewerMedia = document.querySelector('#viewerMedia');
const archive = window.MEDIA_ARCHIVE || [];
let current = 0;
let locked = false;
let touchStartY = 0;
let filteredArchive = archive;
let viewerIndex = 0;

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
  if (!mediaViewer.hidden) {
    if (event.key === 'Escape') { event.preventDefault(); closeViewer(); }
    if (event.key === 'ArrowLeft') showViewer(viewerIndex - 1);
    if (event.key === 'ArrowRight') showViewer(viewerIndex + 1);
    return;
  }
  if (document.querySelector('dialog[open]') && event.key !== 'Escape') return;
  if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); step(1); }
  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); step(-1); }
  if (event.key.toLowerCase() === 'n') { updateNotes(); notesDialog.showModal(); }
  if (event.key.toLowerCase() === 'g') openGallery();
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

function renderGallery(filter = '全部') {
  filteredArchive = filter === '全部' ? archive : archive.filter(item => item.city === filter);
  galleryGrid.replaceChildren();
  filteredArchive.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'gallery-item';
    button.type = 'button';
    button.setAttribute('aria-label', `查看${item.title}`);
    const media = document.createElement(item.type === 'video' ? 'video' : 'img');
    media.src = item.path;
    media.preload = item.type === 'video' ? 'metadata' : undefined;
    if (item.type === 'image') {
      media.alt = item.title;
      media.loading = 'lazy';
    } else {
      media.muted = true;
      media.playsInline = true;
    }
    const label = document.createElement('span');
    label.className = 'gallery-item-label';
    label.innerHTML = `<span>${item.title}</span><b>${item.city} · ${item.type === 'video' ? '视频' : '照片'}</b>`;
    button.append(media, label);
    button.addEventListener('click', () => showViewer(index));
    galleryGrid.append(button);
  });
  const photos = filteredArchive.filter(item => item.type === 'image').length;
  const videos = filteredArchive.length - photos;
  galleryCount.textContent = `${photos} 张照片 / ${videos} 段视频`;
}

function openGallery() {
  renderGallery(document.querySelector('[data-gallery-filter].is-selected')?.dataset.galleryFilter || '全部');
  galleryDialog.showModal();
}

function showViewer(index) {
  if (!filteredArchive.length) return;
  viewerIndex = (index + filteredArchive.length) % filteredArchive.length;
  const item = filteredArchive[viewerIndex];
  viewerMedia.replaceChildren();
  const media = document.createElement(item.type === 'video' ? 'video' : 'img');
  media.src = item.path;
  if (item.type === 'video') {
    media.controls = true;
    media.autoplay = true;
    media.playsInline = true;
  } else {
    media.alt = item.title;
  }
  viewerMedia.append(media);
  document.querySelector('#viewerCity').textContent = `${item.city} · ${item.type === 'video' ? '视频' : '照片'}`;
  document.querySelector('#viewerTitle').textContent = item.title;
  document.querySelector('#viewerCounter').textContent = `${viewerIndex + 1} / ${filteredArchive.length}`;
  mediaViewer.hidden = false;
}

function closeViewer() {
  viewerMedia.querySelector('video')?.pause();
  viewerMedia.replaceChildren();
  mediaViewer.hidden = true;
}

function buildStoryAlbums() {
  document.querySelectorAll('[data-story-cities]').forEach(album => {
    const cities = album.dataset.storyCities.split(',');
    const photos = archive.filter(item => item.type === 'image' && cities.includes(item.city));
    if (!photos.length) return;

    const main = document.createElement('img');
    main.className = 'story-album-main';
    const controls = document.createElement('div');
    controls.className = 'story-album-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'story-album-nav story-album-prev';
    previous.setAttribute('aria-label', '上一张照片');
    previous.textContent = '‹';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'story-album-nav story-album-next';
    next.setAttribute('aria-label', '下一张照片');
    next.textContent = '›';
    const meta = document.createElement('div');
    meta.className = 'story-album-meta';
    const title = document.createElement('span');
    const count = document.createElement('b');
    meta.append(title, count);
    controls.append(previous, next, meta);
    const thumbs = document.createElement('div');
    thumbs.className = 'story-album-thumbs';
    thumbs.setAttribute('aria-label', '本章节全部照片缩略图');
    let active = Math.max(0, photos.findIndex(item => item.title === album.dataset.storyStart));

    const select = index => {
      active = (index + photos.length) % photos.length;
      const item = photos[active];
      main.src = item.path;
      main.alt = item.title;
      title.textContent = `${item.city} · ${item.title}`;
      count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
      [...thumbs.children].forEach((thumb, thumbIndex) => thumb.classList.toggle('is-selected', thumbIndex === active));
      thumbs.children[active]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };

    photos.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'story-album-thumb';
      button.setAttribute('aria-label', `显示${item.title}`);
      const thumbnail = document.createElement('img');
      thumbnail.src = item.path;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      button.append(thumbnail);
      button.addEventListener('click', () => select(index));
      thumbs.append(button);
    });
    previous.addEventListener('click', () => select(active - 1));
    next.addEventListener('click', () => select(active + 1));
    thumbs.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        event.preventDefault();
        thumbs.scrollLeft += event.deltaY;
      }
      event.stopPropagation();
    }, { passive: false });
    album.append(main, controls, thumbs);
    select(active);
  });
}

document.querySelector('#fullscreenButton').addEventListener('click', toggleFullscreen);
document.querySelector('#notesButton').addEventListener('click', () => { updateNotes(); notesDialog.showModal(); });
document.querySelector('#sourcesButton').addEventListener('click', () => sourcesDialog.showModal());
document.querySelector('#galleryButton').addEventListener('click', openGallery);
document.querySelector('#endGalleryButton').addEventListener('click', openGallery);
document.querySelector('#viewerClose').addEventListener('click', closeViewer);
document.querySelector('#viewerPrevious').addEventListener('click', () => showViewer(viewerIndex - 1));
document.querySelector('#viewerNext').addEventListener('click', () => showViewer(viewerIndex + 1));
document.querySelectorAll('[data-gallery-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-gallery-filter]').forEach(item => item.classList.remove('is-selected'));
    button.classList.add('is-selected');
    renderGallery(button.dataset.galleryFilter);
  });
});
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.close === 'galleryDialog') closeViewer();
    document.getElementById(button.dataset.close).close();
  });
});

buildStoryAlbums();
const requested = Number(location.hash.replace('#s', '')) - 1;
goTo(Number.isFinite(requested) && requested >= 0 ? requested : 0);
