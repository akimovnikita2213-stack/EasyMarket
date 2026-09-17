/* EasyMarket modal stability patch */
(function () {
  'use strict';

  function installModalGuards() {
    const modal = document.getElementById('productModal');
    if (!modal || modal.dataset.emGuardsInstalled === '1') return;

    modal.dataset.emGuardsInstalled = '1';

    // Close only when the actual backdrop is clicked.
    modal.addEventListener('click', function (event) {
      if (event.target !== modal) return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof window.closeProductModal === 'function') {
        window.closeProductModal();
      } else {
        modal.classList.remove('open');
        document.body.style.overflow = '';
      }
    }, true);

    // Do not let controls inside the modal bubble into other click handlers.
    modal.querySelectorAll('button, input, select, textarea, a').forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.stopPropagation();
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installModalGuards, { once: true });
  } else {
    installModalGuards();
  }

  // The modal content is rebuilt dynamically, so guard newly-created controls too.
  const observer = new MutationObserver(function () {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.querySelectorAll('button, input, select, textarea, a').forEach(function (element) {
      if (element.dataset.emGuarded === '1') return;
      element.dataset.emGuarded = '1';
      element.addEventListener('click', function (event) {
        event.stopPropagation();
      }, true);
    });
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
