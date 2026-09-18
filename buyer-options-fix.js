/* EasyMarket buyer product choices UI v20260918-7 */
(function(){
'use strict';
var wrapped=null;
function esc(v){return typeof window.escapeHtml==='function'?window.escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])})}
function normalizeOptions(raw){
  if(typeof raw==='string'){try{raw=JSON.parse(raw)}catch(e){raw=[]}}
  if(!Array.isArray(raw))return [];
  return raw.map(function(x){return{qty:Math.max(1,Math.floor(Number(x&& (x.qty??x.quantity??x.amount))||0)),price:Math.max(0,Number(x&& (x.price??x.cost))||0)}}).filter(function(x){return x.qty>0&&Number.isFinite(x.price)})
    .sort(function(a,b){return a.qty-b.qty})
    .filter(function(x,i,a){return i===0||x.qty!==a[i-1].qty});
}
function readOptions(p){
  var opts=normalizeOptions(p&&p.price_options);
  if(!opts.length){
    var text=String(p&&p.details||'');
    var m=text.match(/<!--EM_PRICES:\s*([\s\S]*?)\s*-->/i);
    if(m)opts=normalizeOptions(m[1]);
  }
  if(!opts.length)opts=[{qty:1,price:Math.max(0,Number(p&&p.price)||0)}];
  return opts;
}
function install(){
  var current=window.openProductModal;
  if(typeof current!=='function'||current===wrapped)return;
  wrapped=current;
  window.openProductModal=function(id,initial){
    var p=(window.products||[]).find(function(x){return Number(x.id)===Number(id)}),modal=document.getElementById('productModal'),content=document.getElementById('productModalContent');
    if(!p||!modal||!content){return current.apply(this,arguments)}
    var opts=readOptions(p),chosen=opts.find(function(x){return x.qty===Number(initial)})||opts[0];
    var media=p.image_url?'<img class="product-modal-image" src="'+esc(p.image_url)+'" alt="'+esc(p.name||'')+'">':'<div class="product-modal-icon">'+esc(p.icon||'📦')+'</div>';
    content.innerHTML=media+'<div class="product-modal-title">'+esc(p.name||'')+'</div>'+
      '<div class="product-modal-label" style="margin-top:10px">Выберите количество</div>'+
      '<div id="emChoiceGrid" style="display:flex;flex-wrap:wrap;gap:6px;margin:7px 0 12px">'+
      opts.map(function(o){return'<button type="button" class="quantity-option" data-qty="'+o.qty+'" data-price="'+o.price+'" style="flex:0 0 auto;min-width:74px;padding:7px 9px;border:1px solid var(--border,#ddd);border-radius:10px;background:var(--card,#fff);font-size:12px;line-height:1.2;font-weight:700;cursor:pointer"><span style="display:block">'+o.qty+' шт.</span><span style="display:block;font-size:11px;opacity:.75;margin-top:2px">'+o.price+' ₽</span></button>'}).join('')+
      '</div><div class="product-modal-price" id="emTotalPrice">'+chosen.price+' ₽</div>'+
      (p.description?'<div class="product-modal-label">Описание</div><div class="product-modal-text">'+esc(String(p.description).replace(/<!--EM_PRICES:[\s\S]*?-->/g,'').trim())+'</div>':'')+
      '<div class="product-modal-actions"><button type="button" id="emAddQty" class="buy-btn product-buy-now">⚡ Оформить · '+chosen.price+' ₽</button></div>';
    function refresh(){content.querySelectorAll('#emChoiceGrid button').forEach(function(b){var active=Number(b.dataset.qty)===chosen.qty;b.style.background=active?'var(--accent,#2563eb)':'var(--card,#fff)';b.style.color=active?'#fff':'inherit';b.style.borderColor=active?'var(--accent,#2563eb)':'var(--border,#ddd)'});document.getElementById('emTotalPrice').textContent=chosen.price+' ₽';document.getElementById('emAddQty').textContent='⚡ Оформить · '+chosen.price+' ₽'}
    content.querySelectorAll('#emChoiceGrid button').forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();chosen={qty:Number(b.dataset.qty),price:Number(b.dataset.price)};refresh()}});
    document.getElementById('emAddQty').onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof window.addToCartFromModal==='function')window.addToCartFromModal(Number(p.id),chosen.qty);else if(typeof window.addToCart==='function')window.addToCart(Number(p.id),chosen.qty)};
    refresh();modal.classList.add('open');document.body.style.overflow='hidden';
  };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
setInterval(install,300);
})();
