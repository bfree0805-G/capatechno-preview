/* ============================================================
 * キャパテクノ テーマ
 * ①ヘッダーの高さ計測 ②事業スイッチの表示 ③螺旋ヒーロー（トップのみ）
 * ④ROI試算 ⑤数字のカウントアップ
 * 螺旋ヒーローは brand-v2/prototypes/plan-b2.html の承認版（2026-09-02）を移植。
 * 確認用のURLパラメータ（?frame= ?spread= ?blur= ?motion=）は外した。
 * ============================================================ */
(function () {
  'use strict';
  var $ = function (q, r) { return (r || document).querySelector(q); };
  var $$ = function (q, r) { return Array.prototype.slice.call((r || document).querySelectorAll(q)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ① ヘッダーと事業スイッチの高さ ---------- */
  var hd = $('.hd'), dsw = $('#dsw');
  function measure() {
    var r = document.documentElement.style;
    if (hd) r.setProperty('--hd-h', hd.offsetHeight + 'px');
    if (dsw) {
      var fixed = getComputedStyle(dsw).position === 'fixed';
      dsw.style.top = fixed && hd ? hd.getBoundingClientRect().bottom + 'px' : '';
      r.setProperty('--dsw-h', !fixed || dsw.classList.contains('dsw--front') ? '0px' : dsw.offsetHeight + 'px');
    }
  }
  measure();
  window.addEventListener('resize', measure);
  if (window.ResizeObserver && hd) new ResizeObserver(measure).observe(hd);

  /* ---------- ② トップ：ヒーローを過ぎたら事業スイッチを出す ---------- */
  var heroEl = $('#hero');
  if (dsw && dsw.classList.contains('dsw--front') && heroEl) {
    var tick = false;
    var onScroll = function () {
      dsw.classList.toggle('is-show', heroEl.getBoundingClientRect().bottom <= 8);
    };
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; onScroll(); }); }
    }, { passive: true });
    onScroll();
  }

  /* ---------- ③ 螺旋ヒーロー ---------- */
  var stage = $('#stage');
  if (stage && heroEl) {
    var base = heroEl.getAttribute('data-assets');
    var TAGS = ['aero-air', 'aero-engine', 'auto-car', 'auto-engine'];
    var items = [];
    for (var i = 0; i < 5; i++) {
      for (var t = 0; t < 4; t++) {
        if ((i + t) % 2) { continue; } // 写真は1枚おきに10枚（2026-09-17 Toshiさん指示：20枚→10枚）
        items.push(base + 'process/' + TAGS[t] + '-0' + [1, 3, 5, 7, 9][i] + '.jpg');
      }
    }
    var finals = [
      { src: heroEl.getAttribute('data-photo-gap') || base + 'product/gapman-hero.jpg', en: 'GAPMAN', ja: '見えない隙間', cls: 'is-gap', href: heroEl.getAttribute('data-gapman') },
      { src: heroEl.getAttribute('data-photo-hyp') || base + 'product/hyperthermia-hero.jpg', en: 'HYPERTHERMIA', ja: '見えない熱', cls: 'is-hyp', href: heroEl.getAttribute('data-hyper') }
    ];

    var nodes = items.map(function (src, idx) {
      var el = document.createElement('div');
      el.className = 'tile';
      var img = document.createElement('img');
      img.src = src; img.alt = ''; img.decoding = 'async';
      el.appendChild(img);
      stage.appendChild(el);
      return { el: el, i: idx };
    });
    var finalStage = $('#finalStage');
    var finalEls = finals.map(function (f, idx) {
      var a = document.createElement('a');
      a.className = 'tile tile--final ' + f.cls;
      a.href = f.href;
      a.setAttribute('aria-label', f.en + '（' + f.ja + '）のページへ');
      a.innerHTML = '<img src="' + f.src + '" alt=""><span class="tile__chip">' + f.en + '</span>';
      a.style.zIndex = idx === 0 ? 2 : 1;
      finalStage.appendChild(a);
      return a;
    });

    var W, H, start = null, DUR = 2000; // 全体の長さ（2026-09-17 Toshiさん指示：9.6秒→3秒→2秒）
    var size = function () { W = stage.offsetWidth; H = stage.offsetHeight; };
    size();

    var place = function (el, x, y, s, rot, op, w, hr) {
      el.style.width = w + 'px';
      el.style.height = (w * (hr || 0.72)) + 'px';
      el.style.opacity = op;
      el.style.transform = 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + s + ')';
    };
    // 上の資格の帯と下の入口の帯のあいだに、2枚を収める（2026-09-14：上下の余白を活かす）
    var bounds = function () {
      var t = $('.hero__top', heroEl), b = $('.hero__bottom', heroEl);
      if (t && !t.offsetHeight) { t = null; } // 縦の短いスマホでは資格の帯を出さない（CSS）
      var top = t ? t.offsetTop + t.offsetHeight + 18 : (hd ? hd.offsetHeight : 64) + 18;
      var bot = b ? b.offsetTop - 18 : H - 24;
      return { top: top, bot: Math.max(bot, top + 160) };
    };
    var landing = function () {
      var B = bounds(), avail = B.bot - B.top;
      if (W < 900) {
        var fwN = Math.min(W * 0.42, 280, avail * 0.42 / 1.3333);
        // 画面の縦が短いスマホでは2枚が小さくなりすぎるため出さない（下の入口ボタンで選べる）
        var copyEl = $('.hero__copy', heroEl), copyH = copyEl ? copyEl.offsetHeight : 0;
        var roomless = B.bot - fwN * 1.3333 - copyH - 28 < B.top; // 見出しと2枚が縦に収まらない
        return { fw: fwN, x: fwN * 0.54, y: B.bot - fwN * 1.3333 / 2 - H / 2, stack: true, top: B.top, bot: B.bot, hide: fwN < 96 || roomless };
      }
      var fw = Math.min(W * 0.25, 420, avail * 0.94 / 1.3333);
      return { fw: fw, x: W * 0.5 - fw * 0.5 - Math.max(W * 0.024, 26), y: (B.top + B.bot) / 2 - H / 2, stack: false, top: B.top };
    };

    var settled = false;
    var settle = function () {
      settled = true;
      var L = landing();
      finalEls.forEach(function (el, idx) {
        place(el, (idx === 0 ? -1 : 1) * L.x, L.y, 1, 0, L.hide ? 0 : 1, L.fw, 1.3333);
        el.style.visibility = L.hide ? 'hidden' : '';
        el.style.filter = '';
        el.style.transition = 'transform .38s cubic-bezier(.34,1.02,.42,1), opacity .3s, filter .3s';
      });
      nodes.forEach(function (n) { n.el.style.transition = 'opacity .7s'; n.el.style.opacity = 0; });

      var copy = $('.hero__copy', heroEl);
      var t1 = copy ? $('.hero__t', copy) : null;
      if (copy && !L.stack) {
        var gapW = 2 * L.x - L.fw - 40;
        copy.style.paddingInline = '0';
        copy.style.maxInlineSize = gapW + 'px';
        copy.style.fontSize = '';
        if (t1) {
          t1.style.fontSize = '';
          var nat = parseFloat(getComputedStyle(t1).fontSize);
          t1.style.fontSize = Math.min(nat, gapW / 8.4) + 'px';
        }
        copy.style.transition = 'transform .5s cubic-bezier(.22,.9,.28,1)';
        copy.style.transform = 'translateY(' + Math.round(L.y) + 'px)';
      } else if (copy) {
        copy.style.maxInlineSize = ''; copy.style.paddingInline = '';
        if (t1) t1.style.fontSize = '';
        var copyH = copy.offsetHeight;
        var fh = L.fw * 1.3333;
        var imgTop = L.hide ? L.bot : H / 2 + L.y - fh / 2;
        var want = L.hide ? L.top + Math.max(0, (L.bot - L.top - copyH) / 2) : imgTop - copyH - 28;
        var minTop = L.top;
        if (want < minTop) {
          var scale = Math.max(0.70, (imgTop - minTop - 28) / copyH);
          copy.style.fontSize = (scale * 100) + '%';
          want = minTop;
        }
        // いまの位置（移動前）を実測して、目標の位置との差だけ動かす
        copy.style.transition = 'none'; copy.style.transform = 'none';
        var curTop = copy.getBoundingClientRect().top - stage.getBoundingClientRect().top;
        var shift = want - curTop;
        copy.style.transition = 'transform .7s cubic-bezier(.16,.8,.24,1)';
        copy.style.transform = 'translateY(' + Math.round(shift) + 'px)';
      }
      heroEl.classList.add('is-settled');
    };

    window.addEventListener('resize', function () { size(); if (settled) settle(); });

    if (reduce) {
      nodes.forEach(function (n) { n.el.style.display = 'none'; });
      settle();
    } else {
      nodes.forEach(function (n, idx) { place(n.el, (idx % 2 ? 1 : -1) * W * 0.52, -H * 0.46, 1, 0, 0, 46); });
      finalEls.forEach(function (el) { place(el, 0, 0, 0.2, 0, 0, 120, 1.3333); });

      var draw = function (tt) {
        var ease = 1 - Math.pow(1 - tt, 1.35);
        var L = landing();
        nodes.forEach(function (n) {
          var phase = n.i / nodes.length;
          var local = Math.max(0, Math.min((ease - phase * 0.62) / 0.38, 1));
          if (local <= 0) { n.el.style.opacity = 0; return; }
          var w = 46 + local * (L.fw - 46);
          var lp = 1 - Math.pow(1 - local, 1.28);
          var op = (lp < 0.08 ? lp / 0.08 : 1) * (lp > 0.72 ? Math.max(0, 1 - (lp - 0.72) / 0.28) : 1) * 0.94;
          var ang = lp * Math.PI * 2 * 2.6 + phase * Math.PI * 2;
          var SPREAD = W > 900 ? 1.85 : 1.30;
          var OUT = 0.72, radK;
          if (lp < OUT) { radK = 1 - (lp / OUT) * 0.66; } else { var k = (lp - OUT) / (1 - OUT); radK = 0.34 + k * k * 1.75; }
          var rad = radK * Math.min(W, H) * 0.50;
          var x = Math.cos(ang) * rad * SPREAD;
          var y = Math.sin(ang) * rad * 0.60 - lp * H * 0.06;
          var rot = (1 - lp) * 26 * (n.i % 2 ? 1 : -1);
          var outK = Math.max(0, (lp - OUT) / (1 - OUT));
          n.el.style.filter = outK > 0 ? 'blur(' + (outK * 14).toFixed(1) + 'px)' : '';
          place(n.el, x, y, 1, rot, op, w);
        });
        finalEls.forEach(function (el, idx) {
          var local = Math.max(0, Math.min((ease - 0.74) / 0.26, 1));
          if (local <= 0 || L.hide) { el.style.opacity = 0; return; }
          var e = local * local * (3 - 2 * local);
          var x = (idx === 0 ? -1 : 1) * (L.x * (1.16 - e * 0.16));
          el.style.filter = local < 1 ? 'blur(' + ((1 - e) * 10).toFixed(1) + 'px)' : '';
          place(el, x, L.y, 1, 0, Math.min(local * 1.6, 1), L.fw * (0.94 + e * 0.06), 1.3333);
        });
      };
      var frame = function (ts) {
        if (settled) return;
        if (start === null) start = ts;
        var tt = Math.min((ts - start) / DUR, 1);
        draw(tt);
        if (tt < 1) requestAnimationFrame(frame); else setTimeout(settle, 110);
      };
      requestAnimationFrame(frame);
      // 裏のタブで開かれると描画が止まるため、時間が来たら必ず完成形にする
      setTimeout(function () { if (!settled) settle(); }, DUR + 1500);
    }
  }

  /* ---------- 動画：押したときに初めて YouTube を読み込む（表示を軽く・プライバシー強化モード） ---------- */
  $$('.yt[data-yt]').forEach(function (box) {
    var link = $('.yt__link', box);
    if (!link) { return; }
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var id = box.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
      f.title = ($('.yt__thumb', box) || {}).alt || '動画';
      f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.replaceChild(f, link);
    });
  });

  /* ---------- ④ ROI：自社の条件で試算 ---------- */
  // 計算式は assets/js/roi.js の ctRoi（箇所数 × 短縮時間 × 作業人数 × 作業単価）
  var n = $('#roiN'), p = $('#roiP'), w = $('#roiW'), oh = $('#roiH'), om = $('#roiM'), oy = $('#roiY');
  if (n && p && w && oh && oy && typeof ctRoi === 'function') {
    var form = n.closest('.roi__f');
    var minutes = form ? form.getAttribute('data-minutes') : '9.5';
    var calc = function () {
      var r = ctRoi({ points: n.value, people: p.value, wage: w.value, minutes: minutes });
      oh.textContent = r.hours.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
      if (om) { om.textContent = r.personHours.toLocaleString('ja-JP', { maximumFractionDigits: 0 }); }
      oy.textContent = r.yen.toLocaleString('ja-JP');
    };
    [n, p, w].forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }

  /* ---------- ⑤ 数字のカウントアップ・棒グラフ（画面に入ったときだけ） ---------- */
  var bars = $$('.roi__bar i');
  if (!reduce && window.IntersectionObserver) {
    bars.forEach(function (b) { b.dataset.w = b.style.getPropertyValue('--w'); b.style.setProperty('--w', '0%'); });
    var countUp = function (el) {
      var goal = parseFloat(el.getAttribute('data-count'));
      if (!isFinite(goal) || !el.firstChild) return;
      var t0 = null;
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1100);
        el.firstChild.nodeValue = Math.round(goal * (1 - Math.pow(1 - k, 3))).toLocaleString('ja-JP');
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (e.target.matches('.roi__v')) countUp(e.target);
        if (e.target.matches('.roi__bar')) $$('i', e.target).forEach(function (i) { i.style.setProperty('--w', i.dataset.w || '0%'); });
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    $$('.roi__v[data-count], .roi__bar').forEach(function (el) { io.observe(el); });
  }

  /* ---------- 送信エラーがあれば、その場所へ移動 ---------- */
  var err = $('.form__err');
  if (err) { err.scrollIntoView({ block: 'start' }); err.focus({ preventScroll: true }); }
})();
