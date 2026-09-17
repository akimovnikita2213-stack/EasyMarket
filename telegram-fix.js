/* EasyMarket stable Telegram compatibility layer v20260917-4. */
(function(){
'use strict';
var API='https://uhmgjcoyxehknkehfbbj.supabase.co/functions/v1/easymarket-api';
var SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co';
var SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
if(!window.supabaseClient && window.supabase && typeof window.supabase.createClient==='function'){
  window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}
window.emSecureApi=async function(action,payload){
  var tg=window.Telegram&&window.Telegram.WebApp;
  var initData=tg&&tg.initData||'';
  if(!initData) throw new Error('Откройте Mini App из Telegram');
  var response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,payload:payload||{},initData:initData})});
  var data=await response.json().catch(function(){return null;});
  if(!response.ok||!data||data.success===false)throw new Error(data&&data.error||'Ошибка сервера');
  return data;
};
function install(){
  var modal=document.getElementById('productModal');
  if(!modal||modal.dataset.emGuardInstalled==='1')return;
  modal.dataset.emGuardInstalled='1';
  modal.addEventListener('click',function(e){
    if(e.target!==modal)return;
    e.preventDefault();e.stopPropagation();
    if(typeof window.closeProductModal==='function')window.closeProductModal();
    else{modal.classList.remove('open');document.body.style.overflow='';}
  },true);
}
function getButton(e){var t=e&&e.target;if(t&&t.nodeType===3)t=t.parentElement;return t&&t.closest?t.closest('#productModal .product-modal-actions .product-buy-now'):null;}
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'';var m=code.match(/addToCartFromModal\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null;}
function handleClick(e){var btn=getButton(e);if(!btn)return;var action=getAction(btn);if(!action||typeof window.addToCartFromModal!=='function')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.addToCartFromModal(action.id,action.qty);}
window.addEventListener('click',handleClick,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
