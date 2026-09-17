/* EasyMarket stable Telegram compatibility layer v20260917-12. */
(function(){
'use strict';
var API='https://uhmgjcoyxehknkehfbbj.supabase.co/functions/v1/easymarket-api';
var SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co';
var SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function')window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
window.emSecureApi=async function(action,payload){var tg=window.Telegram&&window.Telegram.WebApp,initData=tg&&tg.initData||'';if(!initData)throw new Error('Откройте Mini App из Telegram');var response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,payload:payload||{},initData:initData})}),data=await response.json().catch(function(){return null});if(!response.ok||!data||data.success===false)throw new Error(data&&data.error||'Ошибка сервера');return data};
function install(){var modal=document.getElementById('productModal');if(modal&&modal.dataset.emGuardInstalled!=='1'){modal.dataset.emGuardInstalled='1';modal.addEventListener('click',function(e){if(e.target!==modal)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof window.closeProductModal==='function')window.closeProductModal();else{modal.classList.remove('open');document.body.style.overflow=''}},true)}}
function getBtn(e){var target=e&&e.target;if(target&&target.nodeType===3)target=target.parentElement;return target&&target.closest?target.closest('#productModal .product-modal-actions .product-buy-now'):null}
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'',m=code.match(/addToCartFromModal\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null}
function blockPress(e){var btn=getBtn(e);if(!btn)return false;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return true}
function handleModalClick(e){var btn=getBtn(e);if(!btn)return false;var now=Date.now();if(Number(btn.dataset.emHandledAt||0)>now-1000){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();return true}var action=getAction(btn);if(!action)return false;btn.dataset.emHandledAt=String(now);e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof window.addToCartFromModal==='function')window.addToCartFromModal(action.id,action.qty);else if(window.showToast)window.showToast('Корзина ещё загружается, попробуйте ещё раз');return true}
window.addEventListener('touchstart',blockPress,true);
window.addEventListener('pointerdown',blockPress,true);
window.addEventListener('touchend',blockPress,true);
window.addEventListener('pointerup',blockPress,true);
window.addEventListener('click',handleModalClick,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
(function(){var style=document.createElement('style');style.id='em-order-cta-label';style.textContent='.product-buy-now{font-size:13px!important}.product-modal-actions .product-buy-now{font-size:0!important}.product-modal-actions .product-buy-now::after{content:"⚡ Оформить заказ";font-size:13px;font-weight:700}.product-modal-actions .product-buy-now{position:relative;z-index:9999;touch-action:manipulation}';(document.head||document.documentElement).appendChild(style)})();