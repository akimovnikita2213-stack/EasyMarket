/* EasyMarket buyer quantity/price + seller options bridge v20260918-2. */
(function(){
'use strict';
var sellerBound=false,buyerBound=false;
function el(id){return document.getElementById(id)}
function readOptions(p){var a=Array.isArray(p&&p.price_options)?p.price_options:[];if(!a.length){var m=String(p&&p.details||'').match(/<!--EM_PRICES:([\s\S]*?)-->/);if(m)try{a=JSON.parse(m[1])}catch(e){a=[]}}return (Array.isArray(a)?a:[]).map(function(x){return{qty:Math.max(1,Math.floor(Number(x.qty)||1)),price:Math.max(0,Number(x.price)||0)}}).filter(function(x){return Number.isFinite(x.qty)&&Number.isFinite(x.price)}).sort(function(a,b){return a.qty-b.qty})}
function sync(){var b=el('sellerPriceOptionsRows'),h=el('sellerPriceOptions');if(!b||!h)return;var a=[];b.querySelectorAll(':scope > div').forEach(function(r){var q=Number(r.querySelector('.seller-option-qty')?.value),p=Number(r.querySelector('.seller-option-price')?.value);if(q>0&&p>=0)a.push({qty:Math.floor(q),price:p})});var s={};h.value=JSON.stringify(a.filter(function(x){if(s[x.qty])return false;s[x.qty]=1;return true}))}
function addRow(q,p){var b=el('sellerPriceOptionsRows');if(!b)return;var r=document.createElement('div');r.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';r.innerHTML='<input class="seller-input seller-option-qty" type="number" min="1" step="1" placeholder="Количество, шт." value="'+(q||1)+'"><input class="seller-input seller-option-price" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+(p==null?'':p)+'"><button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 12px">×</button>';b.appendChild(r);r.querySelectorAll('input').forEach(function(x){x.addEventListener('input',sync)});r.querySelector('.seller-option-remove').onclick=function(){r.remove();sync()};sync()}
function seller(){var f=el('sellerProductForm')||document.querySelector('#sellerPanel form');if(!f)return;var b=el('sellerPriceOptionsRows');if(!b){var w=document.createElement('div');w.className='form-group';w.innerHTML='<label style="display:block;font-size:13px;font-weight:800;margin-bottom:7px">💰 Количество и цена</label><div id="sellerPriceOptionsRows"></div><button type="button" id="sellerAddPriceOptionBtn" class="admin-btn secondary" style="width:100%;margin-top:8px">＋ Добавить вариант количества</button><input id="sellerPriceOptions" type="hidden"><div style="font-size:11px;color:#858b99;margin-top:7px">Например: 1 шт. — 100 ₽, 5 шт. — 450 ₽.</div>';var st=el('sellerProductStock');if(st&&st.parentNode)st.parentNode.insertAdjacentElement('afterend',w);else f.appendChild(w);b=el('sellerPriceOptionsRows')}var add=el('sellerAddPriceOptionBtn');if(add&&!add.dataset.bound){add.dataset.bound='1';add.onclick=function(){addRow(1,Number(el('sellerProductPrice')?.value||0))}}if(!b.children.length)addRow(Number(el('sellerProductStock')?.value||1),Number(el('sellerProductPrice')?.value||0));sync();if(!sellerBound&&typeof window.saveSellerProduct==='function'){sellerBound=true;var old=window.saveSellerProduct;window.saveSellerProduct=function(e){sync();var h=el('sellerPriceOptions'),d=el('sellerProductDetails');if(h&&d){var a=[];try{a=JSON.parse(h.value||'[]')}catch(_){}var clean=String(d.value||'').replace(/\s*<!--EM_PRICES:[\s\S]*?-->\s*/g,'').trim();if(a.length)d.value=(clean?clean+'\n\n':'')+'<!--EM_PRICES:'+JSON.stringify(a)+'-->'}return old.call(this,e)}}}
function buyer(){if(buyerBound||typeof window.openProductModal!=='function')return;buyerBound=true;window.openProductModal=function(id,initial){var p=(window.products||[]).find(function(x){return Number(x.id)===Number(id)}),m=el('productModal'),c=el('productModalContent');if(!p||!m||!c)return;var a=readOptions(p),max=Math.max(1,Math.floor(Number(p.stock)||1)),base=Math.max(0,Number(p.price)||0),q=Math.min(max,Math.max(1,Math.floor(Number(initial)||1))),esc=window.escapeHtml||function(x){return String(x)};var media=p.image_url?'<img class="product-modal-image" src="'+esc(p.image_url)+'" alt="'+esc(p.name||'')+'">':'<div class="product-modal-icon">'+esc(p.icon||'📦')+'</div>';c.innerHTML=media+'<div class="product-modal-title">'+esc(p.name||'')+'</div>'+(p.seller_username||p.seller_id?'<div class="product-modal-text">🏪 Продавец: '+esc(p.seller_username?'@'+String(p.seller_username).replace(/^@/,''):'ID '+p.seller_id)+'</div>':'')+'<div class="product-modal-label">Количество</div><div style="display:flex;align-items:center;gap:12px;margin:10px 0 14px"><button type="button" id="emQtyMinus" class="buy-btn" style="font-size:22px;min-width:44px">−</button><strong id="emQtyValue" style="font-size:22px;min-width:50px;text-align:center"></strong><button type="button" id="emQtyPlus" class="buy-btn" style="font-size:22px;min-width:44px">＋</button><span style="color:#858b99">из '+max+' шт.</span></div>'+(a.length?'<div class="product-modal-label">Цены продавца</div><div id="emSellerOptions" class="quantity-options">'+a.map(function(o){return'<button type="button" class="quantity-option" data-qty="'+o.qty+'">'+o.qty+' шт. · '+o.price+' ₽</button>'}).join('')+'</div>':'')+'<div class="product-modal-price" id="emTotalPrice"></div>'+(p.description?'<div class="product-modal-label">Описание</div><div class="product-modal-text">'+esc(String(p.description).replace(/<!--EM_PRICES:[\s\S]*?-->/g,'').trim())+'</div>':'')+(p.details?'<div class="product-modal-label">Детали</div><div class="product-modal-text">'+esc(String(p.details).replace(/<!--EM_PRICES:[\s\S]*?-->/g,'').trim())+'</div>':'')+'<div class="product-modal-actions"><button type="button" id="emAddQty" class="buy-btn product-buy-now"></button></div>';
function total(){var x=a.find(function(o){return o.qty===q});return x?x.price:base*q}function refresh(){var t=total();el('emQtyValue').textContent=q;el('emTotalPrice').textContent=t+' ₽';el('emAddQty').textContent='⚡ Оформить · '+t+' ₽';el('emQtyMinus').disabled=q<=1;el('emQtyPlus').disabled=q>=max;c.querySelectorAll('#emSellerOptions button').forEach(function(b){b.classList.toggle('active',Number(b.dataset.qty)===q)})}el('emQtyMinus').onclick=function(e){e.stopPropagation();if(q>1){q--;refresh()}};el('emQtyPlus').onclick=function(e){e.stopPropagation();if(q<max){q++;refresh()}};c.querySelectorAll('#emSellerOptions button').forEach(function(b){b.onclick=function(e){e.stopPropagation();q=Math.min(max,Math.max(1,Number(b.dataset.qty)));refresh()}});el('emAddQty').onclick=function(e){e.stopPropagation();if(window.addToCartQuantity)window.addToCartQuantity(Number(p.id),q);else window.addToCartFromModal?.(Number(p.id),q)};refresh();m.classList.add('open');document.body.style.overflow='hidden'}}
function init(){seller();buyer()}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});setInterval(init,700)})();

