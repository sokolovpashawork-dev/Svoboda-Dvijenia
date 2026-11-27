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
  // Замер делаем на невидимой копии вне потока (position:fixed), чтобы страница не менялась
  // и не «подпрыгивала» при прокрутке на телефоне.
  function fitMotto() {
    var m = document.querySelector('.footer__motto');
    if (!m) return;
    var avail = m.parentElement.clientWidth;
    var probe = m.cloneNode(true);
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;width:max-content;justify-content:flex-start;font-size:100px;margin:0;';
    document.body.appendChild(probe);
    var natural = probe.scrollWidth;
    document.body.removeChild(probe);
    if (natural > 0 && avail > 0) m.style.fontSize = Math.floor(avail / natural * 100 * 10) / 10 + 'px';
  }
  fitMotto();
  window.addEventListener('load', fitMotto);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMotto);
  var mottoTimer;
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return; // адресная строка на телефоне меняет только высоту
    lastW = window.innerWidth;
    clearTimeout(mottoTimer); mottoTimer = setTimeout(fitMotto, 120);
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

  // ----- Плавающая кнопка «Написать в Telegram» (только телефон, CSS показывает её до 760 px) -----
  // Видна, пока на экране нет первого экрана, финального призыва и подвала: там своя кнопка или контакты.
  var fab = document.querySelector('.fab-cta');
  if (fab && 'IntersectionObserver' in window) {
    var seen = {};
    function updateFab() {
      fab.hidden = seen.hero !== false || seen.cta || seen.footer;
    }
    [['.hero', 'hero'], ['.cta', 'cta'], ['.footer', 'footer']].forEach(function (p) {
      var el = document.querySelector(p[0]); if (!el) { seen[p[1]] = false; return; }
      new IntersectionObserver(function (entries) {
        seen[p[1]] = entries[entries.length - 1].isIntersecting; updateFab();
      }).observe(el);
    });
  }

  // ----- Значки соцсетей -----
  // Адреса впишите в index.html: атрибут href у ссылок data-social="telegram" и data-social="vk".
  // Если там «#» или адрес без страницы (только t.me, vk.com, vk.ru), значок не ведёт никуда и показывает подсказку.
  function isRealUrl(href) {
    return /^https?:\/\/[^\s]+\.[^\s]+/.test(href || '') && !/^https?:\/\/(www\.)?(t\.me|vk\.com|vk\.ru)\/?$/.test(href);
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
  function clear(){Object.keys(cards).forEach(function(k){var c=cards[k];c.classList.remove('is-rec');});}
  document.querySelectorAll('[data-pick]').forEach(function(a){a.addEventListener('click',function(e){
    e.preventDefault(); clear();
    var c=cards[a.dataset.pick]; if(!c)return;
    var st=c.closest('.fstep'); if(st&&!st.classList.contains('is-open'))st.querySelector('.chev__c').click();
    c.classList.add('is-rec');
    // На телефоне карточки стоят друг под другом: прокручиваем к нужному формату (1 или 2), на компьютере — к началу раздела «Услуги»
    var target=(st&&window.matchMedia('(max-width: 760px)').matches)?st:document.getElementById('services');
    target.scrollIntoView({behavior:'smooth',block:'start'});
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

// Окна «Оферта и реквизиты» (#terms) и «Политика конфиденциальности» (#privacy): открываются по ссылкам [data-terms] / [data-privacy] и по адресу с якорем
(function(){
  var items=[['terms','data-terms'],['privacy','data-privacy']].map(function(p){ var d=document.getElementById(p[0]); return d?{id:p[0],attr:p[1],dlg:d}:null; }).filter(Boolean);
  if(!items.length)return;
  function setHash(h){ try{ history.replaceState(null,'',h?'#'+h:location.pathname+location.search); }catch(e){} }
  function closeDlg(d){ if(d.close)d.close(); else d.removeAttribute('open'); }
  function open(it){
    if(it.dlg.open)return;
    items.forEach(function(o){ if(o!==it&&o.dlg.open)closeDlg(o.dlg); });   // одновременно открыто только одно окно
    if(it.dlg.showModal)it.dlg.showModal(); else it.dlg.setAttribute('open','');
    it.dlg.querySelector('.terms__body').scrollTop=0; setHash(it.id);
  }
  items.forEach(function(it){
    document.querySelectorAll('['+it.attr+']').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); open(it); }); });
    it.dlg.querySelector('.terms__close').addEventListener('click',function(){ closeDlg(it.dlg); });
    it.dlg.addEventListener('click',function(e){ if(e.target===it.dlg)closeDlg(it.dlg); });   // клик по затемнению
    it.dlg.addEventListener('close',function(){ if(location.hash==='#'+it.id)setHash(''); });
  });
  function fromHash(){ items.forEach(function(it){ if(location.hash==='#'+it.id)open(it); }); }
  fromHash(); window.addEventListener('hashchange',fromHash);
})();

// Подсказка прокрутки вкладок целей: затухание по краям и стрелка
(function(){
  var wrap=document.querySelector('.tabs-wrap'); if(!wrap)return;
  var box=wrap.querySelector('.tabs'), next=wrap.querySelector('[data-tabs-next]');
  function upd(){
    var max=box.scrollWidth-box.clientWidth;
    wrap.classList.toggle('can-left', box.scrollLeft>4);
    wrap.classList.toggle('can-right', box.scrollLeft<max-4);
  }
  box.addEventListener('scroll',upd,{passive:true});
  window.addEventListener('resize',upd);
  window.addEventListener('load',upd);
  if(next) next.addEventListener('click',function(){ box.scrollBy({left:Math.max(160,box.clientWidth*.6),behavior:'smooth'}); });
  upd();
})();

// Просмотр сертификатов
(function(){
  var lb=document.getElementById('lb'); var items=[].slice.call(document.querySelectorAll('[data-cert]'));
  if(!lb||!items.length)return;
  var img=document.getElementById('lb-img'),cur=0;
  function show(i){
    cur=(i+items.length)%items.length; var b=items[cur];
    img.src=b.getAttribute('data-full'); img.alt=b.querySelector('img').alt;
    document.getElementById('lb-title').textContent=b.getAttribute('data-title');
    document.getElementById('lb-meta').textContent=b.getAttribute('data-meta');
    document.getElementById('lb-count').textContent='Документ '+(cur+1)+' из '+items.length;
  }
  items.forEach(function(b,i){ b.addEventListener('click',function(){ show(i); if(lb.showModal)lb.showModal(); else lb.setAttribute('open',''); }); });
  lb.addEventListener('click',function(e){
    if(e.target===lb||e.target.closest('[data-lb-close]')){ lb.close(); return; }
    var n=e.target.closest('[data-lb-nav]'); if(n)show(cur+parseInt(n.getAttribute('data-lb-nav'),10));
  });
  lb.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft')show(cur-1); if(e.key==='ArrowRight')show(cur+1); });
  lb.addEventListener('close',function(){ img.removeAttribute('src'); });
})();
