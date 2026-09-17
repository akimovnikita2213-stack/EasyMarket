/* EasyMarket seller quantity/price options + buyer compatibility fixes. */
(function(){
'use strict';

if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){
  const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co';
  const SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
  window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}

function handleModalCheckoutClick(ev){
  if(!ev||ev.type!=='click'||!ev.target||!ev.target.closest)return;
  var el=ev.target.closest('.product-modal .product-buy-now');
  if(!el)return;
  var code=el.getAttribute('onclick')||'';
  var m=code.match(/addToCartFromModal\(\s*([0-9]+)\s*,\s*([0-9]+)/);
  var productId=m?Number(m[1]):NaN;
  var qty=m?Number(m[2]):NaN;
  if(!Number.isFinite(productId))return;
  if(!Number.isFinite(qty)||qty<=0){
    var active=el.closest('.product-modal')&&el.closest('.product-modal').querySelector('.quantity-option.active');
    var qm=active&&((active.textContent||'').match(/\d+/));
    qty=qm?Number(qm[0]):1;
  }
  ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
  try{
    if(typeof window.addToCartFromModal==='function')window.addToCartFromModal(productId,qty);
    else if(typeof window.addToCart==='function')window.addToCart(productId,qty);
  }catch(err){console.error('EasyMarket modal checkout:',err);}
}
window.addEventListener('click',handleModalCheckoutClick,true);

function renameCardCheckoutButtons(root){
  var scope=root&&root.querySelectorAll?root:document;
  scope.querySelectorAll('.product-buy-now').forEach(function(btn){
    if(btn.closest('.product-modal'))return;
    btn.textContent='Оформить заказ';
  });
}
renameCardCheckoutButtons(document);

/* ---------- SELLER PRODUCT OPTIONS ---------- */
function sellerForm(){return document.getElementById('sellerProductForm');}

function sellerOptionsBox(){
  var form=sellerForm();
  if(!form)return null;

  var rows=document.getElementById('sellerPriceOptionsRows');
  if(rows){
    bindSellerAddButton();
    return rows;
  }

  var wrap=document.createElement('div');
  wrap.id='sellerPriceOptionsWrap';
  wrap.className='form-group';
  wrap.style.cssText='margin-top:14px;padding:14px;border:1px solid #292d38;border-radius:14px;background:#191c25;';
  wrap.innerHTML=
    '<label style="display:block;margin-bottom:9px;font-weight:700;color:#fff;">Количество и цена</label>'+ 
    '<div id="sellerPriceOptionsRows"></div>'+ 
    '<button type="button" id="sellerAddPriceOptionBtn" class="admin-btn secondary" style="margin-top:8px;width:100%;">＋ Добавить вариант количества</button>'+ 
    '<input id="sellerPriceOptions" type="hidden" value="">'+
    '<div style="font-size:11px;color:#858b99;margin-top:7px;line-height:1.4;">Укажи количество товара и общую цену для каждого варианта. Покупатель сможет выбрать вариант при оформлении заказа.</div>';

  var price=document.getElementById('sellerProductPrice');
  var stock=document.getElementById('sellerProductStock');
  var priceRow=price&&price.closest('.seller-form-row');
  if(priceRow&&priceRow.parentNode){
    priceRow.parentNode.insertBefore(wrap,priceRow.nextSibling);
  }else if(stock&&stock.parentNode){
    stock.parentNode.parentNode.insertBefore(wrap,stock.parentNode.nextSibling);
  }else{
    form.appendChild(wrap);
  }
  bindSellerAddButton();
  return document.getElementById('sellerPriceOptionsRows');
}

function bindSellerAddButton(){
  var btn=document.getElementById('sellerAddPriceOptionBtn');
  if(!btn||btn.__easyBound)return;
  btn.__easyBound=true;
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    addSellerPriceOptionRow('','');
  });
}

