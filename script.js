(function () {
  'use strict';

  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Год в футере
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // ----- Мобильное меню -----
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ----- Плитки в один ряд: уменьшаем шрифт, пока ряд не поместится -----
  function fitChips() {
    document.querySelectorAll('.chips--one').forEach(function (ul) {
      ul.style.fontSize = '';
      var size = parseFloat(getComputedStyle(ul).fontSize);
      var guard = 60;
      while (ul.scrollWidth > ul.clientWidth + 0.5 && size > 7.5 && guard--) {
        size -= 0.25;
        ul.style.fontSize = size + 'px';
      }
    });
  }
  fitChips();
  window.addEventListener('load', fitChips);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitChips);
  var fitTimer;
  window.addEventListener('resize', function () { clearTimeout(fitTimer); fitTimer = setTimeout(fitChips, 120); });

  // ----- Девиз в подвале: растягиваем на всю ширину -----
  function fitMotto() {
    var m = document.querySelector('.footer__motto');
    if (!m) return;
    m.style.justifyContent = 'flex-start';
    m.style.width = 'max-content';
    m.style.fontSize = '100px';
    var natural = m.scrollWidth;
    m.style.width = '';
    var avail = m.parentElement.clientWidth;
    if (natural > 0 && avail > 0) m.style.fontSize = Math.floor(avail / natural * 100 * 10) / 10 + 'px';
    m.style.justifyContent = '';
  }
  fitMotto();
  window.addEventListener('load', fitMotto);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMotto);
  var mottoTimer;
  window.addEventListener('resize', function () { clearTimeout(mottoTimer); mottoTimer = setTimeout(fitMotto, 120); });

  // ----- Лента услуг -----
  var rail = document.querySelector('.rail');
  document.querySelectorAll('[data-rail]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!rail) return;
      var dir = btn.getAttribute('data-rail') === 'next' ? 1 : -1;
      var card = rail.querySelector('.pcard');
      var step = card ? card.getBoundingClientRect().width + 16 : 300;
      rail.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // ----- Вкладки целей -----
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  // ----- Плавное появление блоков -----
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ----- Кнопка «Наверх» -----
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.hidden = window.scrollY < 700;
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // ----- Значки соцсетей -----
  // Адреса впишите в index.html: атрибут href у ссылок data-social="telegram" и data-social="instagram".
  // Пока там стоит «#», значки не ведут никуда.
  function isRealUrl(href) {
    return /^https?:\/\/[^\s]+\.[^\s]+/.test(href || '') && !/^https?:\/\/(www\.)?(t\.me|instagram\.com)\/?$/.test(href);
  }
  document.querySelectorAll('[data-social]').forEach(function (a) {
    if (!isRealUrl(a.getAttribute('href'))) {
      a.title = 'Ссылка скоро появится';
      a.addEventListener('click', function (e) { e.preventDefault(); });
    }
  });
  var tgLink = null;
  document.querySelectorAll('[data-social="telegram"]').forEach(function (a) {
    if (!tgLink && isRealUrl(a.getAttribute('href'))) tgLink = a.getAttribute('href');
  });

  // ----- Анкета -----
  // GitHub Pages не выполняет серверный код, а токен бота нельзя прятать в браузере.
  // Поэтому «Отправить» собирает текст анкеты, копирует его и открывает чат в Telegram:
  // клиенту остаётся вставить текст и нажать отправку.
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var next = document.getElementById('form-next');
    var fallback = document.getElementById('form-fallback');
    var f = form.elements;

    // Сегодняшняя дата по умолчанию
    function pad2(n) { return n < 10 ? '0' + n : String(n); }
    var now = new Date();
    if (f.date && !f.date.value) f.date.value = now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());

    // Поле «Какие?» показывается, когда выбран ответ, отличный от «Нет»
    form.querySelectorAll('.yn[data-key]').forEach(function (g) {
      var note = g.querySelector('.yn__note');
      g.addEventListener('change', function () {
        g.classList.remove('invalid');
        if (!note) return;
        var v = f[g.getAttribute('data-key')].value;
        note.hidden = !v || v === 'Нет';
        if (note.hidden) note.value = '';
      });
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList) e.target.classList.remove('invalid');
      if (e.target.name === 'consent') e.target.closest('.check').classList.remove('invalid');
    });

    function val(name) { return (f[name].value || '').trim(); }
    function dash(v) { return v ? v : '—'; }
    function fmtDate(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? m[3] + '.' + m[2] + '.' + m[1] : v; }
    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
    }

    function validate() {
      var bad = [];
      [['fullname', 2], ['age', 0], ['height', 0], ['weight', 0]].forEach(function (p) {
        var el = f[p[0]];
        var ok = el.value.trim().length > p[1] - 1 && el.value.trim() !== '';
        if (ok && el.type === 'number') {
          var n = parseFloat(el.value);
          ok = n >= parseFloat(el.min) && n <= parseFloat(el.max);
        }
        el.classList.toggle('invalid', !ok);
        if (!ok) bad.push(el);
      });
      form.querySelectorAll('.yn[data-key]').forEach(function (g) {
        var ok = !!f[g.getAttribute('data-key')].value;
        g.classList.toggle('invalid', !ok);
        if (!ok) bad.push(g);
      });
      var box = form.querySelector('.check');
      var consentOk = f.consent.checked;
      box.classList.toggle('invalid', !consentOk);
      if (!consentOk) bad.push(box);
      return bad;
    }

    function buildText() {
      var L = [];
      L.push('Анкета на онлайн-сопровождение');
      L.push('Дата заполнения: ' + fmtDate(val('date')));
      L.push('Имя, Фамилия: ' + val('fullname'));
      L.push('Почему выбрали меня: ' + dash(val('why')));
      L.push('Возраст: ' + val('age'));
      L.push('Рост: ' + val('height') + ' см');
      L.push('Вес: ' + val('weight') + ' кг');
      L.push('');
      L.push('ЗДОРОВЬЕ');
      form.querySelectorAll('.yn[data-key]:not([data-plain])').forEach(function (g) {
        var key = g.getAttribute('data-key');
        var line = g.getAttribute('data-label') + ': ' + f[key].value;
        var note = val(key + '_note');
        if (note) line += ' (' + note + ')';
        L.push(line);
      });
      L.push('Другие заболевания: ' + (val('other') || 'нет'));
      L.push('');
      L.push('ТРЕНИРОВКИ');
      L.push('Место занятий: ' + f.place.value);
      L.push('Тренировок в неделю: ' + dash(val('perweek')));
      L.push('Инвентарь дома: ' + dash(val('inventory')));
      L.push('Витамины и микроэлементы: ' + dash(val('vitamins')));
      L.push('Акцент в тренировках: ' + dash(val('focus')));
      L.push('Активность за последние 3 месяца: ' + dash(val('activity')));
      return L.join('\n');
    }

    function afterCopy(copied, text) {
      var openedHint = tgLink
        ? 'Открываю Telegram: вставьте анкету в чат и отправьте.'
        : 'Telegram тренера скоро появится на сайте. Анкета скопирована, отправьте её тренеру сообщением.';
      if (copied) {
        fallback.hidden = true;
        setStatus('Анкета скопирована. ' + openedHint, 'ok');
      } else {
        fallback.value = text;
        fallback.hidden = false;
        fallback.focus();
        fallback.select();
        setStatus('Скопируйте текст выше вручную. ' + openedHint, 'ok');
      }
      if (tgLink) {
        next.href = tgLink;
        next.hidden = false;
        window.open(tgLink, '_blank', 'noopener');
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = validate();
      if (bad.length) {
        setStatus('Заполните обязательные поля, отмеченные звёздочкой, и подтвердите согласие.', 'error');
        var first = bad[0];
        first.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        var focusable = first.matches('input,select,textarea') ? first : first.querySelector('input');
        if (focusable) focusable.focus({ preventScroll: true });
        return;
      }
      var text = buildText();
      if (text.length > 4000) {
        setStatus('Анкета получилась слишком длинной для одного сообщения Telegram (' + text.length + ' знаков из 4096). Сократите ответы.', 'error');
        return;
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { afterCopy(true, text); }, function () { afterCopy(false, text); });
      } else {
        afterCopy(false, text);
      }
    });
  }
})();
