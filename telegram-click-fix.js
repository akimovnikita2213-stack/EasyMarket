/* EasyMarket click fix: no touch/pointer blocking. */
(function(){
'use strict';
function getButton(e){var t=e&&e.target;if(t&&t.nodeType===3)t=t.parentElement;return t&&t.closest?t.closest('#productModal .product-modal-actions .product-buy-now'):null}
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'';var m=code.match(/addToCartFromModal\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null}
function click(e){var b=getButton(e);if(!b)return;var a=getAction(b);if(!a||typeof window.addToCartFromModal!=='function')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();var now=Date.now();if(Number(b.dataset.emClickAt||0)>now-500)return;b.dataset.emClickAt=String(now);window.addToCartFromModal(a.id,a.qty)}
window.addEventListener('click',click,true);
})();