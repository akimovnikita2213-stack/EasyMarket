/* EasyMarket stable Telegram compatibility layer v20260917-7. */
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
  if(!response.ok || !data || data.success===false) throw new Error(data&&data.error||'Ошибка сервера');
  return data;
};

/*
 * IMPORTANT:
 * buyer-price-options.js is the single owner of catalog/cart actions.
 * Do not wrap addToCart/addToCartFromModal here: that created two cart states.
 * Do not use MutationObserver here: changing button text from the observer
 * caused an infinite DOM mutation loop and blocked catalog rendering.
 */

function install(){
  var modal=document.getElementById('productModal');
  if(modal&&modal.dataset.emGuardInstalled!=='1'){
    modal.dataset.emGuardInstalled='1';
    modal.addEventListener('click',function(e){
      if(e.target!==modal)return;
      e.preventDefault();e.stopPropagation();
      if(typeof window.closeProductModal==='function')window.closeProductModal();
      else{modal.classList.remove('open');document.body.style.overflow='';}
    },true);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();

/* CTA label only: CSS changes the visual text without touching the DOM. */
(function(){
  var style=document.createElement('style');
  style.id='em-order-cta-label';
  style.textContent='.product-buy-now{font-size:0!important}.product-buy-now::after{content:"⚡ Оформить заказ";font-size:13px;font-weight:700}';
  (document.head||document.documentElement).appendChild(style);
})();