function addSellerPriceOptionRow(qty,price){
  var box=sellerOptionsBox();
  if(!box)return;
  qty=qty==null?'':qty;
  price=price==null?'':price;
  var row=document.createElement('div');
  row.className='seller-price-option-row';
  row.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 42px;gap:8px;margin-bottom:8px;align-items:center;';
  row.innerHTML=
    '<input class="seller-input seller-option-qty" type="number" min="1" step="1" inputmode="numeric" placeholder="Количество, шт." value="'+String(qty)+'">'+
    '<input class="seller-input seller-option-price" type="number" min="0" step="1" inputmode="numeric" placeholder="Цена, ₽" value="'+String(price)+'">'+
    '<button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 0;min-width:42px;">×</button>';
  box.appendChild(row);

  var q=row.querySelector('.seller-option-qty');
  var p=row.querySelector('.seller-option-price');
  if(q)q.addEventListener('input',syncSellerPriceOptionsField);
  if(p)p.addEventListener('input',syncSellerPriceOptionsField);
  var remove=row.querySelector('.seller-option-remove');
  if(remove)remove.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();row.remove();syncSellerPriceOptionsField();
  });
  syncSellerPriceOptionsField();
}

function collectSellerPriceOptions(){
  var box=document.getElementById('sellerPriceOptionsRows');
  var out=[];
  if(box){
    Array.prototype.forEach.call(box.querySelectorAll('.seller-price-option-row'),function(row){
      var q=Number(row.querySelector('.seller-option-qty')&&row.querySelector('.seller-option-qty').value);
      var p=Number(row.querySelector('.seller-option-price')&&row.querySelector('.seller-option-price').value);
      if(Number.isFinite(q)&&q>0&&Number.isFinite(p)&&p>=0){
        out.push({qty:Math.floor(q),price:Math.floor(p)});
      }
    });
  }
  var seen={};
  out=out.filter(function(x){var key=String(x.qty);if(seen[key])return false;seen[key]=true;return true;});
  return out;
}

function syncSellerPriceOptionsField(){
  var opts=collectSellerPriceOptions();
  var hidden=document.getElementById('sellerPriceOptions');
  if(hidden)hidden.value=JSON.stringify(opts);
  return opts;
}

function ensureSellerOptionRow(){
  var box=sellerOptionsBox();
  if(!box||box.children.length)return;
  var stockEl=document.getElementById('sellerProductStock');
  var priceEl=document.getElementById('sellerProductPrice');
  var stock=Number(stockEl&&stockEl.value);
  var price=Number(priceEl&&priceEl.value);
  addSellerPriceOptionRow(stock>0?stock:'',Number.isFinite(price)&&price>=0&&price!==0?price:'');
}

function prepareSellerSave(){
  var opts=syncSellerPriceOptionsField();
  var details=document.getElementById('sellerProductDetails');
  if(details){
    var clean=(details.value||'').replace(/<!--EM_PRICES:.*?-->/g,'').trim();
    if(opts.length)details.value=(clean?clean+'\n':'')+'<!--EM_PRICES:'+JSON.stringify(opts)+'-->';
  }
  var priceEl=document.getElementById('sellerProductPrice');
  var stockEl=document.getElementById('sellerProductStock');
  if(opts.length){
    if(priceEl)priceEl.value=String(opts[0].price);
    if(stockEl)stockEl.value=String(opts[0].qty);
  }
  return opts;
}

function wrapSellerSave(){
  if(typeof window.saveSellerProduct!=='function'||window.saveSellerProduct.__easyOptionsWrapped)return;
  var original=window.saveSellerProduct;
  function wrappedSellerSave(event){
    prepareSellerSave();
    return original.call(this,event);
  }
  wrappedSellerSave.__easyOptionsWrapped=true;
  window.saveSellerProduct=wrappedSellerSave;
}

