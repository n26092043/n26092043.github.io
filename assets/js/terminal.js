/*
 * Interactive terminal emulator for the research notebook.
 * Provides virtual unix-like commands against the generated site index.
 */
(function () {
  const body    = document.getElementById('term-body');
  const history = document.getElementById('term-history');
  const input   = document.getElementById('term-input');
  const caret   = document.getElementById('term-caret');
  const mirror  = document.getElementById('term-mirror');
  const cwdEl   = document.getElementById('term-cwd');
  if (!body || !input) return;

  let siteIndex = null;
  let cmdHistory = [];
  let histIdx = -1;

  // Load site index asynchronously
  fetch('/assets/data/index.json')
    .then((r) => r.json())
    .then((data) => { siteIndex = data; })
    .catch(() => {});

  const syncCaret = () => {
    if (!caret || !mirror) return;
    const pos = input.selectionStart == null ? input.value.length : input.selectionStart;
    mirror.textContent = input.value.slice(0, pos).replace(/ /g, '\u00a0') || '';
    caret.style.transform = `translateX(${mirror.offsetWidth}px)`;
  };

  input.addEventListener('input', syncCaret);
  input.addEventListener('click', syncCaret);
  input.addEventListener('keyup', syncCaret);

  body.addEventListener('click', () => {
    input.focus();
    syncCaret();
  });

  const printLine = (html, cls = '') => {
    const div = document.createElement('div');
    div.className = 'term-line ' + cls;
    div.innerHTML = html;
    history.appendChild(div);
    body.scrollTop = body.scrollHeight;
  };

  // Welcome banner
  printLine('<span class="term-dim">Research Notebook v1.0.0 (x86_64-apple-darwin)</span>');
  printLine('<span class="term-accent">Welcome! Type <span class="term-cmd">help</span> or <span class="term-cmd">ls</span> to explore topics and papers.</span>');

  const commands = {
    help: () => {
      return [
        '<b>Available commands:</b>',
        '  <span class="term-cmd">ls</span>          List available sections & directories',
        '  <span class="term-cmd">reading</span>     Show recent papers & topics',
        '  <span class="term-cmd">posts</span>       List recent reading notes & reviews',
        '  <span class="term-cmd">whoami</span>      Display author bio and research focus',
        '  <span class="term-cmd">theme</span>       Toggle light / dark mode',
        '  <span class="term-cmd">clear</span>       Clear terminal output'
      ].join('<br>');
    },

    ls: () => {
      return [
        '<span class="term-dir">reading/</span>   <span class="term-dir">posts/</span>   <span class="term-file">about.md</span>   <span class="term-file">_config.yml</span>'
      ].join('');
    },

    whoami: () => {
      if (!siteIndex || !siteIndex.site) return 'Researcher / Explorer';
      const a = siteIndex.site.author;
      return `<b>${a.name}</b> &lt;${a.email}&gt;<br><span class="term-dim">${a.bio || 'Machine Learning & Systems Researcher'}</span>`;
    },

    reading: () => {
      if (!siteIndex || !siteIndex.reading || siteIndex.reading.length === 0) {
        return 'No papers cataloged yet. Check <code>/reading/</code>.';
      }
      const lines = ['<b>Recent Papers on Reading List:</b>'];
      const items = siteIndex.reading.slice(0, 5);
      items.forEach((p) => {
        lines.push(`  <span class="term-accent">★</span> <a href="${p.url}" target="_blank" class="term-link">${p.title}</a> <span class="term-dim">[${p.venue || 'ArXiv'} ${p.year || ''}]</span>`);
      });
      lines.push('<span class="term-dim">Type or visit <a href="/reading/" class="term-link">/reading/</a> to see the full categorized catalog.</span>');
      return lines.join('<br>');
    },

    posts: () => {
      if (!siteIndex || !siteIndex.posts || siteIndex.posts.length === 0) {
        return 'No in-depth posts yet. Visit <a href="/posts/" class="term-link">/posts/</a>.';
      }
      const lines = ['<b>Published Paper Reviews:</b>'];
      siteIndex.posts.forEach((p) => {
        lines.push(`  <span class="term-dim">${p.date.slice(0, 10)}</span> <a href="${p.url}" class="term-link">${p.title}</a>`);
      });
      return lines.join('<br>');
    },

    theme: () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme-v2', next); } catch (e) {}
      return `Switched color theme to <b>${next}</b>.`;
    },

    clear: () => {
      history.innerHTML = '';
      return '';
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      input.value = '';
      syncCaret();

      if (!val) return;

      cmdHistory.push(val);
      histIdx = cmdHistory.length;

      // Print prompt echo
      printLine(`<span class="term-prompt">~ $</span> ${escapeHtml(val)}`);

      const [cmd, ...args] = val.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];

      if (fn) {
        const out = fn(args);
        if (out) printLine(out);
      } else {
        printLine(`command not found: ${escapeHtml(cmd)}. Type <span class="term-cmd">help</span> for commands.`, 'term-err');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0 && histIdx > 0) {
        histIdx--;
        input.value = cmdHistory[histIdx];
        syncCaret();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx < cmdHistory.length - 1) {
        histIdx++;
        input.value = cmdHistory[histIdx];
      } else {
        histIdx = cmdHistory.length;
        input.value = '';
      }
      syncCaret();
    }
  });

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }
})();
