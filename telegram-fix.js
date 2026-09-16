(function(){
  function f(name){try{return window[name]||globalThis[name]}catch(e){return null}}
  function call(name){var fn=f(name),args=[].slice.call(arguments,1);if(typeof fn==='function'){try{return fn.apply(window,args)}catch(e){console.error(name,e)}}}
  function idFrom(el,fnName){var card=el&&el.closest?el.closest('.product'):null;if(!card)return null;var s=(el.getAttribute('onclick')||card.getAttribute('onclick')||'');var a=s.indexOf(fnName+'(');if(a<0)return null;var b=s.indexOf(')',a);var n=Number(s.slice(a+fnName.length+1,b));return Number.isFinite(n)?n:null}
  function clicks(){document.addEventListener('click',function(e){var t=e.target;
    var buy=t&&t.closest?t.closest('.product-buy-now'):null;
    if(buy){var id=idFrom(buy,'addToCart');if(id==null)id=idFrom(buy,'openProductModal');if(id!=null){e.preventDefault();e.stopImmediatePropagation();call('addToCart',id)}return}
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
  function start(){expose();clicks();sellerVariants();setTimeout(function(){expose();sellerVariants()},700);setTimeout(function(){expose();sellerVariants()},1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start()
})();