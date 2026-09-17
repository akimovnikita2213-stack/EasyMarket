(function(){
  'use strict';
  var lastId=null;
  function get(name){try{return window[name]||globalThis[name]||null}catch(e){return null}}
  function firstId(modal){
    var els=modal.querySelectorAll('[onclick]');
    for(var i=0;i<els.length;i++){
      var s=els[i].getAttribute('onclick')||'';
      var m=s.match(/(?:addToCartFromModal|buyNow|addToCart)\s*\(\s*(\d+)/);
      if(m)return Number(m[1]);
    }
    return null;
  }
  function client(){return get('supabaseClient')||get('supabase')||null}
  function parseOptions(p){
    var opts=p&&p.price_options;
    if(typeof opts==='string'){try{opts=JSON.parse(opts)}catch(e){opts=null}}
    if(!Array.isArray(opts)||!opts.length){
      var text=p&&p.details?String(p.details):'';
      var m=text.match(/<!--EM_PRICES:([\s\S]*?)-->/);
      if(m){try{opts=JSON.parse(m[1])}catch(e){opts=null}}
    }
    if(!Array.isArray(opts))return [];
    return opts.map(function(o){return {qty:Number(o.qty||o.quantity),price:Number(o.price)}}).filter(function(o){return o.qty>0&&o.price>=0&&Number.isFinite(o.qty)&&Number.isFinite(o.price)})
  }
  function draw(modal,id,opts){
    if(modal.querySelector('#emBuyerPriceChoicesDb'))return;
    var price=modal.querySelector('.product-modal-price');
    var box=document.createElement('div');box.id='emBuyerPriceChoicesDb';box.style.cssText='margin:14px 0;padding:14px;border:1px solid #3b4260;border-radius:16px;background:linear-gradient(135deg,#171b35,#21152f)';
    box.innerHTML='<div style="font-size:15px;font-weight:800;margin-bottom:9px">🛍 Выберите количество и цену</div><div id="emDbVariantList" style="display:grid;gap:8px"></div><div id="emDbVariantInfo" style="margin-top:10px;color:#b8c2dc;font-size:13px"></div><button type="button" id="emDbBuy" style="width:100%;margin-top:11px;padding:13px;border:0;border-radius:12px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:#fff;font-weight:800;font-size:15px">⚡ Купить выбранный вариант</button>';
    (price||modal.firstElementChild).after(box);
    var list=box.querySelector('#emDbVariantList'),info=box.querySelector('#emDbVariantInfo'),buy=box.querySelector('#emDbBuy'),selected=opts[0];
    opts.forEach(function(o,i){
      var b=document.createElement('button');b.type='button';b.textContent=o.qty+' шт. — '+o.price+' ₽';b.style.cssText='padding:11px;border:1px solid #465078;border-radius:11px;background:#101526;color:#fff;font-weight:700;text-align:left';
      b.onclick=function(){selected=o;Array.from(list.children).forEach(function(x){x.style.borderColor='#465078';x.style.background='#101526'});b.style.borderColor='#22d3ee';b.style.background='#17324a';info.textContent='Выбрано: '+o.qty+' шт. за '+o.price+' ₽';window.emSelectedPriceOption={productId:id,quantity:o.qty,price:o.price};var fn=get('selectProductQuantity');if(typeof fn==='function'){try{fn(id,o.qty,o.price)}catch(e){}}};list.appendChild(b);
      if(i===0)b.click();
    });
    buy.onclick=function(){
      var fn=get('selectProductQuantity');if(typeof fn==='function'){try{fn(id,selected.qty,selected.price)}catch(e){}}
      var add=get('addToCartFromModal');if(typeof add==='function'){try{add(id,selected.qty,selected.price);return}catch(e){}}
      var original=modal.querySelector('.product-buy-now');if(original){original.setAttribute('onclick','addToCartFromModal('+id+','+selected.qty+','+selected.price+')');original.click()}
    };
  }
  async function scan(){
    var modal=document.querySelector('.product-modal.open .product-modal-card');if(!modal)return;
    var id=firstId(modal);if(id==null||id===lastId&&modal.querySelector('#emBuyerPriceChoicesDb'))return;
    var c=client();if(!c||!c.from)return;
    try{
      var r=await c.from('products').select('id,price,price_options,details').eq('id',id).maybeSingle();
      var opts=parseOptions(r&&r.data);if(opts.length){lastId=id;draw(modal,id,opts)}
    }catch(e){console.warn('buyer price options',e)}
  }
  function start(){setInterval(scan,500);scan()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
