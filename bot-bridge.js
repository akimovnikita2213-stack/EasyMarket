(function(){
'use strict';
const U='https://uhmgjcoyxehknkehfbbj.supabase.co';
const K='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
let db, products=[], cart=[];
const tg=window.Telegram&&window.Telegram.WebApp;
const esc=s=>String(s==null?'':s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
function opts(p){
 if(Array.isArray(p.price_options)&&p.price_options.length)return p.price_options.map(x=>({qty:+x.qty,price:+x.price})).filter(x=>x.qty>0&&x.price>=0);
 const m=String(p.details||'').match(/<!--EM_PRICES:(.*?)-->/);
 if(m)try{const a=JSON.parse(m[1]);if(Array.isArray(a)&&a.length)return a.map(x=>({qty:+x.qty,price:+x.price})).filter(x=>x.qty>0&&x.price>=0)}catch(e){}
 return [{qty:1,price:+p.price||0}];
}
function toast(s){try{if(typeof window.showToast==='function')return window.showToast(s);if(tg&&tg.showPopup)tg.showPopup({title:'EasyMarket',message:String(s).slice(0,190),buttons:[{id:'ok',type:'ok',text:'OK'}]})}catch(e){}}
function save(){try{localStorage.setItem('easymarket_cart',JSON.stringify(cart))}catch(e){}}
function loadCart(){try{const x=JSON.parse(localStorage.getItem('easymarket_cart')||'[]');cart=Array.isArray(x)?x:[]}catch(e){cart=[]}}
function drawCart(){
 const box=document.getElementById('cartItems'),total=document.getElementById('cartTotal'),btn=document.getElementById('checkoutButton');if(!box)return;
 if(!cart.length){box.innerHTML='<div class="empty" style="padding:30px 10px">Корзина пустая 🛒</div>';if(total)total.textContent='0 ₽';if(btn){btn.disabled=true;btn.textContent='Корзина пустая'}return}
 let sum=0;box.innerHTML=cart.map((p,i)=>{sum+=+p.price||0;return '<div class="cart-item"><div><div class="cart-item-name">'+esc(p.name)+'</div><div class="cart-item-price">'+(+p.price||0)+' ₽ · '+(+p.quantity||1)+' шт.</div></div><button class="remove-btn" data-em-remove="'+i+'">✕</button></div>'}).join('');if(total)total.textContent=sum+' ₽';if(btn){btn.disabled=false;btn.textContent='⚡ Оформить заказ'}
}
function openCart(){document.getElementById('cartPanel')?.classList.add('open');drawCart()}
function closeModal(){document.getElementById('productModal')?.classList.remove('open');document.body.style.overflow=''}
function addToCartFixed(p,q){const o=opts(p).find(x=>+x.qty===+q)||opts(p)[0];const i=cart.findIndex(x=>+x.id===+p.id);const item={...p,quantity:+o.qty,price:+o.price};if(i<0)cart.push(item);else cart[i]=item;save();drawCart();toast('Товар добавлен в корзину 🛒');openCart()}
function openProductFixed(p,q){
 const modal=document.getElementById('productModal'),content=document.getElementById('productModalContent');if(!modal||!content)return;
 const list=opts(p),selected=list.find(x=>+x.qty===+q)||list[0];
 const media=p.image_url?'<img class="product-modal-image" src="'+esc(p.image_url)+'" alt="'+esc(p.name)+'">':'<div class="product-modal-icon">'+esc(p.icon||'📦')+'</div>';
 const qty=list.length>1?'<div class="product-modal-label">Количество</div><div class="quantity-options">'+list.map(x=>'<button type="button" class="quantity-option '+(+x.qty===+selected.qty?'active':'')+'" data-em-qty="'+x.qty+'">'+x.qty+' шт. <small>'+x.price+' ₽</small></button>').join('')+'</div>':'';
 content.innerHTML=media+'<div class="product-modal-title">'+esc(p.name)+'</div><div class="product-modal-price">'+(+selected.price||0)+' ₽</div>'+qty+(p.description?'<div class="product-modal-label">Описание</div><div class="product-modal-text">'+esc(p.description)+'</div>':'')+'<div class="product-modal-actions"><button type="button" class="buy-btn" id="em-fixed-buy">⚡ Оформить</button></div>';
 modal.classList.add('open');document.body.style.overflow='hidden';
 content.querySelectorAll('[data-em-qty]').forEach(b=>b.onclick=()=>openProductFixed(p,+b.dataset.emQty));
 document.getElementById('em-fixed-buy').onclick=()=>{addToCartFixed(p,selected.qty);closeModal()};
}
function renderFixed(){
 const box=document.getElementById('products');if(!box)return;
 const q=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();
 const list=products.filter(p=>(!p.seller_id||String(p.approval_status||'approved')==='approved')&&(!q||String(p.name||'').toLowerCase().includes(q)||String(p.description||'').toLowerCase().includes(q)));
 box.innerHTML=list.length?list.map(p=>'<div class="product" data-em-product="'+p.id+'">'+(p.image_url?'<img class="product-image" src="'+esc(p.image_url)+'" alt="'+esc(p.name)+'">':'<div class="product-icon">'+esc(p.icon||'📦')+'</div>')+'<div class="product-name">'+esc(p.name)+'</div><div class="product-description">'+esc(p.description||'')+'</div><div class="product-bottom"><div class="product-cart-action"><div class="price">'+(+p.price||0)+' ₽</div><button class="buy-btn" data-em-buy="'+p.id+'">⚡ Оформить</button></div></div></div>').join(''):'<div class="empty">Товары не найдены 📦</div>';
 box.querySelectorAll('[data-em-product]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-em-buy]'))return;const p=products.find(x=>+x.id===+card.dataset.emProduct);if(p)openProductFixed(p)});
 box.querySelectorAll('[data-em-buy]').forEach(b=>b.onclick=e=>{e.stopPropagation();const p=products.find(x=>+x.id===+b.dataset.emBuy);if(p)addToCartFixed(p,opts(p)[0].qty)});
}
async function checkoutFixed(){
 if(!cart.length)return toast('Корзина пустая');const u=tg?.initDataUnsafe?.user||{},total=cart.reduce((s,p)=>s+(+p.price||0),0);
 try{const r=await db.from('orders').insert({telegram_id:u.id?String(u.id):null,telegram_username:u.username?String(u.username):null,total,status:'pending',seller_id:null,seller_status:'pending',buyer_received:false}).select().single();if(r.error)throw r.error;const rows=cart.map(p=>({order_id:r.data.id,product_id:p.id,product_name:p.name,price:+p.price||0,quantity:+p.quantity||1,seller_id:p.seller_id?String(p.seller_id):null}));const ir=await db.from('order_items').insert(rows);if(ir.error)throw ir.error;try{await db.functions.invoke('notify-order',{body:{record:r.data,items:rows,status_text:'В ожидании'}})}catch(e){}cart=[];save();drawCart();document.getElementById('cartPanel')?.classList.remove('open');toast('Заказ №'+r.data.id+' создан ✅');try{tg?.showAlert?.('Заказ №'+r.data.id+' оформлен!')}catch(e){}}
 catch(e){toast('Ошибка оформления: '+(e?.message||e))}
}
async function start(){
 loadCart();drawCart();
 try{db=window.supabase.createClient(U,K);const r=await db.from('products').select('*').order('id',{ascending:false});if(r.error)throw r.error;products=r.data||[];renderFixed()}catch(e){console.error('EasyMarket fixed bridge',e)}
 document.getElementById('searchInput')?.addEventListener('input',renderFixed);
 document.addEventListener('click',e=>{const rm=e.target.closest('[data-em-remove]');if(rm){cart.splice(+rm.dataset.emRemove,1);save();drawCart()}if(e.target.id==='checkoutButton')checkoutFixed()},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.emFixed={openProductFixed,addToCartFixed,openCart,checkoutFixed};
})();
