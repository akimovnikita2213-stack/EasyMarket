/* EasyMarket Supabase bootstrap + normal click fix v20260918-9. */
(function(){
'use strict';
var API='https://uhmgjcoyxehknkehfbbj.supabase.co/functions/v1/easymarket-api';
var SUPABASE_URL='https://uhmgjcoyxehknkehfbbj.supabase.co';
var SUPABASE_KEY='sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';
function makeRestClient(){
 function request(table,method,params,body){var url=SUPABASE_URL+'/rest/v1/'+table,qs=[];Object.keys(params||{}).forEach(function(k){qs.push(encodeURIComponent(k)+'='+encodeURIComponent(params[k]));});if(qs.length)url+='?'+qs.join('&');return fetch(url,{method:method,headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)}).then(function(r){return r.text().then(function(t){var d;try{d=t?JSON.parse(t):null}catch(e){d=null}return{data:r.ok?d:null,error:r.ok?null:{message:t||('HTTP '+r.status)}}})})}
 function from(table){var method='GET',params={select:'*'},body,headOnly=false;var q={select:function(v){params.select=v||'*';return q},eq:function(k,v){params[k]='eq.'+v;return q},neq:function(k,v){params[k]='neq.'+v;return q},order:function(k,o){params.order=k+(o&&o.ascending===false?'.desc':'');return q},limit:function(v){params.limit=v;return q},single:function(){headOnly=true;return q},maybeSingle:function(){headOnly=true;return q},insert:function(v){method='POST';body=v;return q},update:function(v){method='PATCH';body=v;return q},delete:function(){method='DELETE';return q},then:function(a,b){return request(table,method,params,body).then(function(r){if(headOnly&&Array.isArray(r.data))r.data=r.data[0]||null;return r}).then(a,b)}};return q}
 return{from:from}
}
function ensureClient(){if(window.supabaseClient&&typeof window.supabaseClient.from==='function')return true;if(window.supabase&&typeof window.supabase.createClient==='function'){window.supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);return true}if(!window.supabaseClient)window.supabaseClient=makeRestClient();return!!window.supabaseClient}
ensureClient();
window.emSecureApi=async function(action,payload){var tg=window.Telegram&&window.Telegram.WebApp,initData=tg&&tg.initData||'';if(!initData)throw new Error('Откройте Mini App из Telegram');var response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:action,payload:payload||{},initData:initData})});var data=await response.json().catch(function(){return null});if(!response.ok||!data||data.success===false)throw new Error(data&&data.error||'Ошибка сервера');return data};
function install(){ensureClient();var modal=document.getElementById('productModal');if(!modal||modal.dataset.emGuardInstalled==='1')return;modal.dataset.emGuardInstalled='1';modal.addEventListener('click',function(e){if(e.target!==modal)return;e.preventDefault();e.stopPropagation();if(typeof window.closeProductModal==='function')window.closeProductModal();else{modal.classList.remove('open');document.body.style.overflow=''}},true)}
function getButton(e){var t=e&&e.target;if(t&&t.nodeType===3)t=t.parentElement;return t&&t.closest?t.closest('#productModal .product-modal-actions .product-buy-now'):null}
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'',m=code.match(/addToCartFromModal\\(\\s*(\\d+)\\s*,\\s*(\\d+(?:\\.\\d+)?)\\s*\\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null}
function handleClick(e){var btn=getButton(e);if(!btn)return;var action=getAction(btn);if(!action||typeof window.addToCartFromModal!=='function')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.addToCartFromModal(action.id,action.qty)}
window.addEventListener('click',handleClick,true);
function installSellerOptions(){
 var price=document.getElementById('productPrice'),details=document.getElementById('productDetails');
 if(!price||!details)return;
 var wrap=document.getElementById('emSellerOptions');
 if(!wrap){wrap=document.createElement('div');wrap.id='emSellerOptions';wrap.style.cssText='margin:12px 0;padding:12px;border:1px solid #303645;border-radius:12px;background:#171b25';wrap.innerHTML='<div style="font-weight:800;margin-bottom:8px">Варианты количества и цены</div><div id="emSellerRows"></div><button type="button" id="emAddSellerRow" style="margin-top:8px;padding:7px 10px;border:0;border-radius:8px;background:#6c63ff;color:#fff;font-weight:700">+ Добавить вариант</button><div style="font-size:11px;color:#8e94a4;margin-top:7px">Например: 1 шт. — 100 ₽, 5 шт. — 450 ₽</div>';price.parentNode.insertBefore(wrap,price.nextSibling)}
 var rows=wrap.querySelector('#emSellerRows');if(!rows)return;
 function add(q,p){var row=document.createElement('div');row.style.cssText='display:flex;gap:6px;margin:6px 0;align-items:center';row.innerHTML='<input type="number" min="1" step="1" placeholder="Кол-во" value="'+(q||'')+'" data-role="qty" style="width:90px;padding:7px;border-radius:8px;border:1px solid #3a4050;background:#10131b;color:#fff"><input type="number" min="0" step="0.01" placeholder="Цена ₽" value="'+(p||'')+'" data-role="price" style="width:110px;padding:7px;border-radius:8px;border:1px solid #3a4050;background:#10131b;color:#fff"><button type="button" data-remove="1" style="padding:6px 9px;border:0;border-radius:8px;background:#343a49;color:#fff">✕</button>';row.querySelector('[data-remove]').onclick=function(){row.remove()};rows.appendChild(row)}
 if(!rows.children.length){var marker=String(details.value||'').match(/<!--EM_PRICES:([\\s\\S]*?)-->/),parsed=[];if(marker)try{parsed=JSON.parse(marker[1])}catch(e){}if(Array.isArray(parsed)&&parsed.length)parsed.forEach(function(o){add(o.qty,o.price)});else add(1,price.value||'')}
 var addBtn=wrap.querySelector('#emAddSellerRow');if(addBtn&&addBtn.dataset.bound!=='1'){addBtn.dataset.bound='1';addBtn.onclick=function(){add('','')}}
 var fn=window.saveProduct;if(typeof fn==='function'&&!fn._emSellerWrapped){var save=fn;var wrapped=function(){var opts=Array.from(rows.children).map(function(r){return{qty:Number(r.querySelector('[data-role="qty"]').value),price:Number(r.querySelector('[data-role="price"]').value)}}).filter(function(x){return x.qty>0&&Number.isFinite(x.price)&&x.price>=0}).sort(function(a,b){return a.qty-b.qty});if(opts.length){details.value=String(details.value||'').replace(/\\n?<!--EM_PRICES:[\\s\\S]*?-->/g,'').trim()+'\\n<!--EM_PRICES:'+JSON.stringify(opts)+'-->';price.value=String(opts[0].price)}return save.apply(this,arguments)};wrapped._emSellerWrapped=true;window.saveProduct=wrapped}
}
function start(){install();installSellerOptions()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
setInterval(function(){install();installSellerOptions()},300);
new MutationObserver(function(){install();installSellerOptions()}).observe(document.documentElement,{childList:true,subtree:true});
})();
