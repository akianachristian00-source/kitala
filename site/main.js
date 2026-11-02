(function () {
  var K = window.KITALA || {};

  // Menu mobile
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Boutons « Créer ma boutique »
  document.querySelectorAll('a[data-cta]').forEach(function (a) {
    a.href = (K.app || '') + (K.inscription || '/login');
  });

  // Liens WhatsApp : si le numéro n'est pas renseigné, on renvoie vers Contact
  function waLink(text) {
    return 'https://wa.me/' + K.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  document.querySelectorAll('a[data-wa]').forEach(function (a) {
    if (K.whatsapp) {
      a.href = waLink(a.getAttribute('data-wa'));
      a.target = '_blank';
      a.rel = 'noopener';
    } else {
      a.href = 'contact.html';
    }
  });

  // Recherche dans l'aide
  var search = document.getElementById('search');
  if (search) {
    var items = document.querySelectorAll('[data-q]');
    var empty = document.getElementById('empty');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (d) {
        var hit = !q || d.getAttribute('data-q').toLowerCase().indexOf(q) !== -1 || d.textContent.toLowerCase().indexOf(q) !== -1;
        d.classList.toggle('hidden', !hit);
        if (hit) shown++;
      });
      if (empty) empty.classList.toggle('hidden', shown !== 0);
    });
  }

  // Formulaire de contact -> message WhatsApp
  var form = document.getElementById('contact-form');
  if (form) {
    var info = document.getElementById('wa-info');
    if (!K.whatsapp && info) info.classList.remove('hidden');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!K.whatsapp) { if (info) info.classList.remove('hidden'); return; }
      var d = new FormData(form);
      var txt = 'Bonjour Kitala, je m\'appelle ' + d.get('nom') +
        (d.get('quartier') ? ' (' + d.get('quartier') + ')' : '') +
        '. Sujet : ' + d.get('sujet') + '.\n' + d.get('message');
      window.open(waLink(txt), '_blank', 'noopener');
    });
  }
})();
