/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
'use strict';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){
 const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co',SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
 window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}

/* Telegram legacy click bridge parses addToCart(...) but does not execute
   addToCartFromModal(...). Normalize only the modal checkout button to the
   parser-compatible form. This keeps the existing design and quantity. */
function normalizeProductCheckoutButton(el){
 if(!el||!el.matches||!el.matches('.product-buy-now'))return;
 var code=el.getAttribute('onclick')||'';
 var m=code.match(/addToCartFromModal\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/);
 if(!m)return;
 el.setAttribute('onclick','addToCart(Number('+m[1]+'),Number('+m[2]+'))');
}
function scan(root){
 if(!root)return;
 if(root.nodeType===1)normalizeProductCheckoutButton(root);
 if(root.querySelectorAll)root.querySelectorAll('.product-buy-now').forEach(normalizeProductCheckoutButton);
}
function boot(){
 scan(document);
 var observer=new MutationObserver(function(mutations){
  mutations.forEach(function(m){m.addedNodes&&m.addedNodes.forEach(scan);});
 });
 observer.observe(document.documentElement||document,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
