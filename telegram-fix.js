/* EasyMarket normal-click fix v20260917-15. */
(function(){
'use strict';
function getButton(e){var t=e&&e.target;if(t&&t.nodeType===3)t=t.parentElement;return t&&t.closest?t.closest('#productModal .product-modal-actions .product-buy-now'):null}
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'';var m=code.match(/addToCartFromModal\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null}
function handleClick(e){var btn=getButton(e);if(!btn)return;var action=getAction(btn);if(!action||typeof window.addToCartFromModal!=='function')return;var now=Date.now();if(Number(btn.dataset.emClickAt||0)>now-500){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return}btn.dataset.emClickAt=String(now);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.addToCartFromModal(action.id,action.qty)}
window.addEventListener('click',handleClick,true);
})();