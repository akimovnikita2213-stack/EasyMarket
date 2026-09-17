/* EasyMarket buyer options + seller panel compatibility fix. */
(function(){
'use strict';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){
 const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co',SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
 window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}
function handleModalCheckoutClick(ev){
 if(!ev||ev.type!=='click'||!ev.target||!ev.target.closest)return;
 var el=ev.target.closest('.product-modal .product-buy-now');if(!el)return;
 var code=el.getAttribute('onclick')||'',m=code.match(/addToCartFromModal\(\s*([0-9]+)\s*,\s*([0-9]+)/);
 var productId=m?Number(m[1]):NaN,qty=m?Number(m[2]):NaN;if(!Number.isFinite(productId))return;
 if(!Number.isFinite(qty)||qty<=0){var active=el.closest('.product-modal')&&el.closest('.product-modal').querySelector('.quantity-option.active');var qm=active&&((active.textContent||'').match(/\d+/));qty=qm?Number(qm[0]):1;}
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 try{if(typeof window.addToCartFromModal==='function')window.addToCartFromModal(productId,qty);else if(typeof window.addToCart==='function')window.addToCart(productId,qty);}catch(err){console.error('EasyMarket modal checkout:',err);}
}
window.addEventListener('click',handleModalCheckoutClick,true);
function renameCardCheckoutButtons(root){var scope=root&&root.querySelectorAll?root:document;scope.querySelectorAll('.product-buy-now').forEach(function(btn){if(btn.closest('.product-modal'))return;btn.textContent='Оформить заказ';});}
renameCardCheckoutButtons(document);

function sellerOptionsBox(){
 var form=document.getElementById('sellerProductForm');if(!form)return null;
 var box=document.getElementById('sellerPriceOptionsRows');if(box)return box;
 var anchor=document.getElementById('sellerProductStock');
 var wrap=document.createElement('div');wrap.className='form-group seller-price-options-wrap';
 wrap.innerHTML='<label>Количество и цена</label><div id="sellerPriceOptionsRows"></div><button type="button" class="admin-btn secondary" id="sellerAddPriceOptionBtn" style="margin-top:8px;width:100%;">＋ Добавить вариант количества</button><input id="sellerPriceOptions" type="hidden" value=""><div style="font-size:11px;color:#858b99;margin-top:7px;line-height:1.4;">Укажи, сколько штук можно купить и общую цену для каждого варианта. Покупатель сможет выбрать вариант прямо в товаре.</div>';
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor.parentNode.nextSibling);else form.appendChild(wrap);
 box=document.getElementById('sellerPriceOptionsRows');var add=document.getElementById('sellerAddPriceOptionBtn');
 if(add&&!add.__bound){add.__bound=true;add.addEventListener('click',function(){addSellerPriceOptionRow();});}return box;
}
function syncSellerPriceOptionsField(){var hidden=document.getElementById('sellerPriceOptions');if(hidden)hidden.value=JSON.stringify(collectSellerPriceOptions());}
function addSellerPriceOptionRow(qty,price){var box=sellerOptionsBox();if(!box)return;qty=qty==null?'':qty;price=price==null?'':price;var row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center;';row.innerHTML='<input class="seller-input seller-option-qty" type="number" min="1" step="1" placeholder="Количество, шт." value="'+String(qty)+'"><input class="seller-input seller-option-price" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+String(price)+'"><button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 12px;min-width:42px;">×</button>';box.appendChild(row);var q=row.querySelector('.seller-option-qty'),p=row.querySelector('.seller-option-price');if(q)q.addEventListener('input',syncSellerPriceOptionsField);if(p)p.addEventListener('input',syncSellerPriceOptionsField);row.querySelector('.seller-option-remove').addEventListener('click',function(){row.remove();syncSellerPriceOptionsField();});syncSellerPriceOptionsField();}
function collectSellerPriceOptions(){var box=document.getElementById('sellerPriceOptionsRows'),out=[];if(box)Array.prototype.forEach.call(box.children,function(row){var q=Number(row.querySelector('.seller-option-qty')?.value),p=Number(row.querySelector('.seller-option-price')?.value);if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)});});var seen={};out=out.filter(function(x){var k=String(x.qty);if(seen[k])return false;seen[k]=1;return true;});if(!out.length){var q=Number(document.getElementById('sellerProductStock')?.value||1),p=Number(document.getElementById('sellerProductPrice')?.value||0);if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out=[{qty:Math.floor(q),price:Math.floor(p)}];}return out;}
function restoreSellerPriceOptions(){var box=sellerOptionsBox();if(!box||box.children.length)return;var q=Number(document.getElementById('sellerProductStock')?.value||1),p=Number(document.getElementById('sellerProductPrice')?.value||0);addSellerPriceOptionRow(q>0?q:1,p>0?p:'');}
function wrapSellerSave(){if(typeof window.saveSellerProduct!=='function'||window.saveSellerProduct.__optionsWrapped)return;var original=window.saveSellerProduct;function wrappedSellerSave(event){try{var opts=collectSellerPriceOptions(),hidden=document.getElementById('sellerPriceOptions');if(hidden)hidden.value=JSON.stringify(opts);var detailsEl=document.getElementById('sellerProductDetails');if(detailsEl){var clean=(detailsEl.value||'').replace(/<!--EM_PRICES:.*?-->/g,'').trim();detailsEl.value=(clean?clean+'\n':'')+'<!--EM_PRICES:'+JSON.stringify(opts)+'-->';}var priceEl=document.getElementById('sellerProductPrice'),stockEl=document.getElementById('sellerProductStock');if(opts.length){if(priceEl)priceEl.value=opts[0].price;if(stockEl)stockEl.value=opts[0].qty;}}catch(err){console.error('EasyMarket seller price options:',err);}return original.call(this,event);}wrappedSellerSave.__optionsWrapped=true;window.saveSellerProduct=wrappedSellerSave;}
function initSellerOptions(){if(!document.getElementById('sellerProductForm'))return;sellerOptionsBox();restoreSellerPriceOptions();wrapSellerSave();syncSellerPriceOptionsField();}
function wrapAdminProductForm(){if(typeof window.showProductForm==='function'&&!window.showProductForm.__safeWrapped){var originalShow=window.showProductForm;function safeShow(){try{originalShow.apply(this,arguments);}catch(err){console.error('EasyMarket showProductForm:',err);}var form=document.getElementById('productForm');if(form)form.style.display='block';var rows=document.getElementById('productPriceOptionsRows');if(rows&&typeof window.addPriceOptionRow==='function'&&!rows.children.length)window.addPriceOptionRow(1,'');var options=document.getElementById('productPriceOptions');if(options&&typeof window.syncPriceOptionsField==='function')window.syncPriceOptionsField();}safeShow.__safeWrapped=true;window.showProductForm=safeShow;}}
function bindAdminAddButton(){var btn=document.querySelector('[onclick*="showProductForm"]');if(!btn||btn.__easyBound)return;btn.__easyBound=true;btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof window.showProductForm==='function')window.showProductForm();},true);}
function initAllRestores(){initSellerOptions();wrapAdminProductForm();bindAdminAddButton();}

