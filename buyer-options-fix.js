/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
  'use strict';
  if (!window.supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
    const SUPABASE_URL = 'https://uhmgjcoyxehknkehfbbj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  var SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co';
  var SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
  var busy=false;
  function text(el){return el?String(el.textContent||'').replace(/\s+/g,' ').trim():'';}
  function num(v){var n=Number(v);return Number.isFinite(n)?n:null;}
  function optionsOf(p){
    var a=Array.isArray(p&&p.price_options)?p.price_options:[];
    if(!a.length&&p&&p.details){var m=String(p.details).match(/<!--EM_PRICES:([\s\S]*?)-->/);if(m){try{a=JSON.parse(m[1]);}catch(e){}}}
    if(!Array.isArray(a))return [];
    return a.map(function(o){return{qty:num(o&&(o.qty!=null?o.qty:o.quantity)),price:num(o&&o.price)};}).filter(function(o){return o.qty!==null&&o.qty>0&&o.price!==null&&o.price>=0;});
  }
  function norm(s){return String(s||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim();}
  async function findProduct(title){try{var u=SUPABASE_URL+'/rest/v1/products?select=id,name,price,details,price_options&limit=1000';var r=await fetch(u,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});if(!r.ok)return null;var a=await r.json();if(!Array.isArray(a))return null;var wanted=norm(title);return a.find(function(p){return norm(p.name)===wanted;})||null;}catch(e){console.warn('buyer options lookup',e);return null;}}
  function productId(modal){
    var el=modal&&modal.querySelector('[onclick*="addToCartFromModal"],[onclick*="buyNow"],[onclick*="addToCart"],[data-product-id]');
    if(!el)return null;
    var s=el.getAttribute('onclick')||'';
    for(var i=0;i<3;i++){var n=['addToCartFromModal','buyNow','addToCart'][i],p=s.indexOf(n+'(');if(p>=0){var raw=s.slice(p+n.length+1).split(/[),]/)[0],v=num(raw);if(v!==null)return v;}}
    return num(el.getAttribute('data-product-id'));
  }
  function choose(id,o){
    window.emSelectedPriceOption={productId:Number(id),quantity:Number(o.qty),price:Number(o.price)};
    /* Keep the original app state in sync, but do not rely on it for checkout. */
    if(typeof window.selectProductQuantity==='function'){
      try{window.selectProductQuantity(Number(id),Number(o.qty));}catch(e){console.warn('selectProductQuantity',e);}
    }
    var price=document.getElementById('modalSelectedPrice');
    if(price)price.textContent=Number(o.price)+' ₽';
  }
  function render(modal,p){
    var opts=optionsOf(p);if(!opts.length||modal.querySelector('#emBuyerPriceChoices'))return;
    var anchor=modal.querySelector('.product-modal-price')||modal.querySelector('.product-modal-title');if(!anchor)return;
    var box=document.createElement('div');box.id='emBuyerPriceChoices';box.style.cssText='margin:14px 0;padding:14px;border:1px solid #38bdf8;border-radius:16px;background:linear-gradient(135deg,rgba(37,99,235,.22),rgba(14,165,233,.12));';
    box.innerHTML='<div style="font-size:15px;font-weight:900;margin-bottom:10px;color:#fff">🛒 Выберите количество и цену</div><div id="emBuyerOptionsList" style="display:grid;gap:8px"></div><div id="emBuyerOptionsTotal" style="margin-top:10px;font-weight:800;color:#7dd3fc"></div>';
    anchor.parentNode.insertBefore(box,anchor.nextSibling);
    var list=box.querySelector('#emBuyerOptionsList'),total=box.querySelector('#emBuyerOptionsTotal'),id=productId(modal)||p.id;
    opts.forEach(function(o,i){
      var b=document.createElement('button');b.type='button';b.className='em-buyer-option';b.dataset.qty=String(o.qty);b.dataset.price=String(o.price);b.textContent=o.qty+' шт. — '+o.price+' ₽';
      b.style.cssText='width:100%;padding:13px 14px;border:1px solid rgba(96,165,250,.45);border-radius:12px;background:#0b1c35;color:#fff;font-weight:900;text-align:left;';
      b.onclick=function(ev){ev.preventDefault();ev.stopPropagation();[].forEach.call(list.children,function(x){x.style.background='#0b1c35';x.style.borderColor='rgba(96,165,250,.45)';});b.style.background='linear-gradient(135deg,#2563eb,#0ea5e9)';b.style.borderColor='#93c5fd';total.textContent='Выбрано: '+o.qty+' шт. за '+o.price+' ₽';choose(id,o);};
      list.appendChild(b);
      if(i===0)setTimeout(function(){b.click();},0);
    });
  }
  async function scan(){if(busy)return;var modal=document.querySelector('.product-modal.open .product-modal-card');if(!modal||modal.querySelector('#emBuyerPriceChoices'))return;var title=text(modal.querySelector('.product-modal-title'));if(!title)return;busy=true;var p=await findProduct(title);busy=false;if(p)render(modal,p);}

  /* Hard compatibility layer for the original card controls. Some versions of the
     main page define the handlers in a local script scope, so inline onclicks can
     exist visually but fail to update the checkout state. We handle the card here. */
  function getModal(){return document.querySelector('.product-modal.open .product-modal-card');}
  function getQtyFromElement(el){
    if(!el)return null;
    var q=num(el.dataset&&el.dataset.qty);if(q!==null&&q>0)return Math.floor(q);
    var s=el.getAttribute&&el.getAttribute('onclick')||'';
    var m=s.match(/selectProductQuantity\s*\(\s*[^,]+\s*,\s*([0-9.]+)/);if(m){q=num(m[1]);if(q!==null&&q>0)return Math.floor(q);}
    m=String(text(el)).match(/(\d+)\s*(?:шт|штук)/i);return m?Number(m[1]):null;
  }
  function cardClickHandler(ev){
    var target=ev.target&&ev.target.closest?ev.target.closest('.product-modal.open .product-modal-card button'):null;
    if(!target)return;
    var modal=getModal();if(!modal)return;
    /* Original quantity pills. */
    var qty=getQtyFromElement(target);
    if(target.closest('.quantity-options') && qty!==null){
      ev.preventDefault();ev.stopPropagation();
      var id=productId(modal);if(id!==null){
        var ptitle=text(modal.querySelector('.product-modal-title'));
        var selected=null;
        var custom=modal.querySelector('.em-buyer-option[data-qty="'+qty+'"]');
        if(custom)selected={qty:qty,price:num(custom.dataset.price)};
        if(selected)choose(id,selected);else{
          var priceEl=modal.querySelector('#modalSelectedPrice');
          window.emSelectedPriceOption={productId:id,quantity:qty,price:priceEl?num(text(priceEl).replace(/[^0-9.,-]/g,'')):null};
          if(typeof window.selectProductQuantity==='function'){try{window.selectProductQuantity(id,qty);}catch(e){}}
        }
      }
      return;
    }
    /* The big "Оформить" button inside the card: add the selected quantity directly. */
    if(target.classList.contains('product-buy-now') || /оформить/i.test(text(target))){
      ev.preventDefault();ev.stopPropagation();
      var id2=productId(modal);if(id2===null)return;
      var selected2=window.emSelectedPriceOption&&Number(window.emSelectedPriceOption.productId)===Number(id2)?window.emSelectedPriceOption:null;
      var qty2=selected2&&selected2.quantity?Number(selected2.quantity):getQtyFromElement(modal.querySelector('.quantity-options button.active,.quantity-options button.selected'));
      if(!qty2)qty2=1;
      try{
        if(typeof window.addToCart==='function'){
          var result=window.addToCart(Number(id2),Number(qty2));
          if(result!==false && typeof window.closeProductModal==='function')window.closeProductModal();
        }else if(typeof window.addToCartFromModal==='function'){
          var result2=window.addToCartFromModal(Number(id2),Number(qty2));
          if(result2!==false && typeof window.closeProductModal==='function')window.closeProductModal();
        }
      }catch(e){console.error('EasyMarket card checkout',e);}
    }
  }
  function installCardHandlers(){
    if(window.__emCardHandlersInstalled)return;
    window.__emCardHandlersInstalled=true;
    document.addEventListener('click',cardClickHandler,true);
  }

  function addSellerRow(qty,price){var box=document.getElementById('sellerPriceOptionsRows');if(!box)return;var row=document.createElement('div');row.className='em-seller-price-row';row.style.cssText='display:grid;grid-template-columns:1fr 1fr 42px;gap:8px;margin-top:8px;align-items:center;';row.innerHTML='<input class="seller-price-qty" type="number" min="1" step="1" placeholder="Количество" value="'+(qty||'')+'"><input class="seller-price-value" type="number" min="0" step="1" placeholder="Общая цена ₽" value="'+(price||'')+'"><button type="button" class="seller-price-remove" style="height:44px;border:1px solid #343947;background:#1b1e27;color:#fff;border-radius:10px;font-size:18px">×</button>';row.querySelector('.seller-price-remove').onclick=function(){row.remove();};box.appendChild(row);}
  function syncSellerRows(){var details=document.getElementById('sellerProductDetails');if(!details)return;var out=[];Array.prototype.forEach.call(document.querySelectorAll('#sellerPriceOptionsRows .em-seller-price-row'),function(row){var q=Number(row.querySelector('.seller-price-qty')?.value),p=Number(row.querySelector('.seller-price-value')?.value);if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)});});var base=String(details.value||'').replace(/\s*<!--EM_PRICES:[\s\S]*?-->\s*/g,'').trim();if(out.length)base+=(base?'\n\n':'')+'<!--EM_PRICES:'+JSON.stringify(out)+'-->';details.value=base;}
  function setupSellerUI(){var price=document.getElementById('sellerProductPrice');if(!price||document.getElementById('sellerPriceOptionsRows'))return;var panel=document.createElement('div');panel.style.cssText='margin-top:10px;padding:12px;border:1px solid rgba(139,92,246,.28);border-radius:14px;background:rgba(139,92,246,.08)';panel.innerHTML='<div style="font-size:13px;font-weight:900;margin-bottom:5px">📦 Варианты количества и цены</div><div style="font-size:11px;color:#858b99;line-height:1.4;margin-bottom:8px">Например: 1 шт — 100 ₽, 5 шт — 400 ₽. Покупатель выберет вариант в карточке товара.</div><div id="sellerPriceOptionsRows"></div><button type="button" id="sellerAddPriceOption" style="width:100%;margin-top:8px;padding:10px;border:0;border-radius:10px;background:#252a35;color:#fff;font-weight:800">＋ Добавить вариант</button>';price.parentNode.parentNode.insertAdjacentElement('afterend',panel);document.getElementById('sellerAddPriceOption').onclick=function(){addSellerRow('','');};addSellerRow(1,price.value||'');}
  function wrapSellerSave(){if(typeof window.saveSellerProduct!=='function'||window.saveSellerProduct.__emWrapped)return;var original=window.saveSellerProduct;function wrapped(event){syncSellerRows();return original.apply(this,arguments);}wrapped.__emWrapped=true;window.saveSellerProduct=wrapped;}
  function exposeCheckout(){try{if(typeof checkout==='function'&&window.checkout!==checkout)window.checkout=checkout;}catch(e){}}
  function boot(){exposeCheckout();installCardHandlers();scan();setupSellerUI();wrapSellerSave();setInterval(function(){exposeCheckout();installCardHandlers();scan();setupSellerUI();wrapSellerSave();},700);new MutationObserver(function(){exposeCheckout();installCardHandlers();scan();setupSellerUI();wrapSellerSave();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
