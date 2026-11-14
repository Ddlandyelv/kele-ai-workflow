/* 滚动叙事增强层：只控制呈现，不接管行业数据、播放计时或三维角度。 */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groups = new Map();
  const revealed = [];
  let observer;
  let scrollFrame = 0;
  let resizeObserver;
  let failed = false;

  function reveal(group, immediate = false) {
    const elements = groups.get(group) || [];
    elements.forEach(element => {
      if (immediate) element.classList.add('motion-instant');
      element.classList.add('v');
      element.classList.remove('motion-pending');
    });
    if (elements.length) {
      revealed.push({ group: group.dataset.motionGroup, time: performance.now() });
      groups.delete(group);
      observer?.unobserve(group);
    }
  }

  function failOpen() {
    failed = true;
    root.classList.remove('motion-ready');
    for (const group of [...groups.keys()]) reveal(group, true);
    observer?.disconnect();
  }

  function register(group, items, name) {
    if (!group) return;
    const elements = [];
    items.forEach(([element, direction = 'up', delay = 0]) => {
      if (!element) return;
      element.classList.add(direction === 'left' ? 'rv-left' : direction === 'right' ? 'rv-right' : 'rv');
      element.classList.add('motion-pending');
      element.style.setProperty('--reveal-delay', `${delay}ms`);
      element.dataset.motionDirection = direction;
      elements.push(element);
    });
    if (elements.length) {
      group.dataset.motionGroup = name;
      groups.set(group, elements);
    }
  }

  function revealNearViewport(immediate = false) {
    for (const group of [...groups.keys()]) {
      const rect = group.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight * .94) reveal(group, immediate);
    }
  }

  function initialise() {
    const one = selector => document.querySelector(selector);
    const all = selector => [...document.querySelectorAll(selector)];
    const header = one('header');
    header.classList.add('nav');

    // 组内共享一次触发时间；每个服务阶段单独观察，不在整页加载时统一播放。
    register(one('#home'), [
      [one('.hero-copy .eyebrow'), 'left', 0],
      [one('.hero-copy h1'), 'left', 100],
      ...all('.hero-copy>p').map((el, i) => [el, 'left', 210 + i * 110]),
      [one('.hero-copy .actions'), 'up', 420],
      [one('.hero-bottom'), 'up', 500],
      [one('.hero-image>.photo'), 'right', 150],
      [one('.floating-chat'), 'up', 480],
      [one('.floating-order'), 'up', 680],
      [one('.asset-label'), 'up', 680]
    ], 'home');

    for (const section of all('main>section:not(#home)')) {
      const intro = [...section.children].filter(el => el.matches('.eyebrow,h2,.section-intro'));
      register(section.querySelector('h2'), intro.map((el, i) => [el, 'up', i * 110]), `${section.id}-heading`);
    }
    const explanation = one('.under-grid>div:first-child');
    register(explanation, [...explanation.children].map((el, i) => [el, 'left', Math.min(i * 100, 400)]), 'understand-need');
    register(one('.under-product'), [[one('.need'), 'up', 320], [one('.under-product .shop-mock'), 'right', 540]], 'understand-connection');

    register(one('.industry-tabs'), [[one('.industry-tabs'), 'up', 0], [one('#housing-modes'), 'up', 120]], 'industry-selector');
    register(one('#scenario'), [[one('.chat-panel'), 'left', 0], [one('.product-panel'), 'right', 150]], 'industry-panels');
    register(one('.player'), [[one('.player'), 'up', 0]], 'industry-player');

    all('.service-stage').forEach((stage, i) => {
      const copy = stage.querySelector('.stage-copy');
      const visual = stage.querySelector('.stage-visual');
      const line = document.createElement('span');
      line.className = 'sec-line';
      line.setAttribute('aria-hidden', 'true');
      stage.prepend(line);
      const direction = i % 2 ? 'right' : 'left';
      register(stage, [
        [line, 'line', 0],
        ...[...copy.children].map((el, n) => [el, direction, Math.min(n * 110, 550)]),
        [visual, i % 2 ? 'left' : 'right', 180]
      ], `services-stage-${i + 1}`);
    });

    register(one('.delivery-grid'), [[one('.delivery-product'), 'left', 0], [one('.delivery-copy>h3'), 'right', 180],
      ...all('.delivery-copy>p').map((el, i) => [el, 'right', 240 + i * 70])], 'delivery-result');
    const steps = one('.delivery-steps');
    register(steps, [...steps.children].map((el, i) => [el, 'up', Math.min(Math.ceil(i / 2) * 140, 560)]), 'delivery-steps');
    register(one('.boundary'), [[one('.boundary'), 'up', 160]], 'delivery-boundary');

    const about = one('.about-grid>div');
    register(about, [...about.children].map((el, i) => [el, 'left', Math.min(Math.ceil(i / 2) * 120, 480)]), 'about-principles');
    register(one('.person'), [[one('.person'), 'right', 180]], 'about-person');
    register(one('.contact-grid'), [...all('.contact-grid>div:first-child>*').map((el, i) => [el, 'left', i * 110]),
      [one('.faq>h3'), 'right', 160], ...all('.faq-item').map((el, i) => [el, 'right', 220 + i * 90])], 'contact-content');
    register(one('footer'), [[one('footer'), 'up', 100]], 'contact-footer');

    observer = new IntersectionObserver(entries => {
      try {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
      } catch { failOpen(); }
    }, { threshold: 0, rootMargin: '0px 0px -7% 0px' });
    for (const group of groups.keys()) observer.observe(group);
    root.classList.add('motion-ready');
    if (reduced.matches) {
      root.classList.remove('motion-ready');
      for (const group of [...groups.keys()]) reveal(group, true);
    }
    else requestAnimationFrame(() => revealNearViewport());

    // 与消息播放器使用不同的进度ID及独立帧；滚动回调只合并更新这两个全站状态。
    const progress = document.createElement('div');
    progress.id = 'reading-progress';
    progress.className = 'reading-progress';
    progress.setAttribute('role', 'progressbar');
    progress.setAttribute('aria-label', '页面阅读进度');
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', '100');
    progress.innerHTML = '<i></i>';
    document.body.prepend(progress);
    const bar = progress.firstElementChild;
    const sections = all('main>section');
    const navlinks = all('header a[href^="#"]');
    let geometry = [];
    let maxScroll = 1;
    let current = '';
    let percent = -1;
    function update() {
      scrollFrame = 0;
      const ratio = Math.min(1, Math.max(0, scrollY / maxScroll));
      bar.style.transform = `scaleX(${ratio})`;
      if (percent !== Math.round(ratio * 100)) {
        percent = Math.round(ratio * 100);
        progress.setAttribute('aria-valuenow', String(percent));
      }
      header.classList.toggle('scrolled', scrollY > 30);
      const active = geometry.filter(item => item.top <= scrollY + 195).at(-1)?.id || 'home';
      if (active !== current) {
        current = active;
        navlinks.forEach(link => {
          if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }
    function schedule() { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); }
    function measure() {
      maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      geometry = sections.map(section => ({ id: section.id, top: section.getBoundingClientRect().top + scrollY }));
      schedule();
    }
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', measure, { passive: true });
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(document.body);
    }
    for (const event of ['pageshow', 'hashchange', 'popstate']) addEventListener(event, () => {
      measure();
      requestAnimationFrame(() => revealNearViewport(reduced.matches));
    });
    document.addEventListener('focusin', event => {
      for (const group of [...groups.keys()]) {
        if ((groups.get(group) || []).some(el => el.contains(event.target))) reveal(group, true);
      }
    });
    measure();

    // 动态内容在业务状态更新后入场；取消旧呈现动画，不创建延迟业务回调。
    document.addEventListener('yanye:scenario-change', () => {
      for (const element of [one('#chat'), one('#product')]) {
        if (!element?.animate) continue;
        element.getAnimations().forEach(animation => animation.cancel());
        if (!reduced.matches) element.animate([
          { opacity: .35, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    });

    all('.faq-item button').forEach(button => {
      const panel = document.getElementById(button.getAttribute('aria-controls'));
      let animation;
      button.onclick = () => {
        animation?.cancel();
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        button.querySelector('span').textContent = open ? '−' : '＋';
        panel.setAttribute('aria-hidden', String(!open));
        if (reduced.matches || !panel.animate) { panel.hidden = !open; return; }
        panel.hidden = false;
        animation = panel.animate(open ? [
          { opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }
        ] : [
          { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }
        ], { duration: open ? 260 : 180, easing: 'ease-out' });
        animation.onfinish = () => { panel.hidden = button.getAttribute('aria-expanded') !== 'true'; };
      };
    });

    reduced.addEventListener('change', () => {
      if (reduced.matches) {
        root.classList.remove('motion-ready');
        for (const group of [...groups.keys()]) reveal(group, true);
        for (const el of all('#chat,#product,.faq-item>p')) el.getAnimations().forEach(animation => animation.cancel());
        all('.faq-item button').forEach(button => {
          document.getElementById(button.getAttribute('aria-controls')).hidden = button.getAttribute('aria-expanded') !== 'true';
        });
      }
    });
    addEventListener('error', event => { if (event instanceof ErrorEvent) failOpen(); });
    // 即使浏览器没有送达首次观察回调，已处在视口中的正文仍会释放显示。
    setTimeout(() => revealNearViewport(reduced.matches), 1200);
    window.YANYEMotion = { revealed, failOpen, get pendingCount() { return groups.size; }, get failed() { return failed; } };
  }

  try { initialise(); } catch { failOpen(); }
})();
