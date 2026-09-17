/* EasyMarket seller quantity/price hotfix v20260918 + buyer card choices. */
(function(){
'use strict';
function form(){return document.getElementById('sellerProductForm')||document.querySelector('#sellerPanel form');}
function options(){return document.getElementById('sellerPriceOptionsRows');}
function ensure(){
  var f=form(); if(!f)return;
  var box=options();
  if(!box){
    var wrap=document.createElement('div');
    wrap.className='form-group seller-price-options-wrap';
    wrap.innerHTML='<label style="display:block;font-size:13px;font-weight:800;margin-bottom:7px;color:#e7e9ef">💰 Количество и цена</label><div id="sellerPriceOptionsRows"></div><button type="button" id="sellerAddPriceOptionBtn" class="admin-btn secondary" style="width:100%;margin-top:8px">＋ Добавить вариант количества</button><input id="sellerPriceOptions" type="hidden"><div style="font-size:11px;color:#858b99;margin-top:7px">Например: 1 шт. — 100 ₽, 5 шт. — 450 ₽.</div>';
    var stock=document.getElementById('sellerProductStock');
    if(stock&&stock.parentNode)stock.parentNode.insertAdjacentElement('afterend',wrap);else f.appendChild(wrap);
    box=options();
  }
  var add=document.getElementById('sellerAddPriceOptionBtn');
  if(add&&!add.dataset.bound){add.dataset.bound='1';add.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();row();});}
  if(box&&!box.children.length){row(Number(document.getElementById('sellerProductStock')?.value||1),Number(document.getElementById('sellerProductPrice')?.value||0));}
  sync();
}
function row(qty,price){
  var box=options();if(!box)return;
  var r=document.createElement('div');r.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
  r.innerHTML='<input class="seller-input seller-option-qty" type="number" min="1" step="1" placeholder="Количество, шт." value="'+(qty==null?'':qty)+'"><input class="seller-input seller-option-price" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+(price==null?'':price)+'"><button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 12px">×</button>';
  box.appendChild(r);r.querySelectorAll('input').forEach(function(x){x.addEventListener('input',sync)});r.querySelector('.seller-option-remove').addEventListener('click',function(e){e.preventDefault();r.remove();sync()});sync();
}
function sync(){
  var box=options(),out=[];if(!box)return;
  box.querySelectorAll(':scope > div').forEach(function(r){var q=Number(r.querySelector('.seller-option-qty')?.value),p=Number(r.querySelector('.seller-option-price')?.value);if(q>0&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)})});
  var seen={};out=out.filter(function(x){if(seen[x.qty])return false;seen[x.qty]=1;return true});
  var h=document.getElementById('sellerPriceOptions');if(h)h.value=JSON.stringify(out);
}
function init(){ensure();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
setInterval(init,1000);

function cardOptions(product){
  var list=Array.isArray(product&&product.price_options)?product.price_options:[];
  if(!list.length){var m=String(product&&product.details||'').match(/<!--EM_PRICES:([\\s\\S]*?)-->/);if(m)try{list=JSON.parse(m[1])}catch(e){}}
  if(!Array.isArray(list)||!list.length)list=[{qty:1,price:Number(product&&product.price||0)}];
  return list.map(function(x){return {qty:Number(x.qty),price:Number(x.price)}}).filter(function(x){return x.qty>0&&x.price>=0});
}
function getProductId(card){
  var text=String(card.getAttribute('onclick')||'');var m=text.match(/openProductModal\\(\\s*(\\d+)/);if(m)return Number(m[1]);
  var el=card.querySelector('[onclick*="openProductModal"],[onclick*="addToCart"]');text=String(el&&el.getAttribute('onclick')||'');m=text.match(/(?:openProductModal|addToCart)\\(\\s*(\\d+)/);return m?Number(m[1]):null;
}
function installBuyerCards(){
  var products=Array.isArray(window.products)?window.products:[];
  document.querySelectorAll('#products .product').forEach(function(card){
    if(card.dataset.emBuyerChoices==='1')return;
    var id=getProductId(card);if(id==null)return;
    var product=products.find(function(p){return Number(p.id)===id});if(!product)return;
    var opts=cardOptions(product);if(!opts.length)return;
    var host=card.querySelector('.product-bottom')||card;
    var box=document.createElement('div');box.className='em-buyer-choices';box.style.cssText='margin:8px 0;display:flex;flex-wrap:wrap;gap:5px;';
    opts.forEach(function(opt,index){
      var b=document.createElement('button');b.type='button';b.textContent=opt.qty+' шт. · '+opt.price+' ₽';b.style.cssText='border:1px solid #34394a;background:'+(index===0?'#6c63ff':'#202431')+';color:#fff;border-radius:8px;padding:7px 8px;font-size:11px;font-weight:700;';
      b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();box.querySelectorAll('button').forEach(function(x){x.style.background='#202431'});b.style.background='#6c63ff';var price=card.querySelector('.price');if(price)price.textContent=opt.price+' ₽';var buy=card.querySelector('.buy-btn');if(buy){buy.dataset.emQty=String(opt.qty);buy.dataset.emPrice=String(opt.price);buy.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(typeof window.addToCart==='function')window.addToCart(id,opt.qty);};}});
      box.appendChild(b);
    });
    if(host===card)card.insertBefore(box,card.firstChild);else host.parentNode.insertBefore(box,host);
    var first=opts[0],buy=card.querySelector('.buy-btn');if(buy){buy.dataset.emQty=String(first.qty);buy.dataset.emPrice=String(first.price);buy.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(typeof window.addToCart==='function')window.addToCart(id,first.qty);};}
    card.dataset.emBuyerChoices='1';
  });
}
function buyerInit(){installBuyerCards();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',buyerInit);else buyerInit();
new MutationObserver(buyerInit).observe(document.documentElement,{childList:true,subtree:true});
setInterval(buyerInit,1000);
})();
