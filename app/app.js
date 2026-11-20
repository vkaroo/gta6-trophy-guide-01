// Leonida Legend — offline GTA 6 trophy tracker.
// Loads app/data/trophies.json, renders the checklist, and keeps progress
// in localStorage. No network requests besides the local data file.
(function () {
  'use strict';

  var EARNED_KEY = 'leonida-legend-earned-v1';
  var SPOILER_KEY = 'leonida-legend-spoilers-v1';
  var TOTAL = 55;
  var RING_C = 2 * Math.PI * 52;

  var listEl = document.getElementById('trophyList');
  var statusEl = document.getElementById('statusLine');
  var emptyEl = document.getElementById('emptyMsg');
  var searchEl = document.getElementById('search');
  var sortEl = document.getElementById('sort');
  var chipsEl = document.getElementById('filterChips');
  var spoilerEl = document.getElementById('spoilerToggle');
  var earnedCountEl = document.getElementById('earnedCount');
  var ringFgEl = document.getElementById('ringFg');
  var barFillEl = document.getElementById('barFill');
  var gradeCountsEl = document.getElementById('gradeCounts');
  var progressPillEl = document.getElementById('progressPill');
  var roadmapEl = document.getElementById('roadmap');
  var missableBannerEl = document.getElementById('missableBanner');
  var platinumSubEl = document.getElementById('platinumSub');

  var trophies = [];
  var roadmap = [];
  var earned = new Set();
  var spoilersHidden = false;
  var filter = 'all';
  var demoEarned = null; // in-memory demo progress for screenshots (?shot=...)

  var FILTERS = [
    ['all', 'All 55'],
    ['story', 'Story'],
    ['missable', 'Missable'],
    ['collectibles', 'Collectibles'],
    ['activities', 'Activities'],
    ['completion', 'Completion'],
    ['online', 'Online'],
    ['earned', 'Earned'],
    ['remaining', 'Remaining']
  ];

  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
  var KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', completion: 'Completion', online: 'Online' };

  function loadStored() {
    try {
      var raw = localStorage.getItem(EARNED_KEY);
      if (raw) {
        JSON.parse(raw).forEach(function (id) { earned.add(id); });
      }
    } catch (e) { /* corrupted storage: start fresh */ }
    try {
      spoilersHidden = localStorage.getItem(SPOILER_KEY) === '1';
    } catch (e) { spoilersHidden = false; }
  }

  function saveStored() {
    try {
      localStorage.setItem(EARNED_KEY, JSON.stringify(Array.from(earned).sort(function (a, b) { return a - b; })));
      localStorage.setItem(SPOILER_KEY, spoilersHidden ? '1' : '0');
    } catch (e) { /* storage unavailable (file:// in some browsers): keep in memory */ }
  }

  function earnedSet() {
    return demoEarned || earned;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function isSpoilerHidden(t) {
    return spoilersHidden && t.kind === 'story' && !earnedSet().has(t.id);
  }

  function matchesFilter(t) {
    var has = earnedSet().has(t.id);
    switch (filter) {
      case 'all': return true;
      case 'story': return t.kind === 'story';
      case 'missable': return !!t.missable;
      case 'collectibles': return t.kind === 'collectibles';
      case 'activities': return t.kind === 'activities';
      case 'completion': return t.kind === 'completion';
      case 'online': return t.kind === 'online';
      case 'earned': return has;
      case 'remaining': return !has;
      default: return true;
    }
  }

  function matchesSearch(t) {
    var q = searchEl.value.trim().toLowerCase();
    if (!q) return true;
    var hay = [t.name, t.description, t.guide, t.target || '', KIND_LABEL[t.kind] || '', t.grade].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function sortTrophies(list) {
    var mode = sortEl.value;
    var copy = list.slice();
    if (mode === 'grade') {
      copy.sort(function (a, b) { return GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id; });
    } else if (mode === 'name') {
      copy.sort(function (a, b) { return a.name.localeCompare(b.name); });
    } else if (mode === 'remaining') {
      copy.sort(function (a, b) { return (earnedSet().has(a.id) - earnedSet().has(b.id)) || a.stage - b.stage || a.id - b.id; });
    } else {
      copy.sort(function (a, b) { return a.stage - b.stage || a.id - b.id; });
    }
    return copy;
  }

  function renderProgress() {
    var n = earnedSet().size;
    var pct = Math.round((n / TOTAL) * 100);
    earnedCountEl.textContent = n;
    if (progressPillEl) progressPillEl.textContent = n + '/' + TOTAL + ' earned';
    ringFgEl.style.strokeDashoffset = String(RING_C * (1 - n / TOTAL));
    barFillEl.style.width = pct + '%';
    var counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    var totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) {
      totals[t.grade]++;
      if (earnedSet().has(t.id)) counts[t.grade]++;
    });
    gradeCountsEl.textContent = 'Platinum ' + counts.platinum + '/' + totals.platinum +
      ' · Gold ' + counts.gold + '/' + totals.gold +
      ' · Silver ' + counts.silver + '/' + totals.silver +
      ' · Bronze ' + counts.bronze + '/' + totals.bronze;
    platinumSubEl.textContent = n >= TOTAL
      ? 'Platinum earned — you are a Leonida Legend.'
      : (TOTAL - n) + ' to go. The next step is in the roadmap below.';
  }

  function renderRoadmap() {
    roadmapEl.textContent = '';
    roadmap.forEach(function (step) {
      var card = el('article', 'stage-card');
      var n = trophies.filter(function (t) { return t.stage === step.stage; }).length;
      var done = trophies.filter(function (t) { return t.stage === step.stage && earnedSet().has(t.id); }).length;
      card.appendChild(el('p', 'stage-num', 'Stage ' + step.stage + ' · ' + done + '/' + n + ' earned'));
      card.appendChild(el('h3', null, step.title.replace(/^Stage \d+ — /, '')));
      card.appendChild(el('p', null, step.text));
      roadmapEl.appendChild(card);
    });
    var missable = trophies.filter(function (t) { return t.missable; });
    missableBannerEl.textContent = '';
    var warn = el('strong', null, '⚠ Only one potentially missable trophy: ');
    missableBannerEl.appendChild(warn);
    missable.forEach(function (t, i) {
      if (i) missableBannerEl.appendChild(document.createTextNode(', '));
      missableBannerEl.appendChild(el('strong', null, t.name));
    });
    missableBannerEl.appendChild(document.createTextNode(
      ' — do the Chapter 1 balcony meditation before Chapter 1 ends. Everything else can be finished in free roam after the story.'));
  }

  function renderChips() {
    chipsEl.textContent = '';
    FILTERS.forEach(function (pair) {
      var btn = el('button', 'chip' + (filter === pair[0] ? ' active' : ''), pair[1]);
      btn.type = 'button';
      btn.setAttribute('aria-pressed', filter === pair[0] ? 'true' : 'false');
      btn.addEventListener('click', function () {
        filter = pair[0];
        renderChips();
        renderList();
      });
      chipsEl.appendChild(btn);
    });
  }

  function trophyCard(t) {
    var has = earnedSet().has(t.id);
    var hidden = isSpoilerHidden(t);
    var li = el('li', 'trophy' + (has ? ' earned' : '') + (t.missable ? ' missable' : ''));
    li.dataset.id = t.id;

    var check = el('label', 'check');
    var box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = has;
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('change', function () {
      if (demoEarned) demoEarned = null; // a real tick leaves demo mode
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveStored();
      renderProgress();
      renderRoadmap();
      renderList();
    });
    check.appendChild(box);
    check.appendChild(el('span', 'box-mark', '✓'));
    li.appendChild(check);

    var body = el('div', 'trophy-body');
    var head = el('div', 'trophy-head');
    var badge = el('span', 'grade grade-' + t.grade, GRADE_LABEL[t.grade]);
    head.appendChild(badge);
    head.appendChild(el('span', 'kind', KIND_LABEL[t.kind] || t.kind));
    if (t.hidden) head.appendChild(el('span', 'hidden-tag', 'Hidden on PSN'));
    if (t.missable) head.appendChild(el('span', 'missable-tag', '⚠ Potentially missable'));
    if (t.target) head.appendChild(el('span', 'target', t.target));
    body.appendChild(head);

    body.appendChild(el('h3', 'trophy-name', hidden ? 'Hidden story trophy — earn it to reveal' : t.name));
    body.appendChild(el('p', 'trophy-desc', hidden ? 'Its name and description stay hidden until you earn it.' : t.description));

    var details = document.createElement('details');
    details.className = 'guide';
    if (!has && t.id === 28 && new URLSearchParams(location.search).get('shot') === 'cover') details.open = true;
    var summary = el('summary', null, has ? 'Guide — earned ✓' : 'Guide & how to unlock');
    details.appendChild(summary);
    if (!hidden) {
      details.appendChild(el('p', null, t.guide));
      var src = el('p', 'guide-sources');
      src.appendChild(el('strong', null, 'Sources: '));
      t.sources.forEach(function (s, i) {
        if (i) src.appendChild(document.createTextNode(' · '));
        var a = document.createElement('a');
        a.href = s.url;
        a.rel = 'noopener';
        a.textContent = s.name;
        src.appendChild(a);
      });
      details.appendChild(src);
    } else {
      details.appendChild(el('p', null, 'Earn this trophy in-game to reveal its guide here.'));
    }
    body.appendChild(details);
    li.appendChild(body);
    return li;
  }

  function renderList() {
    var shown = sortTrophies(trophies.filter(function (t) { return matchesFilter(t) && matchesSearch(t); }));
    listEl.textContent = '';
    shown.forEach(function (t) { listEl.appendChild(trophyCard(t)); });
    emptyEl.hidden = shown.length !== 0;
    var total = trophies.filter(matchesFilter).length;
    statusEl.textContent = shown.length + ' of ' + total + ' trophies shown' +
      (searchEl.value.trim() ? ' for “' + searchEl.value.trim() + '”' : '') +
      (filter === 'online' ? ' — there are no online trophies: all 55 are single-player and offline.' : '') +
      '. Progress saves automatically in this browser.';
  }

  function exportProgress() {
    var payload = {
      app: 'leonida-legend-gta6-trophy-guide',
      exportedAt: new Date().toISOString(),
      earned: Array.from(earned).sort(function (a, b) { return a - b; })
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gta6-trophy-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    statusEl.textContent = 'Progress exported (' + payload.earned.length + ' earned) as gta6-trophy-progress.json.';
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var ids = Array.isArray(data) ? data : data.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        var valid = new Set(trophies.map(function (t) { return t.id; }));
        var imported = ids.filter(function (id) { return valid.has(id); });
        demoEarned = null;
        earned = new Set(imported);
        saveStored();
        renderProgress();
        renderRoadmap();
        renderList();
        statusEl.textContent = 'Imported ' + imported.length + ' earned trophies from ' + file.name + '.';
      } catch (e) {
        statusEl.textContent = 'That file could not be imported — it is not a progress file from this tracker.';
      }
    };
    reader.readAsText(file);
  }

  function applyShotScene() {
    var shot = new URLSearchParams(location.search).get('shot');
    if (!shot) return;
    if (shot === 'cover') {
      // Demo progress: the story through Chapter 4 plus two early activities,
      // so the cover shows a real-looking partial run with the missable guide open.
      demoEarned = new Set([2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 20, 21, 35, 47]);
      filter = 'all';
    } else if (shot === 'roadmap') {
      demoEarned = new Set([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
    } else if (shot === 'spoiler') {
      spoilersHidden = true;
      spoilerEl.checked = true;
      demoEarned = new Set([2, 20, 21]);
      filter = 'story';
    } else if (shot === 'search') {
      demoEarned = new Set([2, 3, 4, 5, 6, 8, 9, 10, 11, 12]);
      filter = 'missable';
      searchEl.value = 'meditat';
    }
    renderChips();
  }

  // After the first render, move the viewport to the scene a screenshot
  // wants to show. The toolbar is sticky, so the filters stay visible.
  function scrollToScene() {
    var shot = new URLSearchParams(location.search).get('shot');
    if (!shot) return;
    setTimeout(function () {
      if (shot === 'cover') {
        var card = document.querySelector('.trophy[data-id="28"]');
        if (card) {
          card.scrollIntoView({ block: 'start' });
          window.scrollBy(0, -150);
        }
      } else if (shot === 'roadmap') {
        document.getElementById('roadmapPanel').scrollIntoView();
      } else if (shot === 'spoiler' || shot === 'search') {
        document.getElementById('trackerTitle').scrollIntoView();
        window.scrollBy(0, -8);
      }
    }, 80);
  }

  function wireEvents() {
    searchEl.addEventListener('input', renderList);
    sortEl.addEventListener('change', renderList);
    spoilerEl.addEventListener('change', function () {
      spoilersHidden = spoilerEl.checked;
      saveStored();
      renderList();
    });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('importFile').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) importProgress(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('resetBtn').addEventListener('click', function () {
      if (window.confirm('Clear all earned trophies? This cannot be undone.')) {
        demoEarned = null;
        earned = new Set();
        saveStored();
        renderProgress();
        renderRoadmap();
        renderList();
        statusEl.textContent = 'Progress reset — 0 of 55 earned.';
      }
    });
  }

  function ready() {
    ringFgEl.style.strokeDasharray = String(RING_C);
    ringFgEl.style.strokeDashoffset = String(RING_C);
    loadStored();
    spoilerEl.checked = spoilersHidden;
    wireEvents();
    fetch('data/trophies.json')
      .then(function (res) {
        if (!res.ok) throw new Error('trophies.json failed to load');
        return res.json();
      })
      .then(function (data) {
        trophies = data.trophies || [];
        roadmap = data.roadmap || [];
        applyShotScene();
        renderChips();
        renderProgress();
        renderRoadmap();
        renderList();
        scrollToScene();
        window.__shotReady = true;
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not load the trophy data. Open this page from the app/ folder so data/trophies.json can be read.';
        window.__shotReady = true;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
