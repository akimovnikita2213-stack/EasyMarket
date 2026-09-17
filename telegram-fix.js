/* EasyMarket stable Telegram compatibility layer v20260917-5. */
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

/* Keep the original index.html cart implementation. buyer-price-options.js
   replaces window.addToCart, but the original function owns the real cart
   used by checkout(). Capture it before that replacement and restore it after
   all external scripts have loaded. */
var legacyAddToCart=window.addToCart;
var legacyAddToCartFromModal=window.addToCartFromModal;

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

  /* buyer-price-options.js is loaded after this file, so repair its cart
     bridge now that its functions exist. */
  if(typeof legacyAddToCart==='function'){
    window.emLegacyAddToCart=legacyAddToCart;
    window.addToCart=function(productId,qty){
      return legacyAddToCart(Number(productId),qty==null?1:Number(qty));
    };
    window.addToCartFromModal=function(productId,qty){
      var ok=legacyAddToCart(Number(productId),qty==null?1:Number(qty));
      if(ok && typeof window.closeProductModal==='function')window.closeProductModal();
      return ok;
    };
  }

  /* Product-card and product-modal CTA label. Keep the action unchanged. */
  function renameOrderButtons(){
    document.querySelectorAll('.product-buy-now').forEach(function(btn){
      btn.textContent='⚡ Оформить заказ';
    });
  }
  renameOrderButtons();
  if(window.MutationObserver){
    var root=document.body;
    if(root){
      new MutationObserver(renameOrderButtons).observe(root,{childList:true,subtree:true});
    }
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
