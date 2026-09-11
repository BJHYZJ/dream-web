(() => {
  const cards = [...document.querySelectorAll('[data-attempt]')];
  const buttons = [...document.querySelectorAll('[data-memory-filter]')];
  const scene = document.querySelector('#scene-filter');
  const count = document.querySelector('#gallery-count');
  const empty = document.querySelector('#gallery-empty');
  let memory = 'all';

  function applyFilters() {
    let visible = 0;
    cards.forEach(card => {
      const show = (memory === 'all' || card.dataset.memory === memory) &&
        (scene.value === 'all' || card.dataset.scene === scene.value);
      card.hidden = !show;
      if (show) visible += 1;
      else card.querySelector('video').pause();
    });
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.memoryFilter === memory));
    });
    count.textContent = `${visible} of ${cards.length} successful runs`;
    empty.hidden = visible !== 0;
  }

  buttons.forEach(button => button.addEventListener('click', () => {
    memory = button.dataset.memoryFilter;
    applyFilters();
  }));
  scene.addEventListener('change', applyFilters);
  document.querySelector('#reset-filters').addEventListener('click', () => {
    memory = 'all';
    scene.value = 'all';
    applyFilters();
  });

  function revealLinkedRun() {
    const card = cards.find(item => `#${item.id}` === window.location.hash);
    if (!card) return;
    memory = 'all';
    scene.value = 'all';
    applyFilters();
    card.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', revealLinkedRun);
  document.querySelectorAll('.outcome-table a').forEach(link => {
    link.addEventListener('click', () => {
      memory = 'all';
      scene.value = 'all';
      applyFilters();
    });
  });

  cards.forEach(card => {
    const video = card.querySelector('video');
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'video-play';
    play.textContent = '▶';
    play.setAttribute('aria-label', `Play ${video.getAttribute('aria-label')}`);
    video.controls = false;
    card.querySelector('.video-frame').append(play);
    play.addEventListener('click', () => {
      video.controls = true;
      play.hidden = true;
      video.play().catch(() => {
        play.hidden = false;
      });
    });
    video.addEventListener('play', () => {
      video.controls = true;
      play.hidden = true;
      cards.forEach(other => {
        if (other !== card) other.querySelector('video').pause();
      });
    });
  });
  document.querySelector('#gallery-toolbar').hidden = false;
  revealLinkedRun();
})();
