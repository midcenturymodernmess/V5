/* =========================================================
   main.js — Jamie Mars Site
   =========================================================
   ✨ Catalogue filters: animated underline, single-select, toggle-off
   🎯 Project filtering: shows/hides .project groups via data-roles
   ▶️ About panel:
      - Desktop: left slide-out
      - Mobile/Tablet: bottom sheet with peeking header
   ⏰ Sticky clocks
   🖼️ Lightbox
   ⤴️ Smooth “Back to Top”
   🧲 Snap between breakpoints (no weird sliding)
   ========================================================= */

   document.addEventListener('DOMContentLoaded', () => {
    const doc = document.documentElement;
  
    /* -----------------------------
     *  Helpers + common elements
     * ----------------------------- */
    const qs  = (s, r=document) => r.querySelector(s);
    const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  
    const sideNav     = qs('#mySidenav');
    const sheet       = sideNav;
    const sheetBar    = sheet ? sheet.querySelector('.sidenav__sheetbar') : null;
    const closeBtn    = sheet ? sheet.querySelector('.sidenav__close') : null;
    const introMobile = qs('#intro-mobile');
  
    // Phone + tablet behave like the bottom sheet; desktop never does
    const isMobileLike = () => window.matchMedia('(max-width: 1199.98px)').matches;
  
    /* --------------------------------------
     *  Snap between layout buckets (no slide)
     * -------------------------------------- */
    (function snapBetweenLayouts(){
      const buckets = [
        '(max-width: 767.98px)',
        '(min-width: 768px) and (max-width: 1199.98px)',
        '(min-width: 1200px)'
      ].map(q => window.matchMedia(q));
  
      let timer = null;
      const arm = () => {
        doc.classList.add('no-anim');
        clearTimeout(timer);
        timer = setTimeout(() => doc.classList.remove('no-anim'), 250);
      };
  
      buckets.forEach(mql => mql.addEventListener('change', arm));
      window.addEventListener('resize', arm, { passive: true });
    })();
  
    /* --------------------------------------
     *  Desktop: slide-out About (left panel)
     * -------------------------------------- */
    function syncNavWidth(){
      const nav = qs('.nav-left');
      if (sideNav && nav) {
        sideNav.style.width = getComputedStyle(nav).width;
      }
    }
    syncNavWidth();
    window.addEventListener('resize', syncNavWidth, { passive: true });
  
    function openNav(){
      syncNavWidth();
      if (!sideNav) return;
      sideNav.classList.add('is-open');
      sideNav.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn?.focus();
    }
  
    function closeNav(){
      if (!sideNav) return;
      sideNav.classList.remove('is-open');
      sideNav.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  
    // Expose for inline triggers (used by index.html)
    window.openNav  = openNav;
    window.closeNav = closeNav;
  
    // Esc close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sideNav?.classList.contains('is-open')) closeNav();
    });
  
    /* --------------------------------------
     *  Bottom-sheet metrics (mobile/tablet)
     * -------------------------------------- */
    function computeSheetMetrics(){
      if (!isMobileLike() || !sheet) return;
      const rect = introMobile ? introMobile.getBoundingClientRect() : null;
      const sheetTop = rect ? Math.ceil(rect.bottom) : 0; // sit flush under sticky intro
      doc.style.setProperty('--sheet-top', `${sheetTop}px`);
      const peek = sheetBar ? Math.round(sheetBar.getBoundingClientRect().height) : 56;
      doc.style.setProperty('--peek', `${peek}px`);
    }
    computeSheetMetrics();
    window.addEventListener('resize', computeSheetMetrics, { passive: true });
    window.addEventListener('orientationchange', computeSheetMetrics);
  
    // Header toggles the sheet (no navigation)
    if (sheetBar){
      const toggleSheet = () => sideNav.classList.contains('is-open') ? closeNav() : openNav();
      sheetBar.addEventListener('click', (e) => { e.preventDefault(); toggleSheet(); });
      sheetBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSheet(); }
      });
    }
    closeBtn?.addEventListener('click', computeSheetMetrics);
  
    /* --------------------------------------
     *  Catalogue filters (single-select)
     * -------------------------------------- */
    const filterLinks = qsa('#block-1 .filter-link');
    const projects    = qsa('.project');
  
    const keyOf = (btn) => (btn.dataset.key || btn.textContent || '').toLowerCase().trim();
  
    const applyCategoryFilter = () => {
      const active    = qs('#block-1 .filter-link.is-active');
      const activeKey = active ? keyOf(active) : null;
  
      projects.forEach((proj) => {
        if (!activeKey) { proj.style.display = ''; return; }
        const roles = (proj.getAttribute('data-roles') || '')
          .toLowerCase()
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
        proj.style.display = roles.includes(activeKey) ? '' : 'none';
      });
    };
  
    // Single-select toggle (tap again clears)
    filterLinks.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        const isActive = btn.classList.contains('is-active');
        // clear all
        filterLinks.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
        // re-apply if it wasn’t active
        if (!isActive){ btn.classList.add('is-active'); btn.setAttribute('aria-pressed','true'); }
        applyCategoryFilter();
      });
    });
    applyCategoryFilter();
  
    /* --------------------------------------
     *  Sticky clocks (Paris / NYC)
     * -------------------------------------- */
    (function initClocks(){
      const elParis = qs('#time-paris');
      const elNYC   = qs('#time-nyc');
      if (!elParis || !elNYC) return;
  
      const fmt = (zone) => new Intl.DateTimeFormat(undefined, {
        hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true, timeZone: zone
      }).format(new Date());
  
      const tick = () => { elParis.textContent = fmt('Europe/Paris'); elNYC.textContent = fmt('America/New_York'); };
      tick(); setInterval(tick, 1000);
    })();
  
    /* --------------------------------------
     *  Lightbox (click image to zoom)
     * -------------------------------------- */
    (function initLightbox(){
const imgs = qsa('.media-item:not(video)');
      if (!imgs.length) return;
  
      const overlay = document.createElement('div');
      overlay.className = 'lb-backdrop';
      overlay.innerHTML = '<img class="lb-image" alt="">';
      document.body.appendChild(overlay);
  
      const lbImg = qs('.lb-image', overlay);
      const open  = (src, alt='') => { lbImg.src = src; lbImg.alt = alt; overlay.classList.add('is-open'); document.body.style.overflow='hidden'; };
      const close = () => { overlay.classList.remove('is-open'); document.body.style.overflow=''; };
  
      imgs.forEach(img => {
        img.tabIndex = 0;
        img.addEventListener('click', () => open(img.src, img.alt));
        img.addEventListener('keydown', (e) => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); open(img.src, img.alt); }});
      });
      overlay.addEventListener('click', close);
      document.addEventListener('keydown', (e) => { if (e.key==='Escape' && overlay.classList.contains('is-open')) close(); });
    })();
  
    /* --------------------------------------
     *  Smooth Back-To-Top
     * -------------------------------------- */
    (function initBackToTop(){
      const triggers = qsa('.back-to-top, .back-to-top-fixed');
      if (!triggers.length) return;
  
      const contentEl    = qs('.content');
      const isScrollable = contentEl && (/(auto|scroll)/).test(getComputedStyle(contentEl).overflowY || '');
      const scrollTarget = isScrollable ? contentEl : window;
  
      const smoothToTop = (duration = 700) => {
        const start = isScrollable ? contentEl.scrollTop : window.scrollY; if (start <= 0) return;
        const ease  = t => 1 - Math.pow(1 - t, 3);
        const t0    = performance.now();
        function step(now){
          const p = Math.min((now - t0) / duration, 1);
          const y = Math.round(start * (1 - ease(p)));
          if (isScrollable) contentEl.scrollTop = y; else window.scrollTo(0, y);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      };
  
      triggers.forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); smoothToTop(350); }));
    })();
  });
  
  /* =========================================================
     Brand logo loop controller (outside DOMContentLoaded)
     ========================================================= */
  (function () {
    const v = document.querySelector('#brandFx .brandFx__video');
    if (!v) return;
  
    const TARGET = 30.0; // seconds
    v.loop = false;
  
    // Kick autoplay on iOS if needed
    const nudgePlay = () => v.play().catch(() => {});
    const gestureKick = () => { nudgePlay(); window.removeEventListener('touchstart', gestureKick, {passive:true}); window.removeEventListener('pointerdown', gestureKick); };
    window.addEventListener('touchstart', gestureKick, { passive:true });
    window.addEventListener('pointerdown', gestureKick);
  
    // Respect reduced motion: show first frame only
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try { v.pause(); } catch(e){}
      v.removeAttribute('autoplay');
      return;
    }
  
    function runCycle() {
      // If metadata not ready, wait
      if (!isFinite(v.duration) || v.duration === 0) {
        v.addEventListener('loadedmetadata', runCycle, { once: true });
        nudgePlay();
        return;
      }
  
      const dur = v.duration;
  
      // Option A (default): keep natural speed, wait remaining time
      v.playbackRate = 1;
  
      // If the video is *longer* than 45s, cut it at 45s then restart
      if (dur > TARGET) {
        const stopAt = () => {
          if (v.currentTime >= TARGET) {
            v.removeEventListener('timeupdate', stopAt);
            v.pause();
            // Freeze on last shown frame
            v.currentTime = TARGET - 0.001;
            // Immediately start next cycle
            setTimeout(runCycle, 0);
          }
        };
        v.currentTime = 0;
        v.addEventListener('timeupdate', stopAt);
        nudgePlay();
        return;
      }
  
      // Normal case: play to end, then hold to reach TARGET seconds
      v.currentTime = 0;
      nudgePlay();
  
      v.onended = () => {
        // Hold the last frame (avoid snapping to 0 on some iOS builds)
        try { v.pause(); } catch(e){}
        v.currentTime = Math.max(0, dur - 0.001);
  
        const holdMs = Math.max(0, (TARGET - dur) * 1000);
        setTimeout(runCycle, holdMs);
      };
    }
  
    runCycle();
  })();


  /* =========================================================
   Brand logo loop controller (desktop + mobile)
   ========================================================= */
