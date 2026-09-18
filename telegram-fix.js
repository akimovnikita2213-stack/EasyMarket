/* EasyMarket Supabase bootstrap + normal click fix v20260918-10. */
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
function getAction(btn){var code=btn&&btn.getAttribute('onclick')||'',m=code.match(/addToCartFromModal\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)/);return m?{id:Number(m[1]),qty:Number(m[2])}:null}
function handleClick(e){var btn=getButton(e);if(!btn)return;var action=getAction(btn);if(!action)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(typeof window.addToCartFromModal==='function')window.addToCartFromModal(action.id,action.qty);else if(typeof window.addToCart==='function')window.addToCart(action.id,action.qty)}
window.addEventListener('click',handleClick,true);
function start(){install()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
new MutationObserver(function(){install()}).observe(document.documentElement,{childList:true,subtree:true});
})();
