/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
'use strict';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co',SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);}
/* The legacy Telegram click bridge in index.html captures clicks before the button's inline onclick.
   For the product checkout button only, let the native onclick reach the target. */
function patchLegacyClickBridge(){if(window.__emLegacyClickBridgePatched)return;window.__emLegacyClickBridgePatched=true;var ep=Event.prototype,oldPrevent=ep.preventDefault,oldStop=ep.stopPropagation,oldImmediate=ep.stopImmediatePropagation;function isProductCheckout(ev){return ev&&ev.type==='click'&&ev.target&&ev.target.closest&&ev.target.closest('.product-buy-now')}ep.preventDefault=function(){if(isProductCheckout(this))return;return oldPrevent.apply(this,arguments)};ep.stopPropagation=function(){if(isProductCheckout(this))return;return oldStop.apply(this,arguments)};ep.stopImmediatePropagation=function(){if(isProductCheckout(this))return;return oldImmediate.apply(this,arguments)}}
function boot(){patchLegacyClickBridge();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