(function () {
  const videos = Array.from(document.querySelectorAll(
    '#brandFx .brandFx__video, #brandFxMobile .brandFx__video'
  ));
  if (!videos.length) return;

  const TARGET = 45.0; // seconds — exact cycle per your desktop behavior

  const nudgePlay = v => v.play().catch(() => {});
  const gestureKick = () => {
    videos.forEach(nudgePlay);
    window.removeEventListener('touchstart', gestureKick, {passive:true});
    window.removeEventListener('pointerdown', gestureKick);
  };
  window.addEventListener('touchstart', gestureKick, { passive:true });
  window.addEventListener('pointerdown', gestureKick);

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    videos.forEach(v => { try { v.pause(); } catch(e){} v.removeAttribute('autoplay'); });
    return;
  }

  function runCycle(v){
    if (!v) return;
    v.loop = false;

    if (!isFinite(v.duration) || v.duration === 0) {
      v.addEventListener('loadedmetadata', () => runCycle(v), { once: true });
      nudgePlay(v);
      return;
    }

    const dur = v.duration;
    v.playbackRate = 1;

    if (dur > TARGET) {
      const stopAt = () => {
        if (v.currentTime >= TARGET) {
          v.removeEventListener('timeupdate', stopAt);
          v.pause();
          v.currentTime = TARGET - 0.001;
          setTimeout(() => runCycle(v), 0);
        }
      };
      v.currentTime = 0;
      v.addEventListener('timeupdate', stopAt);
      nudgePlay(v);
      return;
    }

    v.currentTime = 0;
    nudgePlay(v);

    v.onended = () => {
      try { v.pause(); } catch(e){}
      v.currentTime = Math.max(0, dur - 0.001); // hold last frame
      const holdMs = Math.max(0, (TARGET - dur) * 1000);
      setTimeout(() => runCycle(v), holdMs);
    };
  }

  videos.forEach(runCycle);
})();
