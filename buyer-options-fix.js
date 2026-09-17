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
 scope.querySelectorAll('.product-buy-now').forEach(function(btn){
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

/* =========================================================
   RESTORE SELLER QUANTITY + PRICE OPTIONS
   The seller form was left with only one price/stock field. Add a
   repeatable options UI and store the selected variants in the existing
   details field as EM_PRICES, which the buyer already understands.
========================================================= */
function sellerOptionsBox(){
 var form=document.getElementById('sellerProductForm');
 if(!form)return null;
 var box=document.getElementById('sellerPriceOptionsRows');
 if(box)return box;
 var anchor=document.getElementById('sellerProductImage');
 var wrap=document.createElement('div');
 wrap.className='seller-price-options-wrap';
 wrap.innerHTML='<div style="font-size:12px;font-weight:800;color:#e7e9ef;margin:10px 0 6px;">Количество и цена</div><div id="sellerPriceOptionsRows"></div><button type="button" class="seller-action" id="sellerAddPriceOptionBtn" style="width:100%;margin:8px 0 10px;">＋ Добавить вариант количества</button><div style="font-size:11px;color:#858b99;line-height:1.4;margin-bottom:8px;">Например: 1 шт — 100 ₽, 5 шт — 400 ₽. Покупатель сможет выбрать вариант при оформлении.</div>';
 if(anchor&&anchor.parentNode) anchor.parentNode.insertBefore(wrap,anchor); else form.appendChild(wrap);
 box=document.getElementById('sellerPriceOptionsRows');
 var add=document.getElementById('sellerAddPriceOptionBtn');
 if(add)add.addEventListener('click',function(){addSellerPriceOptionRow();});
 return box;
}
function addSellerPriceOptionRow(qty,price){
 var box=sellerOptionsBox(); if(!box)return;
 qty=qty==null?'':qty; price=price==null?'':price;
 var row=document.createElement('div');
 row.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin-bottom:6px;align-items:center;';
 row.innerHTML='<input class="seller-option-qty seller-input" type="number" min="1" step="1" placeholder="Количество" value="'+qty+'"><input class="seller-option-price seller-input" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+price+'"><button type="button" class="seller-action seller-option-remove" style="padding:8px 10px;">×</button>';
 box.appendChild(row);
 row.querySelector('.seller-option-remove').addEventListener('click',function(){row.remove();});
}
function collectSellerPriceOptions(){
 var box=sellerOptionsBox();
 var out=[];
 if(box)box.querySelectorAll('div').forEach(function(row){
   var q=Number(row.querySelector('.seller-option-qty')?.value);
   var p=Number(row.querySelector('.seller-option-price')?.value);
   if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)});
 });
 if(!out.length){
   var q=Number(document.getElementById('sellerProductStock')?.value||1);
   var p=Number(document.getElementById('sellerProductPrice')?.value||0);
   if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out=[{qty:Math.floor(q),price:Math.floor(p)}];
 }
 var seen={};
 return out.filter(function(x){var k=String(x.qty);if(seen[k])return false;seen[k]=1;return true;});
}
function restoreSellerPriceOptions(){
 var box=sellerOptionsBox(); if(!box||box.children.length)return;
 var q=Number(document.getElementById('sellerProductStock')?.value||1);
 var p=Number(document.getElementById('sellerProductPrice')?.value||0);
 addSellerPriceOptionRow(q>0?q:1,p>0?p:'');
}

function wrapSellerSave(){
 if(typeof window.saveSellerProduct!=='function'||window.saveSellerProduct.__optionsWrapped)return;
 var original=window.saveSellerProduct;
 function wrappedSellerSave(event){
   try{
     var opts=collectSellerPriceOptions();
     var detailsEl=document.getElementById('sellerProductDetails');
     if(detailsEl){
       var clean=(detailsEl.value||'').replace(/<!--EM_PRICES:.*?-->/g,'').trim();
       detailsEl.value=clean+'\n<!--EM_PRICES:'+JSON.stringify(opts)+'-->';
     }
     var priceEl=document.getElementById('sellerProductPrice');
     var stockEl=document.getElementById('sellerProductStock');
     if(opts.length){
       if(priceEl)priceEl.value=opts[0].price;
       if(stockEl)stockEl.value=opts[0].qty;
     }
   }catch(err){console.error('EasyMarket seller price options:',err);}
   return original.call(this,event);
 }
 wrappedSellerSave.__optionsWrapped=true;
 window.saveSellerProduct=wrappedSellerSave;
}

function initSellerOptions(){
 if(!document.getElementById('sellerProductForm'))return;
 sellerOptionsBox();
 restoreSellerPriceOptions();
 wrapSellerSave();
}

/* =========================================================
   ADMIN ADD-PRODUCT BUTTON SAFETY
   Keep the existing admin form, but make the add button reliable and
   ensure its quantity/price rows are initialized every time it opens.
========================================================= */
function wrapAdminProductForm(){
 if(typeof window.showProductForm==='function'&&!window.showProductForm.__safeWrapped){
   var originalShow=window.showProductForm;
   function safeShow(){
     try{originalShow.apply(this,arguments);}catch(err){console.error('EasyMarket showProductForm:',err);}
     var form=document.getElementById('productForm');
     if(form)form.style.display='block';
     var rows=document.getElementById('productPriceOptionsRows');
     if(rows&&typeof window.addPriceOptionRow==='function'&&!rows.children.length)window.addPriceOptionRow(1,'');
     var options=document.getElementById('productPriceOptions');
     if(options&&typeof window.syncPriceOptionsField==='function')window.syncPriceOptionsField();
   }
   safeShow.__safeWrapped=true;
   window.showProductForm=safeShow;
 }
}

function bindAdminAddButton(){
 var btn=document.querySelector('[onclick*="showProductForm"]');
 if(!btn||btn.__easyBound)return;
 btn.__easyBound=true;
 btn.addEventListener('click',function(e){
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   if(typeof window.showProductForm==='function')window.showProductForm();
 },true);
}

function initAllRestores(){
 initSellerOptions();
 wrapAdminProductForm();
 bindAdminAddButton();
}
initAllRestores();
setTimeout(initAllRestores,100);
setTimeout(initAllRestores,500);
})();