/* Checkout fix: checkout() must read the cart maintained by the buyer bridge. */
(function(){
  var busy=false;
  window.checkout=function(){
    if(busy)return;
    var items=Array.isArray(window.cart)?window.cart:[];
    if(!items.length){window.showToast?.('Корзина пустая');return;}
    var client=window.supabaseClient;
    if(!client||typeof client.from!=='function'){window.showToast?.('Соединение с базой не готово');return;}
    var button=document.getElementById('checkoutButton');
    var tg=window.Telegram&&window.Telegram.WebApp;
    var user=tg&&tg.initDataUnsafe&&tg.initDataUnsafe.user||{};
    var telegramId=user.id?String(user.id):null;
    var telegramUsername=user.username?String(user.username):null;
    var total=items.reduce(function(sum,item){return sum+Number(item.price||0);},0);
    var sellers=[...new Set(items.map(function(item){return item.seller_id;}).filter(Boolean).map(String))];
    var sellerId=sellers.length===1?sellers[0]:null;
    busy=true;
    if(button){button.disabled=true;button.textContent='Создаём заказ...';}
    Promise.resolve(typeof window.saveCurrentTelegramUser==='function'?window.saveCurrentTelegramUser():null)
      .then(function(){return client.from('orders').insert({telegram_id:telegramId,telegram_username:telegramUsername,total:total,status:'pending',seller_id:sellerId,seller_status:'pending',buyer_received:false}).select().single();})
      .then(function(result){
        if(result.error)throw result.error;
        var order=result.data;
        var orderItems=items.map(function(item){return {order_id:order.id,product_id:item.id,product_name:item.name,price:Number(item.price||0),quantity:Number(item.quantity||1),seller_id:item.seller_id?String(item.seller_id):null};});
        return client.from('order_items').insert(orderItems).then(function(r){if(r.error)throw r.error;return order;});
      })
      .then(function(){
        window.cart=[];
        window.saveCart?.();
        window.updateCart?.();
        window.closeCart?.();
        window.showToast?.('Заказ оформлен ✅');
        if(typeof window.loadPurchases==='function')window.loadPurchases();
      })
      .catch(function(error){console.error('EasyMarket checkout fix:',error);window.showToast?.('Ошибка оформления: '+(error&&error.message||error));})
      .finally(function(){busy=false;if(button){button.disabled=false;button.textContent='⚡ Оформить заказ';}});
  };
})();
