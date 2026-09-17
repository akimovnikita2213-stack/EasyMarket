/* EasyMarket buyer options + global Supabase compatibility fix. */
(function(){
'use strict';
if(!window.supabaseClient&&window.supabase&&typeof window.supabase.createClient==='function'){const SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co',SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);}
function text(el){return el?String(el.textContent||'').replace(/\s+/g,' ').trim():''}
function num(v){var n=Number(v);return Number.isFinite(n)?n:null}
function norm(s){return String(s||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
function getQty(el){if(!el)return null;var q=num(el.dataset&&el.dataset.qty);if(q>0)return Math.floor(q);var s=el.getAttribute&&el.getAttribute('onclick')||'',m=s.match(/selectProductQuantity\s*\(\s*[^,]+\s*,\s*([0-9.]+)/);if(m)return Math.floor(Number(m[1]));m=text(el).match(/(\d+)\s*(?:шт|штук)/i);return m?Number(m[1]):null}
function bind(modal){var btn=modal&&modal.querySelector('.product-buy-now');if(!btn||btn.__emFinalBound)return;btn.__emFinalBound=true;btn.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();var id=modal.__emProductId,raw=btn.getAttribute('onclick')||'',m=raw.match(/\((\d+)\s*,\s*([0-9.]+)/);if(!id&&m)id=Number(m[1]);var active=modal.querySelector('.quantity-options button.active,.quantity-option.active'),qty=getQty(active)||1;if(!id){var title=text(modal.querySelector('.product-modal-title')),p=Array.isArray(window.products)?window.products.find(function(x){return norm(x.name)===norm(title)}):null;if(p)id=Number(p.id);}if(!id){window.showToast&&window.showToast('Не удалось определить товар');return;}if(typeof window.addToCart==='function'){var ok=window.addToCart(id,qty);if(ok!==false&&typeof window.closeProductModal==='function')window.closeProductModal();}},true)}
function scan(){var m=document.querySelector('.product-modal.open .product-modal-card');if(!m)return;var b=m.querySelector('.product-buy-now'),s=b&&b.getAttribute('onclick')||'',x=s.match(/\((\d+)\s*,/);if(x)m.__emProductId=Number(x[1]);bind(m)}
function boot(){scan();setInterval(scan,250);new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