/* Ensure the actual products INSERT also receives price_options JSONB. */
function wrapProductsInsert(){
  var client=window.supabaseClient;
  if(!client||client.__easyProductsInsertWrapped)return;
  var originalFrom=client.from.bind(client);
  client.from=function(table){
    var query=originalFrom(table);
    if(table!=='products'||!query||typeof query.insert!=='function')return query;
    if(query.__easyInsertWrapped)return query;
    var originalInsert=query.insert.bind(query);
    query.insert=function(values){
      try{
        if(Array.isArray(values)){
          values=values.map(function(v){return addOptionsToPayload(v);});
        }else if(values&&typeof values==='object'){
          values=addOptionsToPayload(values);
        }
      }catch(err){console.error('EasyMarket products insert options:',err);}
      return originalInsert(values);
    };
    query.__easyInsertWrapped=true;
    return query;
  };
  client.__easyProductsInsertWrapped=true;
}

function addOptionsToPayload(payload){
  if(!payload||typeof payload!=='object')return payload;
  var opts=collectSellerPriceOptions();
  if(!opts.length)return payload;
  var copy=Object.assign({},payload);
  copy.price_options=opts;
  return copy;
}

function initSellerOptions(){
  var form=sellerForm();
  if(!form)return;
  sellerOptionsBox();
  bindSellerAddButton();
  ensureSellerOptionRow();
  wrapSellerSave();
  wrapProductsInsert();
  syncSellerPriceOptionsField();
}

/* Run repeatedly because the seller panel/form is created after app startup. */
var sellerInitTimer=null;
function startSellerWatcher(){
  initSellerOptions();
  if(sellerInitTimer)return;
  var tries=0;
  sellerInitTimer=setInterval(function(){
    tries++;
    initSellerOptions();
    if(tries>=300){clearInterval(sellerInitTimer);sellerInitTimer=null;}
  },100);
}

/* Any click that opens the seller panel gets an immediate second pass. */
document.addEventListener('click',function(e){
  var target=e.target&&e.target.closest?e.target.closest('button,a,[onclick]'):null;
  if(!target)return;
  var text=((target.textContent||'')+' '+(target.getAttribute('onclick')||'')).toLowerCase();
  if(text.indexOf('добавить товар')!==-1||text.indexOf('addseller')!==-1||text.indexOf('sellerproductform')!==-1){
    setTimeout(initSellerOptions,0);
    setTimeout(initSellerOptions,50);
    setTimeout(initSellerOptions,200);
    setTimeout(initSellerOptions,500);
  }
},true);

if(window.MutationObserver){
  var observer=new MutationObserver(function(mutations){
    var changed=false;
    mutations.forEach(function(m){
      if(m.addedNodes&&m.addedNodes.length)changed=true;
      if(m.removedNodes&&m.removedNodes.length)changed=true;
    });
    if(changed){
      renameCardCheckoutButtons(document);
      initSellerOptions();
    }
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
}

/* ADMIN quantity/price form remains supported. */
function wrapAdminProductForm(){
  if(typeof window.showProductForm==='function'&&!window.showProductForm.__safeWrapped){
    var originalShow=window.showProductForm;
    function safeShow(){
      try{originalShow.apply(this,arguments);}catch(err){console.error('EasyMarket showProductForm:',err);}
      var form=document.getElementById('productForm');
      if(form)form.style.display='block';
      var rows=document.getElementById('productPriceOptionsRows');
      if(rows&&typeof window.addPriceOptionRow==='function'&&!rows.children.length)window.addPriceOptionRow(1,'');
      var options=document.getElementById('productPriceOptions');
      if(options&&typeof window.syncPriceOptionsField==='function')window.syncPriceOptionsField();
    }
    safeShow.__safeWrapped=true;
    window.showProductForm=safeShow;
  }
}
function bindAdminAddButton(){
  var btn=document.querySelector('[onclick*="showProductForm"]');
  if(!btn||btn.__easyBound)return;
  btn.__easyBound=true;
  btn.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(typeof window.showProductForm==='function')window.showProductForm();
  },true);
}

function initAll(){
  renameCardCheckoutButtons(document);
  initSellerOptions();
  wrapAdminProductForm();
  bindAdminAddButton();
  startSellerWatcher();
}

initAll();
setTimeout(initAll,100);
setTimeout(initAll,500);
setTimeout(initAll,1200);
setTimeout(initAll,2500);
setTimeout(initAll,5000);
})();