/* Seller panel stability: open the window first, then load seller data without making
   the button wait forever on a secondary query. */
function sellerPanelTimeout(promise, ms){
  return Promise.race([promise, new Promise(function(resolve){setTimeout(function(){resolve(null);},ms);})]);
}
function installSellerPanelFix(){
  if(typeof window.openSellerPanel!=='function'||window.openSellerPanel.__stableWrapped)return;
  var originalOpen=window.openSellerPanel;
  async function stableOpenSellerPanel(focus){
    var panel=document.getElementById('sellerPanel');
    if(panel){panel.classList.add('open');document.body.style.overflow='hidden';}
    try{
      var rec=await sellerPanelTimeout(window.getMyUserRecord(),7000);
      if(!rec||!rec.is_seller){
        if(panel)panel.classList.remove('open');
        document.body.style.overflow='';
        if(typeof window.openBecomeSeller==='function')window.openBecomeSeller();
        return;
      }
      var sub=document.getElementById('sellerPanelSub');
      if(sub)sub.textContent=rec.username?'@'+String(rec.username).replace(/^@/,''):'Ваш магазин';
      var load=window.loadSellerDashboard;
      if(typeof load==='function'){
        try{await sellerPanelTimeout(load(),8000);}catch(err){console.error('EasyMarket seller dashboard:',err);}
      }
      var targetId=focus==='products'?'sellerProductsTitle':focus==='chats'?'sellerOrdersTitle':'sellerOrdersTitle';
      setTimeout(function(){document.getElementById(targetId)?.scrollIntoView({behavior:'smooth',block:'start'});},50);
    }catch(err){
      console.error('EasyMarket seller panel:',err);
      try{showToast('Не удалось открыть панель продавца');}catch(e){}
    }
  }
  stableOpenSellerPanel.__stableWrapped=true;
  window.openSellerPanel=stableOpenSellerPanel;
}
function bindSellerButtons(){
  var ids=['sellerSettingsBtn','navProductsBtn'];
  ids.forEach(function(id){
    var btn=document.getElementById(id);if(!btn||btn.__sellerStableBound)return;
    btn.__sellerStableBound=true;
    btn.addEventListener('click',function(e){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.openSellerPanel==='function')window.openSellerPanel(id==='navProductsBtn'?'products':'orders');
    },true);
  });
}
function initAll(){initAllRestores();installSellerPanelFix();bindSellerButtons();}
initAll();
[100,500,1200,2000,3500].forEach(function(ms){setTimeout(initAll,ms);});
})();
