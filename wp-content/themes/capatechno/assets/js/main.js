/* ============================================================
 * キャパテクノ テーマ
 * ①ヘッダーの高さ計測 ②事業スイッチの表示 ③ヒーロー（トップのみ・2026-09-27 作り直し）
 * ④ROI試算 ⑤数字のカウントアップ
 * 旧・螺旋ヒーローは Gitタグ capatechno-hero-spiral-fixed-2026-09-17 ／ before-hero-v3-2026-09-27 に残っている。
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

  /* ---------- ③ ヒーロー（2026-09-27 作り直し） ----------
   * ・幕開けの数字（0.000 → 0.312 mm）を数える。幕そのものは CSS だけで動く
   * ・GAPMANの場面：12業種の写真が製品のうしろを渦を巻いて昇る「竜巻」（業種名つき・読める速さ）。飾りなので読み上げ・Tab移動の対象外
   * ・製品の切り替え（2〜4件）：下の並びのボタン。3.5秒ごとに自動で次へ（2026-09-27 Toshiさん指示：9秒→4.5秒→3.5秒。飽きない速さ）
   *   止まる条件：ヒーローにマウスを乗せている／中にキーボードの焦点がある／画面の外／裏のタブ／「動きを止める」を押した
   *   ボタンで製品を選んだら、それ以降は自動で切り替えない
   * ・動きを減らす設定の人には、幕開け・自動切り替え・回転をしない
   * ・1本の requestAnimationFrame で「竜巻」と「自動切り替えの残り時間」をまとめて進め、動かす物が無いときは止める
   */
  var hx = $('#hero.hx');
  if (hx) {
    try { sessionStorage.setItem('ctHxSeen', '1'); } catch (e) {}
    hx.classList.add('is-js');
    var seen = hx.classList.contains('hx--seen');

    // 幕開けの数字
    var readout = $('.hx__read b', hx);
    if (readout && !seen && !reduce) {
      var goal = parseFloat(readout.getAttribute('data-to')) || 0, r0 = null;
      var count = function (ts) {
        if (r0 === null) r0 = ts;
        var k = Math.min(1, Math.max(0, (ts - r0 - 450) / 650));
        readout.textContent = (goal * (1 - Math.pow(1 - k, 3))).toFixed(3);
        if (k < 1) requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    } else if (readout) { readout.textContent = readout.getAttribute('data-to'); }

    var tabs = $$('.hx__tab', hx), scenes = $$('.hx__scene', hx), cur = 0;
    var stillBtn = $('.hx__still', hx);
    var st = { visible: true, hidden: document.hidden, hover: false, focus: false, still: false, chose: false, elapsed: 0, started: false };
    var DWELL = 3500;
    var running = false, last = null;
    var wake = function () {};

    // 12業種の竜巻
    var orbit = $('.hx__orbit', hx);
    var chips = orbit ? $$('.hx__chip', orbit) : [];
    var orb = { phase: 0, speed: 1, hover: false, grow: seen ? 1 : 0, birth: null };
    var L = null, RISE = 40000, NS = 'http://www.w3.org/2000/svg';
    var funnel = function (G) {
      var svg = $('.hx__funnel', orbit.parentNode);
      if (!svg) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'hx__funnel'); svg.setAttribute('aria-hidden', 'true'); orbit.parentNode.insertBefore(svg, orbit); }
      svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      for (var j = 0; j <= 7; j++) {
        var p = j / 7, R = G.r0 + (G.r1 - G.r0) * Math.pow(p, 0.8);
        var el = document.createElementNS(NS, 'ellipse');
        el.setAttribute('cx', G.W / 2); el.setAttribute('cy', G.bot - p * (G.bot - G.top));
        el.setAttribute('rx', R); el.setAttribute('ry', R * G.tilt);
        el.setAttribute('pathLength', '240');
        el.style.animationDuration = (14 + j * 3) + 's';
        svg.appendChild(el);
      }
    };
    var layout = function () {
      if (!orbit) return null;
      var box = orbit.parentNode, W = box.offsetWidth, H = box.offsetHeight;
      if (!W || !H) return null; // 隠れている場面では測れない
      var cw = W < 420 ? 100 : W < 560 ? 120 : 148;
      orbit.style.setProperty('--cw', cw + 'px');
      var G = { W: W, H: H, cw: cw, ch: cw * 0.86, top: H * 0.1, bot: H * 0.84, tilt: 0.2,
        r0: Math.min(W * 0.1, 54), r1: Math.min(W * 0.5 - cw * 0.46, 330) };
      funnel(G);
      return G;
    };
    var smooth = function (a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    var drawOrbit = function () {
      if (!L) return;
      var n = chips.length, g = orb.grow;
      chips.forEach(function (c, i) {
        var p = (i / n + orb.phase) % 1;              // 0＝下で生まれる … 1＝上で消える
        var a = p * Math.PI * 2 * 1.6 + i * 0.35;      // 1.6回転しながら昇る
        var R = (L.r0 + (L.r1 - L.r0) * Math.pow(p, 0.8)) * (0.25 + 0.75 * g);
        var d = Math.sin(a), k = (d + 1) / 2;          // k：0＝奥 … 1＝手前
        var s = (0.56 + 0.4 * k) * (0.74 + 0.26 * p) * (0.5 + 0.5 * g);
        var x = L.W / 2 + Math.cos(a) * R - L.cw / 2;
        var y = L.bot - p * (L.bot - L.top) + d * R * L.tilt - L.ch / 2;
        var fade = smooth(0, 0.1, p) * (1 - smooth(0.86, 1, p));
        c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
        c.style.opacity = (g * fade * (0.3 + 0.55 * k)).toFixed(3);
        c.style.zIndex = Math.round(k * 10);
        c.style.visibility = fade < 0.02 ? 'hidden' : '';
      });
    };
    var orbitOn = function () { return !!orbit && !!scenes[cur] && scenes[cur].contains(orbit); };
    if (orbit && chips.length) {
      orbit.classList.add('is-live');
      L = layout();
      drawOrbit();
      orbit.addEventListener('mouseover', function (e) { if (e.target.closest('.hx__chip')) orb.hover = true; });
      orbit.addEventListener('mouseout', function (e) {
        var to = e.relatedTarget;
        if (!to || !to.closest || !to.closest('.hx__chip')) orb.hover = false;
      });
      window.addEventListener('resize', function () { L = layout(); drawOrbit(); });
    }

    // 製品の切り替え
    var autoOn = function () { return tabs.length > 1 && !st.still && !st.chose; };
    var counting = function () { return autoOn() && st.started && !st.hover && !st.focus && !st.hidden && st.visible; };
    var bar = function () {
      tabs.forEach(function (t, k) {
        var b = $('.hx__tab-bar', t);
        if (b) b.style.transform = k !== cur ? 'scaleX(0)' : 'scaleX(' + (autoOn() ? Math.min(1, st.elapsed / DWELL) : 1).toFixed(4) + ')';
      });
    };
    var setTone = function (i) { hx.classList.toggle('is-hyp', !!scenes[i] && scenes[i].classList.contains('is-hyp')); };
    var show = function (i, byUser) {
      if (i === cur || !scenes[i]) return;
      var prev = scenes[cur], next = scenes[i];
      tabs.forEach(function (t, k) {
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
        t.tabIndex = k === i ? 0 : -1;
      });
      prev.classList.remove('is-on', 'is-enter', 'is-first');
      next.classList.remove('is-leave');
      next.classList.add('is-on');
      if (!reduce && !st.still) {
        prev.classList.add('is-leave');
        void next.offsetWidth;
        next.classList.add('is-enter');
        setTimeout(function () { next.classList.remove('is-enter'); }, 950);
        setTimeout(function () { prev.classList.remove('is-leave'); }, 600);
      }
      cur = i;
      st.elapsed = 0;
      if (byUser) st.chose = true;
      setTone(i);
      if (orbitOn()) { L = layout(); drawOrbit(); }
      bar();
      wake();
    };

    // 1本のループ（動かす物が無ければ止まり、条件が変わったら wake() で再開）
    var needed = function () {
      if (st.hidden || !st.visible) return false;
      return counting() || (orbitOn() && !st.still);
    };
    var loop = function (ts) {
      if (!needed()) { running = false; last = null; return; }
      if (last === null) last = ts;
      var dt = Math.min(64, ts - last); last = ts;
      if (orbitOn() && !st.still && L) {
        if (orb.birth === null) orb.birth = ts + (seen ? 0 : 1400); // 幕が開くまで待つ
        var e = Math.min(1, Math.max(0, (ts - orb.birth) / 1800));
        orb.grow = seen ? 1 : Math.max(orb.grow, 1 - Math.pow(1 - e, 3));
        var boost = seen ? 0 : Math.pow(1 - e, 2) * 14; // 最初だけ速く巻き込む（竜巻の名残）
        orb.speed += ((orb.hover ? 0 : 1) - orb.speed) * Math.min(1, dt / 260);
        if (ts >= orb.birth) orb.phase = (orb.phase + dt / RISE * (orb.speed + boost)) % 1;
        drawOrbit();
      }
      if (counting()) {
        st.elapsed += dt;
        if (st.elapsed >= DWELL) show((cur + 1) % scenes.length, false);
        bar();
      }
      requestAnimationFrame(loop);
    };
    wake = function () { if (!running && needed()) { running = true; requestAnimationFrame(loop); } };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { st.chose = true; show(i, true); bar(); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (e.key === 'Home') { k = -i; }
        if (e.key === 'End') { k = tabs.length - 1 - i; }
        if (k === undefined) return;
        e.preventDefault();
        var j = (i + k + tabs.length) % tabs.length;
        show(j, true);
        tabs[j].focus();
      });
    });

    // 「動きを止める／動かす」（WCAG 2.2.2：自動で動く物は利用者が止められること）
    var setStill = function (on) {
      st.still = on;
      hx.classList.toggle('hx--still', on);
      if (stillBtn) {
        stillBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        var lab = $('.hx__still-t', stillBtn);
        if (lab) lab.textContent = on ? stillBtn.getAttribute('data-on') : stillBtn.getAttribute('data-off');
      }
      if (on && orbit) { orb.grow = 1; drawOrbit(); }
      bar(); wake();
    };
    if (stillBtn) stillBtn.addEventListener('click', function () { setStill(!st.still); });
    if (reduce) setStill(true);

    hx.addEventListener('mouseenter', function () { st.hover = true; });
    hx.addEventListener('mouseleave', function () { st.hover = false; wake(); });
    hx.addEventListener('focusin', function () { st.focus = true; });
    hx.addEventListener('focusout', function (e) { if (!hx.contains(e.relatedTarget)) { st.focus = false; wake(); } });
    document.addEventListener('visibilitychange', function () { st.hidden = document.hidden; wake(); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { st.visible = es[0].isIntersecting; wake(); }).observe(hx);
    }
    // 自動切り替えは幕開けが終わってから数え始める
    setTimeout(function () { st.started = true; bar(); wake(); }, seen ? 0 : 1800);
    setTone(0);
    bar();
    wake();
  }

  /* ---------- GAPMANページ：エンジン組立の映像（画面に入ったら再生・止めるボタン・動きを減らす設定では再生しない） ---------- */
  var engv = $('.engv');
  if (engv) {
    var vid = $('.engv__v', engv), vbtn = $('.engv__btn', engv), stopped = reduce;
    var sync = function () { if (vbtn) { vbtn.setAttribute('aria-pressed', stopped ? 'true' : 'false'); vbtn.textContent = stopped ? '映像を再生' : '映像を止める'; } };
    var tryPlay = function () { if (!stopped && vid.paused) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } };
    if (vbtn) vbtn.addEventListener('click', function () { stopped = !stopped; if (stopped) vid.pause(); else tryPlay(); sync(); });
    // 最後の約3秒（組み上がった瞬間）にロゴを浮かべる。くり返しで最初に戻ったら消す
    vid.addEventListener('timeupdate', function () {
      var d = vid.duration || 0;
      engv.classList.toggle('is-logo', d > 0 && d - vid.currentTime < 3.2);
    });
    sync();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) { vid.preload = 'auto'; tryPlay(); } else vid.pause(); }, { threshold: 0.25 }).observe(engv);
    }
  }

  /* ---------- 上へ戻るボタン：画面1枚分より下へ動かしたら出す。押すと先頭へ（動きを減らす設定では一瞬で） ---------- */
  var totop = $('.totop');
  if (totop) {
    totop.hidden = false;
    var tShow = function () { totop.classList.toggle('is-on', window.scrollY > window.innerHeight * 1.2); };
    window.addEventListener('scroll', tShow, { passive: true });
    tShow();
    totop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var first = $('.hd a');                       // キーボードの人は、先頭（ロゴ）から読み直せるように
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* ---------- GAPMANページ「仕組み」の映像：画面に入ったら再生・止めるボタン・動きを減らす設定では再生しない ---------- */
  var gapv = $('.gapv');
  if (gapv) {
    var gv = $('.gapv__v', gapv), gbtn = $('.gapv__btn', gapv), gStop = reduce;
    var gSync = function () { if (gbtn) { gbtn.setAttribute('aria-pressed', gStop ? 'true' : 'false'); gbtn.textContent = gStop ? '映像を再生' : '映像を止める'; } };
    var gPlay = function () { if (!gStop && gv.paused) { var pr = gv.play(); if (pr && pr.catch) pr.catch(function () {}); } };
    if (gbtn) gbtn.addEventListener('click', function () { gStop = !gStop; if (gStop) gv.pause(); else gPlay(); gSync(); });
    gSync();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) { gv.preload = 'auto'; gPlay(); } else gv.pause(); }, { threshold: 0.25 }).observe(gapv);
    }
  }

  /* ---------- ハイパーサーミア：動く図の「動きを止める」と、画面の外での一時停止 ---------- */
  var appr = $('.appr');
  if (appr) {
    var still = $('.heat__still', appr);
    if (still) {
      still.addEventListener('click', function () {
        var on = !appr.classList.contains('is-still');
        appr.classList.toggle('is-still', on);
        still.setAttribute('aria-pressed', on ? 'true' : 'false');
        var lab = $('.heat__still-t', still);
        if (lab) lab.textContent = still.getAttribute(on ? 'data-on' : 'data-off');
      });
    }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { appr.classList.toggle('is-off', !es[0].isIntersecting); }).observe(appr);
    }
  }

  /* ---------- ハイパーサーミア：もやの動画を、写真のパネルの中心に合わせて重ねる ----------
   * 動画は、装置の写真を高さ640pxで置いた 1280×720 の画面から、横380・縦0 を起点に 600×400 を切り出したもの。
   * 写真の表示の大きさに合わせて、同じ比率で位置と大きさを決める（パネルの中心＝写真の横81.3%・縦18.7%）。
   * 画面の外・裏のタブ・「動きを止める」・動きを減らす設定では再生しない */
  var hhzs = $$('.hhz');
  if (hhzs.length && !reduce) {
    var placeHz = function () {
      hhzs.forEach(function (v) {
        var box = v.parentNode, img = $('img', box);
        if (!img || !img.offsetHeight) return;
        if (box.classList.contains('is-enter')) return; // 登場の動きの途中は測らない（動きが終わってから置く）
        var b = box.getBoundingClientRect(), r = img.getBoundingClientRect();
        // 写真は枠の中に「収めて」表示するので、枠と実際に描かれている範囲がずれることがある → 描かれている範囲で計算する
        var ratio = (img.naturalWidth || 610) / (img.naturalHeight || 1400), cw = r.width, ch = r.height, ox = 0, oy = 0;
        if (r.width / r.height > ratio) { cw = r.height * ratio; ox = (r.width - cw) / 2; } else { ch = r.width / ratio; oy = (r.height - ch) / 2; }
        var k = ch / 640;
        v.style.left = (r.left - b.left + ox + 150 * k) + 'px';
        v.style.top = (r.top - b.top + oy - 50 * k) + 'px';
        v.style.width = (600 * k) + 'px';
        v.classList.add('is-ready');
      });
    };
    var hzStill = function () { var h = $('#hero'); return !!(h && h.classList.contains('hx--still')); };
    var hzPlay = function (v) { if (!hzStill() && v.offsetParent) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } };
    placeHz();
    window.addEventListener('resize', placeHz);
    window.addEventListener('load', placeHz);
    if (window.ResizeObserver) { var hzRo = new ResizeObserver(function () { placeHz(); }); hhzs.forEach(function (v) { hzRo.observe(v.parentNode); }); }
    // 製品の切り替え中（約1秒）は写真が動いているので、光を隠し、動きが終わってから置き直して出す
    var hzSwitch = function () {
      hhzs.forEach(function (v) { v.classList.remove('is-ready'); hzPlay(v); });
      clearTimeout(hzSwitch.t); hzSwitch.t = setTimeout(placeHz, 1000);
    };
    hhzs.forEach(function (v) {
      var im = $('img', v.parentNode); if (im && !im.complete) im.addEventListener('load', placeHz);
      if (window.IntersectionObserver) {
        new IntersectionObserver(function (es) { if (es[0].isIntersecting) hzPlay(v); else v.pause(); }).observe(v.parentNode);
      } else { hzPlay(v); }
    });
    var heroEl2 = $('#hero');
    if (heroEl2 && window.MutationObserver) {
      var hzHyp = heroEl2.classList.contains('is-hyp');
      new MutationObserver(function () { var h = heroEl2.classList.contains('is-hyp'); if (h !== hzHyp) { hzHyp = h; hzSwitch(); } hhzs.forEach(function (v) { if (hzStill()) v.pause(); else hzPlay(v); }); }).observe(heroEl2, { attributes: true, attributeFilter: ['class'] });
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
