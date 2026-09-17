(function(){
  'use strict';

  var SUPABASE_URL = 'https://uhmgjcoyxehknkehfbbj.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
  var busy = false;

  function text(el){ return el ? String(el.textContent || '').trim() : ''; }
  function number(v){ var n = Number(v); return Number.isFinite(n) ? n : null; }

  function readOptions(product){
    var opts = Array.isArray(product && product.price_options) ? product.price_options : [];
    if(!opts.length && product && product.details){
      var match = String(product.details).match(/<!--EM_PRICES:([\s\S]*?)-->/);
      if(match){ try { opts = JSON.parse(match[1]); } catch(e){} }
    }
    if(!Array.isArray(opts)) return [];
    return opts.map(function(o){
      return { qty:number(o && (o.qty != null ? o.qty : o.quantity)), price:number(o && o.price) };
    }).filter(function(o){ return o.qty !== null && o.qty > 0 && o.price !== null && o.price >= 0; });
  }

  async function findProduct(title){
    if(!title) return null;
    try{
      var url = SUPABASE_URL + '/rest/v1/products?select=id,name,price,details,price_options&name=eq.' + encodeURIComponent(title) + '&limit=1';
      var res = await fetch(url, {headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
      if(!res.ok) return null;
      var data = await res.json();
      return Array.isArray(data) && data[0] ? data[0] : null;
    }catch(e){ console.warn('buyer options lookup',e); return null; }
  }

  function getProductId(modal){
    var selectors = '[onclick*="addToCartFromModal"],[onclick*="buyNow"],[onclick*="addToCart"],[data-product-id]';
    var el = modal.querySelector(selectors);
    if(!el) return null;
    var s = el.getAttribute('onclick') || '';
    var names = ['addToCartFromModal','buyNow','addToCart'];
    for(var i=0;i<names.length;i++){
      var pos=s.indexOf(names[i]+'(');
      if(pos>=0){
        var tail=s.slice(pos+names[i].length+1);
        var raw=tail.split(/[),]/)[0];
        var n=number(raw);
        if(n!==null) return n;
      }
    }
    return number(el.getAttribute('data-product-id'));
  }

  function callSelect(id, option){
    window.emSelectedPriceOption = {productId:id, quantity:option.qty, price:option.price};
    var fn = window.selectProductQuantity;
    if(typeof fn === 'function'){
      try { fn(id, option.qty, option.price); } catch(e) { console.warn('selectProductQuantity',e); }
    }
  }

  function render(modal, product){
    if(!modal || !product) return;
    var options = readOptions(product);
    if(!options.length || modal.querySelector('#emBuyerPriceChoices')) return;

    var price = modal.querySelector('.product-modal-price');
    var title = modal.querySelector('.product-modal-title');
    if(!price && !title) return;

    var box = document.createElement('div');
    box.id = 'emBuyerPriceChoices';
    box.style.cssText = 'margin:14px 0;padding:14px;border:1px solid rgba(96,165,250,.45);border-radius:16px;background:linear-gradient(135deg,rgba(37,99,235,.18),rgba(14,165,233,.10));';
    box.innerHTML = '<div style="font-size:15px;font-weight:800;margin-bottom:9px">🛒 Выберите количество и цену</div>' +
      '<div id="emBuyerOptionsList" style="display:grid;gap:8px"></div>' +
      '<div id="emBuyerOptionsTotal" style="margin-top:10px;font-weight:800;color:#7dd3fc"></div>';

    (price || title).parentNode.insertBefore(box, (price || title).nextSibling);
    var list = box.querySelector('#emBuyerOptionsList');
    var total = box.querySelector('#emBuyerOptionsTotal');
    var id = getProductId(modal) || product.id;

    options.forEach(function(option, index){
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.qty + ' шт. — ' + option.price + ' ₽';
      button.style.cssText = 'width:100%;padding:12px 14px;border:1px solid rgba(96,165,250,.30);border-radius:12px;background:#0b1c35;color:#fff;font-weight:800;text-align:left;';
      button.addEventListener('click', function(){
        [].forEach.call(list.children, function(x){ x.style.background='#0b1c35'; x.style.borderColor='rgba(96,165,250,.30)'; });
        button.style.background='linear-gradient(135deg,#2563eb,#0ea5e9)';
        button.style.borderColor='#93c5fd';
        total.textContent = 'Выбрано: ' + option.qty + ' шт. за ' + option.price + ' ₽';
        callSelect(id, option);
      });
      list.appendChild(button);
      if(index===0) button.click();
    });
  }

  async function scan(){
    if(busy) return;
    var modal = document.querySelector('.product-modal.open .product-modal-card');
    if(!modal || modal.querySelector('#emBuyerPriceChoices')) return;
    var title = text(modal.querySelector('.product-modal-title'));
    if(!title) return;
    busy = true;
    var product = await findProduct(title);
    busy = false;
    if(product) render(modal, product);
  }

  function boot(){
    scan();
    setInterval(scan, 800);
    new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
