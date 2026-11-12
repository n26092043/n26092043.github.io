(function () {
  // ---- Reading progress bar ------------------------------------------------
  const bar = document.getElementById('reading-progress-bar');
  if (bar) {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (h.scrollTop / max) * 100)) : 0;
      bar.style.width = pct + '%';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const content = document.querySelector('.post-content');
  const tocEl = document.getElementById('toc-target');

  // ---- TOC: build from h2/h3 in the rendered content -----------------------
  function buildToc() {
    if (!tocEl || !content) return;
    const aside = tocEl.closest('.toc-aside');
    tocEl.innerHTML = '';

    const headings = content.querySelectorAll('h2, h3');
    if (!headings || headings.length === 0) {
      if (aside) aside.style.display = 'none';
      return;
    }
    if (aside) aside.style.display = '';

    const slugify = (s) =>
      s
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    const tocItems = [];
    const seen = {};
    headings.forEach((h) => {
      if (!h.id) {
        let base = slugify(h.textContent) || 'section';
        if (seen[base] != null) {
          seen[base] += 1;
          base = base + '-' + seen[base];
        } else {
          seen[base] = 0;
        }
        h.id = base;
      }
      const link = document.createElement('a');
      link.href = '#' + h.id;
      link.textContent = h.textContent;
      link.classList.add('lvl-' + h.tagName.charAt(1));
      tocEl.appendChild(link);
      tocItems.push({ link, target: h });
    });

    // ---- Scroll-spy: highlight current heading -----------------------------
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const id = e.target.id;
          const item = tocItems.find((t) => t.target.id === id);
          if (!item) return;
          if (e.isIntersecting) {
            tocItems.forEach((t) => t.link.classList.remove('is-active'));
            item.link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-100px 0px -65% 0px', threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
  }

  buildToc();

  // If MathJax updates headings dynamically, re-run TOC builder
  if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
    window.MathJax.startup.promise.then(buildToc).catch(function () {});
  }
})();
