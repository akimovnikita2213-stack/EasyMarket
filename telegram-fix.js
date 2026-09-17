(function(){
'use strict';
if(window.__emFixV6)return;window.__emFixV6=true;
var API='https://uhmgjcoyxehknkehfbbj.supabase.co/rest/v1/products';
var KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
function f(n){try{return typeof window[n]==='function'?window[n]:typeof globalThis[n]==='function'?globalThis[n]:null}catch(e){return null}}
function call(n){var x=f(n);if(x)try{return x.apply(window,[].slice.call(arguments,1))}catch(e){console.warn(n,e)}}
function firstId(s){var m=String(s||'').match(/(?:openProductModal|addToCartFromModal|buyNow|addToCart)\s*\(\s*['"]?(\d+)/);return m?Number(m[1]):null}
function expose(){['openProductModal','closeProductModal','addToCart','addToCartFromModal','buyNow','openCart','closeCart','changeCartQuantity','removeFromCart','checkout','selectProductQuantity','saveSellerProduct'].forEach(function(n){try{var x=globalThis[n];if(typeof x==='function')window[n]=x}catch(e){}})}
function fixClose(){
 document.addEventListener('click',function(e){
  var t=e.target,close=t&&t.closest?t.closest('.product-modal-close'):null;
  if(close){e.preventDefault();e.stopPropagation();call('closeProductModal');var m=close.closest('.product-modal');if(m){m.classList.remove('open');m.style.display='none'}return}
  var modal=t&&t.closest?t.closest('.product-modal'):null;
  if(modal&&t===modal){e.preventDefault();call('closeProductModal');modal.classList.remove('open');modal.style.display='none'}
 },true);
}
function sellerVariants(){
 var price=document.getElementById('sellerProductPrice');if(!price||document.getElementById('sellerPriceOptionsRows'))return;
 var host=price.closest('.seller-form-row')||price.parentElement;if(!host||!host.parentNode)return;
 var box=document.createElement('div');box.id='sellerPriceOptionsBox';box.style.marginTop='8px';
 box.innerHTML='<div style="font-size:13px;font-weight:800;margin-bottom:7px">Количество и цена</div><div id="sellerPriceOptionsRows"></div><button type="button" id="sellerAddPriceOption" style="width:100%;margin-top:8px">＋ Добавить вариант</button><input id="sellerProductPriceOptions" type="hidden">';
 host.parentNode.insertBefore(box,host.nextSibling);var rows=box.querySelector('#sellerPriceOptionsRows');
 function sync(){var a=[].slice.call(rows.querySelectorAll('.em-price-row')).map(function(r){return{qty:Number(r.querySelector('.em-qty').value),price:Number(r.querySelector('.em-price').value)}}).filter(function(x){return x.qty>0&&x.price>=0&&Number.isFinite(x.qty)&&Number.isFinite(x.price)});document.getElementById('sellerProductPriceOptions').value=JSON.stringify(a);if(a[0])price.value=a[0].price}
 function add(q,p){var r=document.createElement('div');r.className='em-price-row';r.style.cssText='display:grid;grid-template-columns:1fr 1fr 36px;gap:6px;margin-bottom:6px';r.innerHTML='<input class="em-qty" type="number" min="1" step="1" placeholder="Количество"><input class="em-price" type="number" min="0" step="0.01" placeholder="Цена, ₽"><button type="button" class="em-remove">×</button>';r.querySelector('.em-qty').value=q||'';r.querySelector('.em-price').value=p||'';rows.appendChild(r);r.querySelectorAll('input').forEach(function(i){i.addEventListener('input',sync)});r.querySelector('.em-remove').addEventListener('click',function(){r.remove();sync()});sync()}
 box.querySelector('#sellerAddPriceOption').addEventListener('click',function(){add('','')});add(1,price.value||'');
 var save=f('saveSellerProduct');if(save&&!save.__emSellerWrapped){function wrapped(ev){sync();var d=document.getElementById('sellerProductDetails'),old=d?d.value:'';var raw=document.getElementById('sellerProductPriceOptions').value||'[]';if(d)d.value=old.replace(/<!--EM_PRICES:[\\s\\S]*?-->/g,'').trim()+'\\n<!--EM_PRICES:'+raw+'-->';try{return save.call(this,ev)}finally{if(d)d.value=old}}wrapped.__emSellerWrapped=true;window.saveSellerProduct=wrapped}
}
function modalId(m){var a=m?m.querySelectorAll('[onclick]'):[];for(var i=0;i<a.length;i++){var id=firstId(a[i].getAttribute('onclick'));if(Number.isFinite(id))return id}return null}
async function buyerOptions(m,id){
 if(!m||m.querySelector('#emBuyerPriceChoices')||!Number.isFinite(id))return;
 var opts=[];try{var r=await fetch(API+'?select=id,price,price_options,details&id=eq.'+encodeURIComponent(id),{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});var d=await r.json();var p=d&&d[0];if(p&&Array.isArray(p.price_options))opts=p.price_options;if(!opts.length&&p&&p.details){var z=String(p.details).match(/<!--EM_PRICES:([\\s\\S]*?)-->/);if(z)opts=JSON.parse(z[1])}}catch(e){console.warn('buyer options',e)}
 opts=(Array.isArray(opts)?opts:[]).filter(function(o){return o&&Number(o.qty)>0&&Number(o.price)>=0});if(!opts.length||!m.isConnected)return;
 var a=m.querySelector('.product-modal-price')||m.querySelector('.product-modal-title');if(!a)return;
 var b=document.createElement('div');b.id='emBuyerPriceChoices';b.style.cssText='margin:12px 0;padding:12px;border:1px solid #34384a;border-radius:14px;background:#191c28';b.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:8px">Выберите количество и цену</div><select id="emBuyerPriceSelect" style="width:100%;padding:12px;border-radius:10px;background:#10131c;color:#fff;border:1px solid #444b63"></select><div id="emBuyerPriceHint" style="margin-top:8px;color:#aeb5c7;font-size:12px"></div>';a.parentNode.insertBefore(b,a.nextSibling);
 var s=b.querySelector('#emBuyerPriceSelect'),h=b.querySelector('#emBuyerPriceHint');opts.forEach(function(o,i){var q=document.createElement('option');q.value=i;q.textContent=Number(o.qty)+' шт. — '+Number(o.price)+' ₽';s.appendChild(q)});
 function apply(){var o=opts[Number(s.value)||0];h.textContent='Итого: '+Number(o.price)+' ₽ за '+Number(o.qty)+' шт.';window.emSelectedPriceOption={productId:id,quantity:Number(o.qty),price:Number(o.price)};call('selectProductQuantity',id,Number(o.qty),Number(o.price))}s.addEventListener('change',apply);apply();
}
function scan(){sellerVariants();var m=document.querySelector('.product-modal.open .product-modal-card');if(m){var id=modalId(m);if(Number.isFinite(id))buyerOptions(m,id)}}
function start(){expose();fixClose();scan();document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('.product,.product-buy-now'))setTimeout(scan,120)},false);var obs=new MutationObserver(function(){scan()});obs.observe(document.body,{childList:true,subtree:true});setTimeout(scan,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();