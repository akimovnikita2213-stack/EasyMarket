/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
  'use strict';

  /* Some legacy/secure scripts use window.supabaseClient. The main page creates
     a const supabaseClient, which is not automatically attached to window.
     Expose the same client globally before catalog actions run. */
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
  async function findProduct(title){
    try{
      var u=SUPABASE_URL+'/rest/v1/products?select=id,name,price,details,price_options&limit=1000';
      var r=await fetch(u,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY}});
      if(!r.ok)return null;
      var a=await r.json(); if(!Array.isArray(a))return null;
      var wanted=norm(title);
      return a.find(function(p){return norm(p.name)===wanted;})||null;
    }catch(e){console.warn('buyer options lookup',e);return null;}
  }
  function productId(modal){
    var el=modal.querySelector('[onclick*="addToCartFromModal"],[onclick*="buyNow"],[onclick*="addToCart"],[data-product-id]');
    if(!el)return null;
    var s=el.getAttribute('onclick')||'';
    for(var i=0;i<3;i++){
      var n=['addToCartFromModal','buyNow','addToCart'][i],p=s.indexOf(n+'(');
      if(p>=0){var raw=s.slice(p+n.length+1).split(/[),]/)[0],v=num(raw);if(v!==null)return v;}
    }
    return num(el.getAttribute('data-product-id'));
  }
  function choose(id,o){
    window.emSelectedPriceOption={productId:id,quantity:o.qty,price:o.price};
    if(typeof window.selectProductQuantity==='function'){try{window.selectProductQuantity(id,o.qty,o.price);}catch(e){console.warn(e);}}
  }
  function render(modal,p){
    var opts=optionsOf(p);if(!opts.length||modal.querySelector('#emBuyerPriceChoices'))return;
    var anchor=modal.querySelector('.product-modal-price')||modal.querySelector('.product-modal-title');if(!anchor)return;
    var box=document.createElement('div');box.id='emBuyerPriceChoices';box.style.cssText='margin:14px 0;padding:14px;border:1px solid #38bdf8;border-radius:16px;background:linear-gradient(135deg,rgba(37,99,235,.22),rgba(14,165,233,.12));';
    box.innerHTML='<div style="font-size:15px;font-weight:900;margin-bottom:10px;color:#fff">🛒 Выберите количество и цену</div><div id="emBuyerOptionsList" style="display:grid;gap:8px"></div><div id="emBuyerOptionsTotal" style="margin-top:10px;font-weight:800;color:#7dd3fc"></div>';
    anchor.parentNode.insertBefore(box,anchor.nextSibling);
    var list=box.querySelector('#emBuyerOptionsList'),total=box.querySelector('#emBuyerOptionsTotal'),id=productId(modal)||p.id;
    opts.forEach(function(o,i){
      var b=document.createElement('button');b.type='button';b.textContent=o.qty+' шт. — '+o.price+' ₽';b.style.cssText='width:100%;padding:13px 14px;border:1px solid rgba(96,165,250,.45);border-radius:12px;background:#0b1c35;color:#fff;font-weight:900;text-align:left;';
      b.onclick=function(){[].forEach.call(list.children,function(x){x.style.background='#0b1c35';x.style.borderColor='rgba(96,165,250,.45)';});b.style.background='linear-gradient(135deg,#2563eb,#0ea5e9)';b.style.borderColor='#93c5fd';total.textContent='Выбрано: '+o.qty+' шт. за '+o.price+' ₽';choose(id,o);};
      list.appendChild(b);if(i===0)b.click();
    });
  }
  async function scan(){
    if(busy)return;
    var modal=document.querySelector('.product-modal.open .product-modal-card');if(!modal||modal.querySelector('#emBuyerPriceChoices'))return;
    var title=text(modal.querySelector('.product-modal-title'));if(!title)return;
    busy=true;var p=await findProduct(title);busy=false;if(p)render(modal,p);
  }
  function boot(){scan();setInterval(scan,700);new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
