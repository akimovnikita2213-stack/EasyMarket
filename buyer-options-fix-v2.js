/* EasyMarket buyer/seller quantity-price fix v2. Safe additive layer. */
(function(){
'use strict';
var MARK='data-em-options-v2';
function num(v,d){var n=Number(v);return Number.isFinite(n)?n:d}
function readOptions(p){
  var a=Array.isArray(p&&p.price_options)?p.price_options:null;
  if(!a||!a.length){
    var m=String(p&&p.details||'').match(/<!--EM_PRICES:([\s\S]*?)-->/);
    if(m){try{a=JSON.parse(m[1])}catch(e){a=null}}
  }
  if(!Array.isArray(a)||!a.length)a=[{qty:Math.max(1,num(p&&p.stock,1)),price:Math.max(0,num(p&&p.price,0))}];
  return a.map(function(x){return {qty:Math.max(1,Math.floor(num(x.qty,1))),price:Math.max(0,num(x.price,0))}}).filter(function(x){return x.price>=0&&x.qty>0});
}
function text(a){return a.map(function(x){return x.qty+' шт. — '+x.price+' ₽'}).join(' · ')}
function decorate(){
  var products=Array.isArray(window.products)?window.products:[];
  document.querySelectorAll('.product').forEach(function(card){
    if(card.getAttribute(MARK)==='1')return;
    var onclick=card.getAttribute('onclick')||'',m=onclick.match(/openProductModal\(\s*(\d+)/);if(!m)return;
    var p=products.find(function(x){return String(x.id)===m[1]});if(!p)return;
    var a=readOptions(p),node=document.createElement('div');node.className='em-options-v2';node.textContent='💰 '+text(a);node.style.cssText='font-size:11px;color:#b8b5ff;line-height:1.35;margin:5px 0;';
    var anchor=card.querySelector('.product-bottom')||card.lastElementChild; if(anchor)anchor.parentNode.insertBefore(node,anchor);
    card.setAttribute(MARK,'1');
  });
}
function modal(){
  var modal=document.getElementById('productModal');if(!modal||modal.getAttribute(MARK)==='1')return;
  var title=modal.querySelector('.product-modal-title');if(!title)return;
  var products=Array.isArray(window.products)?window.products:[],p=products.find(function(x){return String(x.id)===String(window.currentProductId||window.selectedProductId||'' )});
  if(!p){var b=modal.querySelector('.product-modal-actions .product-buy-now'),c=b&&b.getAttribute('onclick')||'',m=c.match(/addToCartFromModal\(\s*(\d+)/);if(m)p=products.find(function(x){return String(x.id)===m[1]})}
  if(!p)return;
  var old=modal.querySelector('.em-options-modal-v2');if(old)old.remove();var n=document.createElement('div');n.className='em-options-modal-v2';n.textContent='💰 Количество и цены: '+text(readOptions(p));n.style.cssText='margin:8px 0;color:#c6c2ff;font-size:13px;line-height:1.5;';title.parentNode.insertBefore(n,title.nextSibling);modal.setAttribute(MARK,'1');
}
function run(){decorate();modal()}
window.addEventListener('load',function(){run();new MutationObserver(function(){run()}).observe(document.body,{childList:true,subtree:true});setInterval(run,1000)});
})();
