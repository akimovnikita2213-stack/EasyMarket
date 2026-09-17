/* EasyMarket seller quantity/price hotfix v20260918. */
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
  if(add&&!add.dataset.bound){
    add.dataset.bound='1';
    add.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();row();});
  }
  if(box&&!box.children.length){
    row(Number(document.getElementById('sellerProductStock')?.value||1),Number(document.getElementById('sellerProductPrice')?.value||0));
  }
  sync();
}
function row(qty,price){
  var box=options();if(!box)return;
  var r=document.createElement('div');r.style.cssText='display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:center';
  r.innerHTML='<input class="seller-input seller-option-qty" type="number" min="1" step="1" placeholder="Количество, шт." value="'+(qty==null?'':qty)+'"><input class="seller-input seller-option-price" type="number" min="0" step="1" placeholder="Цена, ₽" value="'+(price==null?'':price)+'"><button type="button" class="admin-btn danger seller-option-remove" style="padding:9px 12px">×</button>';
  box.appendChild(r);
  r.querySelectorAll('input').forEach(function(x){x.addEventListener('input',sync)});
  r.querySelector('.seller-option-remove').addEventListener('click',function(e){e.preventDefault();r.remove();sync()});
  sync();
}
function sync(){
  var box=options(),out=[];if(!box)return;
  box.querySelectorAll(':scope > div').forEach(function(r){var q=Number(r.querySelector('.seller-option-qty')?.value),p=Number(r.querySelector('.seller-option-price')?.value);if(q>0&&p>=0)out.push({qty:Math.floor(q),price:Math.floor(p)})});
  var seen={};out=out.filter(function(x){if(seen[x.qty])return false;seen[x.qty]=1;return true});
  var h=document.getElementById('sellerPriceOptions');if(h)h.value=JSON.stringify(out);
}

/* Buyer product-card quantity and price selector. */
function cardOptions(product){
  var out=Array.isArray(product&&product.price_options)?product.price_options:[];
  if(!out.length){
    var m=String(product&&product.details||'').match(/<!--EM_PRICES:([\\s\\S]*?)-->/);
    if(m)try{out=JSON.parse(m[1])}catch(_){out=[];}
  }
  if(!Array.isArray(out)||!out.length)out=[{qty:1,price:Number(product&&product.price||0)}];
  return out.map(function(x){return {qty:Math.max(1,Math.floor(Number(x.qty)||1)),price:Math.max(0,Number(x.price)||0)};})
    .filter(function(x){return Number.isFinite(x.qty)&&Number.isFinite(x.price);});
}
function addBuyerChoices(){
  if(typeof window.renderProducts!=='function'||window.renderProducts.__emBuyerChoices)return;
  var original=window.renderProducts;
  function enhance(){
    document.querySelectorAll('#products .product').forEach(function(card){
      if(card.querySelector('.em-buyer-choices'))return;
      var match=String(card.getAttribute('onclick')||'').match(/openProductModal\\(\\s*(\\d+)/);
      if(!match)return;
      var product=(window.products||[]).find(function(p){return Number(p.id)===Number(match[1]);});
      if(!product)return;
      var opts=cardOptions(product);
      if(opts.length<2)return;
      var selected=opts[0];
      var wrap=document.createElement('div');
      wrap.className='em-buyer-choices';
      wrap.style.cssText='margin:8px 0 10px;display:flex;flex-wrap:wrap;gap:6px;';
      var priceEl=card.querySelector('.price');
      var buy=card.querySelector('.product-buy-now');
      function select(opt,button){
        selected=opt;
        wrap.querySelectorAll('button').forEach(function(b){
          b.style.background='#151821';b.style.borderColor='#383e50';
        });
        button.style.background='#6c63ff';button.style.borderColor='#6c63ff';
        if(priceEl)priceEl.textContent=Number(opt.price)+' ₽';
        if(buy)buy.setAttribute('onclick','event.stopPropagation();addToCart('+Number(product.id)+','+Number(opt.qty)+')');
      }
      opts.forEach(function(opt,index){
        var b=document.createElement('button');
        b.type='button';
        b.textContent=Number(opt.qty)+' шт. · '+Number(opt.price)+' ₽';
        b.style.cssText='border:1px solid '+(index===0?'#6c63ff':'#383e50')+';background:'+(index===0?'#6c63ff':'#151821')+';color:#fff;border-radius:9px;padding:7px 8px;font-size:11px;font-weight:700;';
        b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();select(opt,b);});
        wrap.appendChild(b);
      });
      if(priceEl)priceEl.textContent=Number(selected.price)+' ₽';
      if(buy)buy.setAttribute('onclick','event.stopPropagation();addToCart('+Number(product.id)+','+Number(selected.qty)+')');
      var bottom=card.querySelector('.product-bottom');
      if(bottom&&bottom.parentNode)bottom.parentNode.insertBefore(wrap,bottom);
    });
  }
  window.renderProducts=function(){var result=original.apply(this,arguments);enhance();return result;};
  window.renderProducts.__emBuyerChoices=true;
  enhance();
}
function init(){ensure();addBuyerChoices();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
setInterval(init,1000);
})();
