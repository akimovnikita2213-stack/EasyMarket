/* EasyMarket stable Telegram compatibility layer. */
(function(){
'use strict';
/* Ensure the shared Supabase client exists before catalog scripts execute. */
if(!window.supabaseClient && window.supabase && typeof window.supabase.createClient==='function'){
 window.supabaseClient=window.supabase.createClient('https://uhmgjcoyxehknkehfbbj.supabase.co','sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH');
}
function install(){
 var modal=document.getElementById('productModal');
 if(!modal||modal.dataset.emGuardInstalled==='1')return;
 modal.dataset.emGuardInstalled='1';
 modal.addEventListener('click',function(e){
  if(e.target!==modal)return;
  e.preventDefault();e.stopPropagation();
  if(typeof window.closeProductModal==='function')window.closeProductModal();
  else{modal.classList.remove('open');document.body.style.overflow='';}
 },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
