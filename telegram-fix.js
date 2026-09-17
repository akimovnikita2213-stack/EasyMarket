/* EasyMarket stable Telegram modal guard. */
(function(){
'use strict';
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
