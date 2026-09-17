(function(){
  'use strict';
  var API='https://uhmgjcoyxehknkehfbbj.supabase.co/rest/v1/products';
  var KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
  function f(name){try{return window[name]||globalThis[name]}catch(e){return null}}
  function call(name){var fn=f(name),args=[].slice.call(arguments,1);if(typeof fn==='function'){try{return fn.apply(window,args)}catch(e){console.error(name,e)}}}
  function firstId(text){var m=String(text||'').match(/(?:openProductModal|addToCartFromModal|buyNow|addToCart)\s*\(\s*['"]?(\d+)/);return m?Number(m[1]):null}
  function modalId(modal){
    var nodes=modal?modal.querySelectorAll('[onclick]'):[];
    for(var i=0;i<nodes.length;i++){var id=firstId(nodes[i].getAttribute('onclick'));if(Number.isFinite(id))return id}
    return firstId(modal&&modal.getAttribute('onclick'));
  }
  function expose(){['openProductModal','closeProductModal','addToCart','addToCartFromModal','buyNow','openCart','closeCart','changeCartQuantity','removeFromCart','checkout','setCategory','renderProducts','selectProductQuantity','saveSellerProduct'].forEach(function(n){try{var x=globalThis[n];if(typeof x==='function')window[n]=x}catch(e){}})}

  function fixClose(){
    document.addEventListener('click',function(e){
      var close=e.target&&e.target.closest?e.target.closest('.product-modal-close'):null;
      if(close){e.preventDefault();e.stopImmediatePropagation();call('closeProductModal');var modal=close.closest('.product-modal');if(modal){modal.classList.remove('open');modal.style.display='none'}return}
      var modal=e.target&&e.target.closest?e.target.closest('.product-modal'):null;
      if(modal&&e.target===modal){e.preventDefault();e.stopImmediatePropagation();call('closeProductModal');modal.classList.remove('open');modal.style.display='none'}
    },true);
  }

  function sellerVariants(){
    var price=document.getElementById('sellerProductPrice');
    if(!price||document.getElementById('sellerPriceOptionsRows'))return;
    var host=price.closest('.seller-form-row')||price.parentElement;if(!host)return;
    var box=document.createElement('div');box.id='sellerPriceOptionsBox';box.style.marginTop='4px';
    box.innerHTML='<div style="font-size:12px;font-weight:800;margin-bottom:6px">Количество и цена</div><div id="sellerPriceOptionsRows"></div><button type="button" class="seller-action secondary" id="sellerAddPriceOption" style="width:100%;margin-top:7px">＋ Добавить вариант</button><input id="sellerProductPriceOptions" type="hidden">';
    host.parentNode.insertBefore(box,host.nextSibling);
    var rows=box.querySelector('#sellerPriceOptionsRows');
    function sync(){var opts=[].slice.call(rows.querySelectorAll('.price-option-row')).map(function(r){return{qty:Number(r.querySelector('.seller-opt-qty').value),price:Number(r.querySelector('.seller-opt-price').value)}}).filter(function(x){return Number.isFinite(x.qty)&&x.qty>0&&Number.isFinite(x.price)&&x.price>=0});document.getElementById('sellerProductPriceOptions').value=JSON.stringify(opts);if(opts[0])price.value=opts[0].price}
    function add(q,p){var r=document.createElement('div');r.className='price-option-row';r.style.cssText='display:grid;grid-template-columns:1fr 1fr 34px;gap:6px;margin-bottom:6px';r.innerHTML='<input class="seller-opt-qty seller-input" type="number" min="1" step="1" placeholder="Количество" value="'+(q||'')+'"><input class="seller-opt-price seller-input" type="number" min="0" step="0.01" placeholder="Цена, ₽" value="'+(p||'')+'"><button type="button" class="price-option-remove">×</button>';rows.appendChild(r);r.querySelector('.price-option-remove').onclick=function(){r.remove();sync()};r.querySelectorAll('input').forEach(function(x){x.addEventListener('input',sync)});sync()}
    box.querySelector('#sellerAddPriceOption').onclick=function(){add('','')};add(1,price.value||'');
    var original=f('saveSellerProduct');
    if(typeof original==='function'&&!original.__emVariant){function wrapped(ev){sync();var details=document.getElementById('sellerProductDetails'),old=details?details.value:'';var raw=document.getElementById('sellerProductPriceOptions').value||'[]';if(details)details.value=old.replace(/<!--EM_PRICES:.*?-->/g,'').trim()+'\n<!--EM_PRICES:'+raw+'-->';try{return original.call(this,ev)}finally{if(details)details.value=old}}wrapped.__emVariant=true;window.saveSellerProduct=wrapped}
  }

  function sellerPriceOptionsSync(){
    var original=window.saveSellerProduct;
    if(typeof original!=='function'||original.__emPricePostSync)return;
    async function wrapped(ev){
      var nameEl=document.getElementById('sellerProductName');var name=nameEl?String(nameEl.value||'').trim():'';var me=null;
      try{me=await (typeof getMyUserRecord==='function'?getMyUserRecord():null)}catch(e){}
      var sid=me&&me.telegram_id?String(me.telegram_id):'';var raw=document.getElementById('sellerProductPriceOptions');var opts=[];
      try{opts=JSON.parse(raw?raw.value:'[]')}catch(e){}
      var result=await original.call(this,ev);
      try{if(sid&&name&&opts.length){var q=await fetch(API+'?select=id,name,price&seller_id=eq.'+encodeURIComponent(Number(sid))+'&name=eq.'+encodeURIComponent(name)+'&order=id.desc&limit=1',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});var rows=await q.json();if(rows&&rows[0]){await fetch(API+'?id=eq.'+rows[0].id,{method:'PATCH',headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json','Prefer':'return=minimal'},body:JSON.stringify({price:Number(opts[0].price||0),price_options:opts})})}}}catch(e){console.warn('price_options sync',e)}
      return result;
    }
    wrapped.__emPricePostSync=true;window.saveSellerProduct=wrapped;
  }

  async function loadBuyerOptions(modal,id){
    if(!modal||!Number.isFinite(id)||modal.querySelector('#emBuyerPriceChoices'))return;
    var opts=[];
    try{
      var r=await fetch(API+'?select=id,price,price_options,details&id=eq.'+encodeURIComponent(id),{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
      var data=await r.json();var p=data&&data[0];
      if(p&&Array.isArray(p.price_options))opts=p.price_options;
      if(!opts.length&&p&&p.details){var m=String(p.details).match(/<!--EM_PRICES:([\s\S]*?)-->/);if(m)opts=JSON.parse(m[1])}
    }catch(e){console.warn('buyer options load',e)}
    opts=(Array.isArray(opts)?opts:[]).filter(function(x){return x&&Number(x.qty)>0&&Number(x.price)>=0});
    if(!opts.length)return;
    var title=modal.querySelector('.product-modal-title');var anchor=modal.querySelector('.product-modal-price')||title;if(!anchor)return;
    var box=document.createElement('div');box.id='emBuyerPriceChoices';box.style.cssText='margin:12px 0;padding:12px;border:1px solid #34384a;border-radius:14px;background:#191c28';
    box.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:8px">Выберите количество и цену</div><select id="emBuyerPriceSelect" style="width:100%;padding:12px;border-radius:10px;background:#10131c;color:#fff;border:1px solid #444b63"></select><div id="emBuyerPriceHint" style="margin-top:8px;color:#aeb5c7;font-size:12px"></div>';
    anchor.parentNode.insertBefore(box,anchor.nextSibling);
    var select=box.querySelector('#emBuyerPriceSelect'),hint=box.querySelector('#emBuyerPriceHint');
    opts.forEach(function(o,i){var op=document.createElement('option');op.value=i;op.textContent=Number(o.qty)+' шт. — '+Number(o.price)+' ₽';select.appendChild(op)});
    function apply(){var o=opts[Number(select.value)||0];hint.textContent='Итого: '+Number(o.price)+' ₽ за '+Number(o.qty)+' шт.';window.emSelectedPriceOption={productId:id,quantity:Number(o.qty),price:Number(o.price)};call('selectProductQuantity',id,Number(o.qty),Number(o.price))}
    select.addEventListener('change',apply);apply();
  }

  function buyerPriceChoices(){var modal=document.querySelector('.product-modal.open .product-modal-card');if(!modal)return;var id=modalId(modal);if(Number.isFinite(id))loadBuyerOptions(modal,id)}
  function start(){expose();fixClose();sellerVariants();sellerPriceOptionsSync();buyerPriceChoices();setInterval(function(){expose();sellerVariants();sellerPriceOptionsSync();buyerPriceChoices()},700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();