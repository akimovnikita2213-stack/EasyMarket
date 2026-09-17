/* EasyMarket final interaction fix
   Fixes Telegram WebView click handling for quantity variants and seller panel. */
(function(){
  'use strict';

  function getQuantityFromButton(btn){
    var code=btn && btn.getAttribute ? (btn.getAttribute('onclick')||'') : '';
    var m=code.match(/selectProductQuantity\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if(m)return {id:Number(m[1]),qty:Number(m[2])};
    var id=btn && btn.dataset ? Number(btn.dataset.productId) : NaN;
    var qty=btn && btn.dataset ? Number(btn.dataset.qty) : NaN;
    return Number.isFinite(id)&&Number.isFinite(qty)?{id:id,qty:qty}:null;
  }

  /* Quantity buttons: handle before the legacy inline handlers and parent modal. */
  document.addEventListener('click',function(e){
    var btn=e.target && e.target.closest ? e.target.closest('.quantity-option') : null;
    if(!btn)return;
    var picked=getQuantityFromButton(btn);
    if(!picked)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    try{
      if(typeof window.openProductModal==='function'){
        window.openProductModal(picked.id,picked.qty);
      }
    }catch(err){console.error('EasyMarket quantity fix:',err);}
  },true);

  /* Also make the quantity option update the active visual state immediately. */
  document.addEventListener('click',function(e){
    var btn=e.target && e.target.closest ? e.target.closest('.quantity-option') : null;
    if(!btn)return;
    var wrap=btn.closest('.quantity-options');
    if(wrap)wrap.querySelectorAll('.quantity-option').forEach(function(x){x.classList.toggle('active',x===btn);});
  },false);

  function sellerPanelOpenImmediately(focus){
    var panel=document.getElementById('sellerPanel');
    if(!panel)return;
    panel.classList.add('open');
    document.body.style.overflow='hidden';
    var sub=document.getElementById('sellerPanelSub');
    if(sub)sub.textContent='Загрузка магазина...';
    var stats=document.getElementById('sellerStats');
    if(stats && !stats.innerHTML){
      stats.innerHTML='<div class="seller-stat"><b>—</b><span>Продаж</span></div><div class="seller-stat"><b>—</b><span>Рейтинг</span></div><div class="seller-stat"><b>—</b><span>Отзывов</span></div>';
    }
    Promise.resolve().then(async function(){
      try{
        var getUser=window.getMyUserRecord;
        if(typeof getUser!=='function')throw new Error('Профиль продавца ещё не инициализирован');
        var rec=await Promise.race([
          getUser(),
          new Promise(function(resolve){setTimeout(function(){resolve(null);},5000);})
        ]);
        if(!rec || !rec.is_seller){
          panel.classList.remove('open');
          document.body.style.overflow='';
          if(typeof window.openBecomeSeller==='function')window.openBecomeSeller();
          return;
        }
        if(sub)sub.textContent=rec.username?'@'+String(rec.username).replace(/^@/,''):'Ваш магазин';
        if(typeof window.loadSellerDashboard==='function'){
          try{
            await Promise.race([
              window.loadSellerDashboard(),
              new Promise(function(resolve){setTimeout(resolve,7000);})
            ]);
          }catch(err){console.error('EasyMarket seller dashboard:',err);}
        }
        if(focus){
          var target=focus==='products'?'sellerProductsTitle':'sellerOrdersTitle';
          setTimeout(function(){var el=document.getElementById(target);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});},80);
        }
      }catch(err){
        console.error('EasyMarket seller panel fix:',err);
        if(sub)sub.textContent='Панель продавца';
      }
    });
  }

  /* Capture the seller controls before old inline handlers. */
  document.addEventListener('click',function(e){
    var el=e.target && e.target.closest ? e.target.closest('#sellerSettingsBtn,#navProductsBtn') : null;
    if(!el)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    sellerPanelOpenImmediately(el.id==='navProductsBtn'?'products':'orders');
  },true);

  /* Seller add-product button must remain responsive even when panel content is refreshed. */
  document.addEventListener('click',function(e){
    var el=e.target && e.target.closest ? e.target.closest('#sellerAddProductBtn') : null;
    if(!el)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    var form=document.getElementById('sellerProductForm');
    if(form)form.style.display=form.style.display==='none'?'grid':'none';
    setTimeout(function(){if(typeof window.addSellerPriceOptionRow==='function')window.addSellerPriceOptionRow();},0);
  },true);

  /* If the seller button was hidden before the user profile was synced, re-sync it. */
  function resyncSeller(){
    try{
      if(typeof window.syncSellerSettings==='function')window.syncSellerSettings();
    }catch(e){console.warn('EasyMarket seller sync:',e);}
  }
  [500,1500,3000].forEach(function(ms){setTimeout(resyncSeller,ms);});
})();
