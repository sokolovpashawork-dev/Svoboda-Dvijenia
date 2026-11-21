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
    // на телефоне вкладки листаются по горизонтали: показываем выбранную по центру
    var box = tab.parentElement;
    if (box && box.scrollWidth > box.clientWidth) {
      var shift = tab.getBoundingClientRect().left - box.getBoundingClientRect().left - (box.clientWidth - tab.offsetWidth) / 2;
      box.scrollBy({ left: shift, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
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

  // ----- Анкета во всплывающем окне -----
  // GitHub Pages не выполняет серверный код, а токен бота нельзя прятать в браузере.
  // Поэтому анкета уходит на сервер-посредник (data-endpoint у формы, см. worker/README.md).
  // Пока адрес не указан или посредник недоступен, «Отправить» копирует текст и открывает чат в Telegram.
  var form = document.getElementById('contact-form');
  var dlg = document.getElementById('apply');
  if (form && dlg) {
    var status = document.getElementById('form-status');
    var next = document.getElementById('form-next');
    var fallback = document.getElementById('form-fallback');
    var sendBtn = form.querySelector('.btn--send');
    var f = form.elements;
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    if (endpoint) status.textContent = 'Нажмите «Отправить»: заявка придёт тренеру в Telegram. Данные не хранятся на сайте.';

    function pad2(n) { return n < 10 ? '0' + n : String(n); }
    function setStatus(text, kind) {
      status.textContent = text;
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
    }

    // --- открытие и закрытие окна ---
    function openForm(e, service) {
      if (e && e.preventDefault) e.preventDefault();
      if (service) {
        var ok = Array.prototype.some.call(f.service.options, function (o) { return o.value === service; });
        if (ok) { f.service.value = service; f.service.classList.remove('invalid'); }
      }
      if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
      document.documentElement.classList.add('has-modal');
      var first = f.service;
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 30);
    }
    function closeForm() {
      if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
      document.documentElement.classList.remove('has-modal');
    }
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('has-modal'); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeForm(); });   // клик по затемнению
    dlg.querySelectorAll('[data-close-form]').forEach(function (b) { b.addEventListener('click', closeForm); });
    document.querySelectorAll('[data-open-form], a.btn[href="#apply"]').forEach(function (el) {
      el.addEventListener('click', function (e) { openForm(e); });
    });
    // Кнопки «Выбрать услугу / формат»: открывают анкету с уже выбранной услугой
    document.querySelectorAll('[data-service]').forEach(function (card) {
      var svc = card.getAttribute('data-service');
      card.addEventListener('click', function (e) { openForm(e, svc); });
    });

    form.addEventListener('input', function (e) { if (e.target.classList) e.target.classList.remove('invalid'); });
    form.addEventListener('change', function (e) { if (e.target.classList) e.target.classList.remove('invalid'); });

    function val(name) { return (f[name].value || '').trim(); }

    function validate() {
      var bad = [];
      function check(el, ok) { el.classList.toggle('invalid', !ok); if (!ok) bad.push(el); }
      check(f.service, !!f.service.value);
      check(f.fullname, val('fullname').length >= 2);
      check(f.contact, val('contact').length >= 3);
      ['age', 'height', 'weight'].forEach(function (n) {
        var el = f[n], v = parseFloat(el.value);
        check(el, el.value.trim() !== '' && v >= parseFloat(el.min) && v <= parseFloat(el.max));
      });
      return bad;
    }

    function buildText() {
      var d = new Date();
      return [
        'Заявка с сайта',
        'Услуга: ' + f.service.value,
        'Фамилия, имя: ' + val('fullname'),
        'Контакт для связи: ' + val('contact'),
        'Возраст: ' + val('age'),
        'Рост: ' + val('height') + ' см',
        'Вес: ' + val('weight') + ' кг',
        'Дата: ' + pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear()
      ].join('\n');
    }

    function afterCopy(copied, text, prefix) {
      var openedHint = tgLink
        ? 'Открываю Telegram: вставьте текст в чат и отправьте.'
        : 'Telegram тренера скоро появится на сайте. Текст скопирован, отправьте его тренеру сообщением.';
      if (copied) {
        fallback.hidden = true;
        setStatus((prefix || '') + 'Анкета скопирована. ' + openedHint, 'ok');
      } else {
        fallback.value = text;
        fallback.hidden = false;
        fallback.focus();
        fallback.select();
        setStatus((prefix || '') + 'Скопируйте текст выше вручную. ' + openedHint, 'ok');
      }
      if (tgLink) {
        next.href = tgLink;
        next.hidden = false;
        var win = null;
        try { win = window.open(tgLink, '_blank', 'noopener'); } catch (err) { win = null; }
        // noopener может вернуть null и при успехе, поэтому подсказку показываем всегда, но коротко
        status.textContent += ' Если Telegram не открылся, нажмите «Открыть Telegram».';
      }
    }

    function copyAndOpen(text, prefix) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { afterCopy(true, text, prefix); }, function () { afterCopy(false, text, prefix); });
      } else {
        afterCopy(false, text, prefix);
      }
    }

    // Отправка на сервер-посредник (Cloudflare Worker), который пересылает заявку в Telegram
    function sendToServer(text) {
      var label = sendBtn ? sendBtn.innerHTML : '';
      if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Отправляю…'; }
      setStatus('Отправляю…', '');
      var controller = window.AbortController ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, 15000) : null;
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, website: (f.website && f.website.value) || '' }),
        signal: controller ? controller.signal : undefined
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data.ok) throw new Error('send failed');
        });
      }).then(function () {
        form.reset();
        fallback.hidden = true;
        next.hidden = true;
        setStatus('Спасибо! Заявка отправлена, тренер свяжется с вами в Telegram.', 'ok');
      }).catch(function () {
        copyAndOpen(text, 'Не удалось отправить автоматически. ');
      }).then(function () {
        if (timer) clearTimeout(timer);
        if (sendBtn) { sendBtn.disabled = false; sendBtn.innerHTML = label; }
      });
    }

    // Отправка обрабатывается по клику на кнопку, а не по событию submit: в изолированных
    // окнах предпросмотра (iframe без allow-forms) браузер блокирует submit, и форма «молчит».
    function submitForm() {
      var bad = validate();
      if (bad.length) {
        setStatus('Заполните все поля, отмеченные звёздочкой.', 'error');
        bad[0].focus();
        return;
      }
      var text = buildText();
      if (!endpoint) { copyAndOpen(text); return; }
      sendToServer(text);
    }
    if (sendBtn) sendBtn.addEventListener('click', submitForm);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submitForm(); }
    });
  }
})();
