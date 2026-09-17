/* EasyMarket single interaction layer.
   Keeps quantity selection + seller panel + seller price options in one place.
   This intentionally avoids overriding loadProducts or Supabase client methods. */
(function(){
  'use strict';

  function parseOptions(product){
    var opts=Array.isArray(product&&product.price_options)?product.price_options:[];
    if(!opts.length){
      var m=String(product&&product.details||'').match(/<!--EM_PRICES:([\s\S]*?)-->/);
      if(m){try{opts=JSON.parse(m[1])}catch(_) {}}
    }
    if(!Array.isArray(opts)||!opts.length) opts=[{qty:1,price:Number(product&&product.price||0)}];
    return opts.map(function(x){return {qty:Number(x.qty),price:Number(x.price)}}).filter(function(x){return x.qty>0&&x.price>=0});
  }

  /* ---------- Buyer quantity ---------- */
  function handleQuantityClick(e){
    var btn=e.target&&e.target.closest?e.target.closest('.quantity-option'):null;
    if(!btn)return;
    var code=btn.getAttribute('onclick')||'';
    var m=code.match(/selectProductQuantity\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/);
    if(!m)return;
    var id=Number(m[1]),qty=Number(m[2]);
    var product=(window.products||[]).find(function(p){return Number(p.id)===id});
    var modal=btn.closest('.product-modal');
    if(!product||!modal)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();

    var opts=parseOptions(product);
    var chosen=opts.find(function(x){return x.qty===qty})||opts[0];
    modal.querySelectorAll('.quantity-option').forEach(function(x){x.classList.toggle('active',x===btn)});
    var priceEl=modal.querySelector('.product-modal-price');
    if(priceEl)priceEl.textContent=String(chosen.price)+' ₽';
    var buy=modal.querySelector('.product-buy-now');
    if(buy)buy.setAttribute('onclick','addToCartFromModal('+id+','+chosen.qty+')');
  }
  document.addEventListener('click',handleQuantityClick,true);

  /* ---------- Seller price options ---------- */
  function sellerOptionsBox(){
    var form=document.getElementById('sellerProductForm'); if(!form)return null;
    var box=document.getElementById('sellerPriceOptionsRows'); if(box)return box;
    var anchor=document.getElementById('sellerProductStock');
    var wrap=document.createElement('div');
    wrap.className='form-group seller-price-options-wrap';
    wrap.innerHTML='<label>Количество и цена</label><div id="sellerPriceOptionsRows"></div><button type="button" class="admin-btn secondary" id="sellerAddPriceOptionBtn" style="margin-top:8px;width:100%;">＋ Добавить вариант количества</button><input id="sellerPriceOptions" type="hidden" value=""><div style="font-size:11px;color:#858b99;margin-top:7px;line-height:1.4;">Укажи количество и общую цену. Покупатель сможет выбрать вариант в карточке товара.</div>';
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(wrap,anchor.parentNode.nextSibling);else form.appendChild(wrap);
    box=document.getElementById('sellerPriceOptionsRows');
    return box;
  }
  function collectSellerOptions(){
    var box=document.getElementById('sellerPriceOptionsRows'),out=[];
    if(box)Array.prototype.forEach.call(box.children,function(row){
      var q=Number(row.querySelector('.seller-option-qty')?.value),p=Number(row.querySelector('.seller-option-price')?.value);
      if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)});
    });
    var seen={};
    out=out.filter(function(x){if(seen[x.qty])return false;seen[x.qty]=1;return true});
    if(!out.length){
      var q=Number(document.getElementById('sellerProductStock')?.value||1),p=Number(document.getElementById('sellerProductPrice')?.value||0);
      if(q>0&&p>=0)out=[{qty:Math.floor(q),price:Math.floor(p)}];
    }
    return out;
  }
  function syncSellerOptions(){
    var h=document.getElementById('sellerPriceOptions');if(h)h.value=JSON.stringify(collectSellerOptions());
  }
  window.addSellerPriceOptionRow=function(qty,price){
    var box=sellerOptionsBox();if(!box)return;
    var row=document.createElement('div');
    row.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center;';
    row.innerHTML='<input class="seller-input seller-option-qty" type="number" min="1" step="1" placeholder="Количество, шт." value="'+(qty==null?'':qty)+'"><input class="seller-input seller-option-price" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+(price==null?'':price)+'"><button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 12px;min-width:42px;">×</button>';
    box.appendChild(row);
    row.querySelectorAll('input').forEach(function(x){x.addEventListener('input',syncSellerOptions)});
    row.querySelector('.seller-option-remove').addEventListener('click',function(){row.remove();syncSellerOptions()});
    syncSellerOptions();
  };
  function initSellerOptions(){
    var box=sellerOptionsBox();if(!box)return;
    var add=document.getElementById('sellerAddPriceOptionBtn');
    if(add&&!add.__emBound){add.__emBound=true;add.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();window.addSellerPriceOptionRow()})}
    if(!box.children.length){
      var q=Number(document.getElementById('sellerProductStock')?.value||1),p=Number(document.getElementById('sellerProductPrice')?.value||0);
      window.addSellerPriceOptionRow(q>0?q:1,p>=0?p:'');
    }
    syncSellerOptions();
  }
  function wrapSellerSave(){
    if(typeof window.saveSellerProduct!=='function'||window.saveSellerProduct.__emOptionsWrapped)return;
    var original=window.saveSellerProduct;
    window.saveSellerProduct=function(event){
      try{
        var opts=collectSellerOptions();
        var details=document.getElementById('sellerProductDetails');
        if(details){
          var clean=String(details.value||'').replace(/<!--EM_PRICES:[\s\S]*?-->/g,'').trim();
          details.value=(clean?clean+'\n':'')+'<!--EM_PRICES:'+JSON.stringify(opts)+'-->';
        }
        var price=document.getElementById('sellerProductPrice'),stock=document.getElementById('sellerProductStock');
        if(opts.length){if(price)price.value=opts[0].price;if(stock)stock.value=opts[0].qty}
        syncSellerOptions();
      }catch(err){console.error('EasyMarket seller options:',err)}
      return original.call(this,event);
    };
    window.saveSellerProduct.__emOptionsWrapped=true;
  }

  /* ---------- Seller panel ---------- */
  function openSellerPanelSafe(focus){
    var panel=document.getElementById('sellerPanel');
    if(!panel)return;
    panel.classList.add('open');
    document.body.style.overflow='hidden';
    var sub=document.getElementById('sellerPanelSub');
    if(sub)sub.textContent='Загрузка магазина...';
    Promise.resolve().then(async function(){
      try{
        var rec=typeof window.getMyUserRecord==='function'?await Promise.race([window.getMyUserRecord(),new Promise(function(r){setTimeout(function(){r(null)},5000)})]):null;
        if(!rec||!rec.is_seller){
          panel.classList.remove('open');document.body.style.overflow='';
          if(typeof window.openBecomeSeller==='function')window.openBecomeSeller();
          return;
        }
        if(sub)sub.textContent=rec.username?'@'+String(rec.username).replace(/^@/,''):'Ваш магазин';
        if(typeof window.loadSellerDashboard==='function'){
          try{await Promise.race([window.loadSellerDashboard(),new Promise(function(r){setTimeout(r,7000)})])}catch(err){console.error('EasyMarket seller dashboard:',err)}
        }
        if(focus){
          var target=document.getElementById(focus==='products'?'sellerProductsTitle':'sellerOrdersTitle');
          if(target)setTimeout(function(){target.scrollIntoView({behavior:'smooth',block:'start'})},80);
        }
      }catch(err){console.error('EasyMarket seller panel:',err);if(sub)sub.textContent='Панель продавца'}
    });
  }
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('#sellerSettingsBtn,#navProductsBtn'):null;
    if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    openSellerPanelSafe(btn.id==='navProductsBtn'?'products':'orders');
  },true);
  document.addEventListener('click',function(e){
    var btn=e.target&&e.target.closest?e.target.closest('#sellerAddProductBtn'):null;
    if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    var form=document.getElementById('sellerProductForm');
    if(form)form.style.display=(form.style.display==='none'||!form.style.display)?'grid':'none';
    setTimeout(initSellerOptions,0);
  },true);

  /* ---------- Init ---------- */
  function init(){initSellerOptions();wrapSellerSave();}
  init();
  [100,500,1200,2000,3500].forEach(function(ms){setTimeout(init,ms)});
})();
