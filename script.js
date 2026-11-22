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
})();

// Связь «цель → формат»: рекомендации во вкладках целей и ссылки назад
(function(){
  var cards={}; document.querySelectorAll('.offer--tier').forEach(function(c){var b=c.querySelector('[data-service]'); if(b)cards[b.dataset.service]=c;});
  function clear(){Object.keys(cards).forEach(function(k){var c=cards[k];c.classList.remove('is-rec');c.querySelector('.offer__rec').hidden=true;});}
  document.querySelectorAll('[data-pick]').forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault(); clear();
    var c=cards[a.dataset.pick]; if(!c)return;
    var st=c.closest('.fstep'); if(st&&!st.classList.contains('is-open'))st.querySelector('.chev__c').click();
    var r=c.querySelector('.offer__rec'); r.textContent='Рекомендуем для цели «'+a.dataset.goal+'»'; r.hidden=false; c.classList.add('is-rec');
    document.getElementById('services').scrollIntoView({behavior:'smooth',block:'start'});
  });});
})();

// Шаги 1 и 2: плавное раскрытие карточек форматов
(function(){
  document.querySelectorAll('.fstep').forEach(function(step){
    var btn=step.querySelector('.chev__c'), more=btn.querySelector('.chev__more');
    btn.addEventListener('click',function(){
      var open=!step.classList.contains('is-open');
      step.classList.toggle('is-open',open);
      btn.setAttribute('aria-expanded',open?'true':'false');
      if(more)more.textContent=open?'Свернуть':'Подробнее';
    });
  });
})();
