/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
'use strict';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){
 const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co',SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
 window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}

/* The Telegram legacy bridge is registered on document in capture phase.
   This listener is registered on window, so it runs first. For ONLY the
   checkout button inside the opened product modal, execute the real action
   here and stop the legacy bridge from swallowing the click. */
function handleModalCheckoutClick(ev){
 if(!ev||ev.type!=='click'||!ev.target||!ev.target.closest)return;
 var el=ev.target.closest('.product-modal .product-buy-now');
 if(!el)return;
 var code=el.getAttribute('onclick')||'';
 var m=code.match(/addToCartFromModal\(\s*([0-9]+)\s*,\s*([0-9]+)/);
 var productId=m?Number(m[1]):NaN;
 var qty=m?Number(m[2]):NaN;
 if(!Number.isFinite(productId))return;
 if(!Number.isFinite(qty)||qty<=0){
   var active=el.closest('.product-modal')&&el.closest('.product-modal').querySelector('.quantity-option.active');
   var qm=active&&((active.textContent||'').match(/\d+/));
   qty=qm?Number(qm[0]):1;
 }
 ev.preventDefault();
 ev.stopPropagation();
 ev.stopImmediatePropagation();
 try{
   if(typeof window.addToCartFromModal==='function') window.addToCartFromModal(productId,qty);
   else if(typeof window.addToCart==='function') window.addToCart(productId,qty);
 }catch(err){console.error('EasyMarket modal checkout:',err);}
}
window.addEventListener('click',handleModalCheckoutClick,true);

/* Product-card CTA label. Keep the modal CTA unchanged. */
function renameCardCheckoutButtons(root){
 var scope=root&&root.querySelectorAll?root:document;
 scope.querySelectorAll('.product-buy-now:not(.product-modal .product-buy-now)').forEach(function(btn){
   if(btn.closest('.product-modal')) return;
   btn.textContent='Оформить заказ';
 });
}
renameCardCheckoutButtons(document);
if(window.MutationObserver){
 var observer=new MutationObserver(function(mutations){
   mutations.forEach(function(m){
     m.addedNodes&&Array.prototype.forEach.call(m.addedNodes,function(node){
       if(node&&node.nodeType===1) renameCardCheckoutButtons(node);
     });
   });
 });
 observer.observe(document.body,{childList:true,subtree:true});
}
})();
