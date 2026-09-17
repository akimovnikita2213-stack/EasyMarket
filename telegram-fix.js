(function(){
  function f(name){try{return window[name]||globalThis[name]}catch(e){return null}}
  function call(name){var fn=f(name),args=[].slice.call(arguments,1);if(typeof fn==='function'){try{return fn.apply(window,args)}catch(e){console.error(name,e)}}}
  function firstArg(el,fnName){var s=(el.getAttribute('onclick')||'');var a=s.indexOf(fnName+'(');if(a<0)return null;var b=s.indexOf(',',a);if(b<0)b=s.indexOf(')',a);var n=Number(s.slice(a+fnName.length+1,b));return Number.isFinite(n)?n:null}
  function idFrom(el,fnName){var n=firstArg(el,fnName);if(n!=null)return n;var card=el&&el.closest?el.closest('.product'):null;var s=card?card.getAttribute('onclick')||'':'';var a=s.indexOf(fnName+'(');if(a<0)return null;var b=s.indexOf(')',a);n=Number(s.slice(a+fnName.length+1,b));return Number.isFinite(n)?n:null}
  function clicks(){document.addEventListener('click',function(e){var t=e.target;
    var buy=t&&t.closest?t.closest('.product-buy-now'):null;
    if(buy){var modalId=firstArg(buy,'addToCartFromModal');if(modalId!=null){var s=buy.getAttribute('onclick')||'',a=s.indexOf('addToCartFromModal('),b=s.indexOf(')',a),args=s.slice(a+21,b).split(',').map(function(x){return Number(x.trim())});e.preventDefault();e.stopImmediatePropagation();call('addToCartFromModal',args[0],args[1]);return}
      var id=idFrom(buy,'addToCart');if(id==null)id=idFrom(buy,'openProductModal');if(id!=null){e.preventDefault();e.stopImmediatePropagation();call('addToCart',id)}return}
    var checkout=t&&t.closest?t.closest('#checkoutButton'):null;
    if(checkout){e.preventDefault();e.stopImmediatePropagation();call('checkout');return}
    var card=t&&t.closest?t.closest('.product'):null;
    if(card&&!(t.closest&&t.closest('button,a,input,select,textarea,.product-seller'))){var id=idFrom(card,'openProductModal');if(id!=null){e.preventDefault();e.stopImmediatePropagation();call('openProductModal',id)}}
  },true)}
  function expose(){['openProductModal','closeProductModal','addToCart','addToCartFromModal','buyNow','openCart','closeCart','changeCartQuantity','removeFromCart','checkout','setCategory','renderProducts','selectProductQuantity','saveSellerProduct'].forEach(function(n){try{var x=globalThis[n];if(typeof x==='function')window[n]=x}catch(e){}})}
  function sellerVariants(){
    var price=document.getElementById('sellerProductPrice');if(!price||document.getElementById('sellerPriceOptionsRows'))return;
    var host=price.closest('.seller-form-row')||price.parentElement;if(!host)return;
    var box=document.createElement('div');box.id='sellerPriceOptionsBox';box.style.marginTop='4px';box.innerHTML='<div style="font-size:12px;font-weight:800;margin-bottom:6px">Количество и цена</div><div id="sellerPriceOptionsRows"></div><button type="button" class="seller-action secondary" id="sellerAddPriceOption" style="width:100%;margin-top:7px">＋ Добавить вариант</button><input id="sellerProductPriceOptions" type="hidden">';
    host.parentNode.insertBefore(box,host.nextSibling);var rows=box.querySelector('#sellerPriceOptionsRows');
    function sync(){var opts=[].slice.call(rows.querySelectorAll('.price-option-row')).map(function(r){return{qty:Number(r.querySelector('.seller-opt-qty').value),price:Number(r.querySelector('.seller-opt-price').value)}}).filter(function(x){return Number.isFinite(x.qty)&&x.qty>0&&Number.isFinite(x.price)&&x.price>=0});document.getElementById('sellerProductPriceOptions').value=JSON.stringify(opts);if(opts[0])price.value=opts[0].price}
    function add(q,p){var r=document.createElement('div');r.className='price-option-row';r.innerHTML='<input class="seller-opt-qty seller-input" type="number" min="1" step="1" placeholder="Количество" value="'+(q||'')+'"><input class="seller-opt-price seller-input" type="number" min="0" step="0.01" placeholder="Цена, ₽" value="'+(p||'')+'"><button type="button" class="price-option-remove">×</button>';rows.appendChild(r);r.querySelector('.price-option-remove').onclick=function(){r.remove();sync()};r.querySelectorAll('input').forEach(function(x){x.addEventListener('input',sync)});sync()}
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
      if(!Array.isArray(opts)||!opts.length)return original.call(this,ev);
      var result=await original.call(this,ev);
      try{if(window.supabaseClient&&sid&&name){var q=await supabaseClient.from('products').select('id,name,price').eq('seller_id',Number(sid)).eq('name',name).order('id',{ascending:false}).limit(1).maybeSingle();if(q&&q.data&&q.data.id)await supabaseClient.from('products').update({price:Number(opts[0].price||0),price_options:opts}).eq('id',q.data.id)}}catch(e){console.warn('price_options sync',e)}
      return result;
    }
    wrapped.__emPricePostSync=true;window.saveSellerProduct=wrapped;
  }
  function buyerPriceChoices(){
    var modal=document.querySelector('.product-modal.open .product-modal-card');if(!modal||modal.querySelector('#emBuyerPriceChoices'))return;
    var title=modal.querySelector('.product-modal-title');var id=null;
    var btn=modal.querySelector('[onclick*="addToCartFromModal"],[onclick*="buyNow"],[onclick*="addToCart"]');
    if(btn){id=firstArg(btn,'addToCartFromModal');if(id==null)id=firstArg(btn,'buyNow');if(id==null)id=firstArg(btn,'addToCart')}
    var source=null;var candidates=[f('products'),f('allProducts'),f('productsData'),f('catalogProducts')];
    candidates.some(function(arr){if(!Array.isArray(arr)||id==null)return false;var p=arr.find(function(x){return Number(x.id)===Number(id)});if(p){source=p;return true}return false});
    var opts=source&&Array.isArray(source.price_options)?source.price_options:null;
    if(!opts||!opts.length){var text=source&&source.details?String(source.details):'';var m=text.match(/<!--EM_PRICES:(.*?)-->/);if(m){try{opts=JSON.parse(m[1])}catch(e){opts=null}}}
    if(!Array.isArray(opts)||!opts.length)return;
    opts=opts.filter(function(x){return x&&Number(x.qty)>0&&Number(x.price)>=0});if(!opts.length)return;
    var box=document.createElement('div');box.id='emBuyerPriceChoices';box.style.cssText='margin:12px 0;padding:12px;border:1px solid #34384a;border-radius:14px;background:#191c28';
    box.innerHTML='<div style="font-size:14px;font-weight:800;margin-bottom:8px">Выберите количество и цену</div><select id="emBuyerPriceSelect" style="width:100%;padding:12px;border-radius:10px;background:#10131c;color:#fff;border:1px solid #444b63"></select><div id="emBuyerPriceHint" style="margin-top:8px;color:#aeb5c7;font-size:12px"></div>';
    var anchor=modal.querySelector('.product-modal-price')||title;anchor.parentNode.insertBefore(box,anchor.nextSibling);var select=box.querySelector('#emBuyerPriceSelect'),hint=box.querySelector('#emBuyerPriceHint');
    opts.forEach(function(o,i){var op=document.createElement('option');op.value=i;op.textContent=Number(o.qty)+' шт. — '+Number(o.price)+' ₽';select.appendChild(op)});
    function apply(){var o=opts[Number(select.value)||0];hint.textContent='Итого: '+Number(o.price)+' ₽ за '+Number(o.qty)+' шт.';window.emSelectedPriceOption={productId:id,quantity:Number(o.qty),price:Number(o.price)};try{call('selectProductQuantity',id,Number(o.qty),Number(o.price))}catch(e){}}
    select.addEventListener('change',apply);apply();
  }
  function start(){expose();clicks();sellerVariants();sellerPriceOptionsSync();buyerPriceChoices();setInterval(function(){expose();sellerVariants();sellerPriceOptionsSync();buyerPriceChoices()},700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start()
})();