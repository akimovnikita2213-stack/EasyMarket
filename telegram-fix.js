/* EasyMarket secure client bridge + modal stability patch */
(function () {
  'use strict';

  const API_URL = 'https://uhmgjcoyxehknkehfbbj.supabase.co/functions/v1/easymarket-api';

  async function api(action, payload = {}) {
    const initData = window.Telegram?.WebApp?.initData || '';
    if (!initData) throw new Error('Откройте Mini App из Telegram');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload, initData })
    });
    let data = null;
    try { data = await response.json(); } catch (_) { throw new Error('Сервер вернул некорректный ответ'); }
    if (!response.ok || !data?.success) throw new Error(data?.error || 'Ошибка сервера');
    return data;
  }
  window.emSecureApi = api;

  function showError(error) {
    console.error('EasyMarket secure API:', error);
    if (typeof window.showToast === 'function') window.showToast(error?.message || String(error));
  }

  /* Public catalog: no user table lookup is needed anymore. */
  window.loadProducts = async function loadProductsSecure() {
    const container = document.getElementById('products');
    if (!container) return;
    container.innerHTML = '<div class="loading">Загрузка товаров...</div>';
    try {
      const { data, error } = await window.supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      window.products = data || [];
      if (typeof window.renderProducts === 'function') window.renderProducts();
      if (typeof window.renderAdminProducts === 'function') window.renderAdminProducts();
      if (typeof window.updateStats === 'function') window.updateStats();
    } catch (e) {
      console.error('PRODUCTS ERROR:', e);
      container.innerHTML = '<div class="empty">Ошибка загрузки товаров.<br><br>' + (window.escapeHtml ? window.escapeHtml(e.message) : String(e.message)) + '</div>';
    }
  };

  window.saveCurrentTelegramUser = async function saveCurrentTelegramUserSecure() {
    try { await api('my_profile'); } catch (e) { console.warn('PROFILE SYNC:', e.message); }
  };

  window.getMyUserRecord = async function getMyUserRecordSecure() {
    try { return (await api('my_profile')).user || null; } catch (e) { return null; }
  };

  /* Atomic, server-priced checkout. Browser price/localStorage is no longer trusted. */
  window.checkout = async function checkoutSecure() {
    if (window.checkoutInProgress) return;
    if (!Array.isArray(window.cart) || !window.cart.length) { window.showToast?.('Корзина пустая'); return; }
    window.checkoutInProgress = true;
    const button = document.getElementById('checkoutButton');
    if (button) { button.disabled = true; button.textContent = 'Создаём заказ...'; }
    try {
      const items = window.cart.map(p => ({ product_id: Number(p.id), quantity: Math.max(1, Math.floor(Number(p.quantity || 1))) }));
      const result = await api('create_order', { items });
      window.cart = [];
      window.saveCart?.();
      window.updateCart?.();
      window.closeCart?.();
      window.showToast?.('Заказ №' + result.order.id + ' создан ✅');
      try { if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert('✅ Заказ №' + result.order.id + ' оформлен!\n\n⏳ Ожидайте, пока продавец свяжется с вами.'); } catch (_) {}
      await window.loadPurchases?.();
      await window.loadProducts?.();
    } catch (e) { showError(e); }
    finally {
      window.checkoutInProgress = false;
      if (button) { button.disabled = false; button.textContent = '⚡ Оформить заказ'; }
    }
  };

  window.loadPurchases = async function loadPurchasesSecure() {
    const box = document.getElementById('purchasesList');
    if (!box) return;
    box.innerHTML = '<div class="loading">Загрузка покупок...</div>';
    try {
      const result = await api('my_orders');
      const orders = result.orders || [];
      const items = result.items || [];
      const filtered = orders.filter(o => window.purchaseFilter === 'done' ? Boolean(o.buyer_received) : !Boolean(o.buyer_received));
      if (!filtered.length) { box.innerHTML = '<div class="empty" style="padding:35px 10px;">Заказов в этом разделе нет.</div>'; return; }
      box.innerHTML = filtered.map(o => {
        const its = items.filter(i => Number(i.order_id) === Number(o.id));
        const seller = its.find(i => i.seller_id);
        const sellerDone = String(o.seller_status || '') === 'completed' || Boolean(o.seller_completed_at);
        return `<div class="purchase-card"><div class="purchase-head"><div class="purchase-id">Заказ #${Number(o.id)}</div><div class="purchase-status ${o.buyer_received ? 'done' : ''}">${o.buyer_received ? 'Получен' : sellerDone ? 'Готов продавцом' : 'В работе'}</div></div><div class="purchase-items">${its.map(i => window.escapeHtml(i.product_name) + ' × ' + Number(i.quantity || 1)).join('<br>')}</div><div class="purchase-meta">${Number(o.total || 0)} ₽ · ${window.formatDate(o.created_at)}</div><div class="order-actions"><button class="order-action-btn" onclick="openOrderChat(${Number(o.id)},'buyer')">💬 Чат</button>${!o.buyer_received && sellerDone ? `<button class="order-action-btn green" onclick="markOrderReceived(${Number(o.id)})">📥 Заказ получен</button>` : ''}${o.buyer_received && seller ? `<button class="order-action-btn" onclick="openReviewForm(${Number(o.id)},'${window.escapeHtml(String(seller.seller_id))}','')">⭐ Отзыв</button>` : ''}</div></div>`;
      }).join('');
    } catch (e) { showError(e); box.innerHTML = '<div class="empty">' + (window.escapeHtml ? window.escapeHtml(e.message) : e.message) + '</div>'; }
  };

  window.markOrderReceived = async function markOrderReceivedSecure(orderId) {
    try { await api('mark_received', { order_id: Number(orderId) }); window.showToast?.('Заказ получен ✅'); await window.loadPurchases?.(); }
    catch (e) { showError(e); }
  };

  window.openOrderChat = async function openOrderChatSecure(orderId, role) {
    try {
      await api('order_messages', { order_id: Number(orderId) });
      window.activeChatOrderId = Number(orderId);
      window.activeChatRole = role;
      document.getElementById('chatTitle').textContent = '💬 Чат заказа #' + orderId;
      document.getElementById('chatSub').textContent = role === 'seller' ? 'Покупатель ↔ Продавец' : 'Продавец ↔ Покупатель';
      document.getElementById('chatPanel').classList.add('open');
      document.body.style.overflow = 'hidden';
      await window.loadOrderChatState?.();
      await window.loadOrderMessages?.();
      setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
    } catch (e) { showError(e); }
  };

  window.loadOrderMessages = async function loadOrderMessagesSecure() {
    if (!window.activeChatOrderId) return;
    const el = document.getElementById('chatMessages'); if (!el) return;
    try {
      const result = await api('order_messages', { order_id: Number(window.activeChatOrderId) });
      const me = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ? String(window.Telegram.WebApp.initDataUnsafe.user.id) : '';
      el.innerHTML = (result.messages || []).map(m => `<div class="chat-bubble ${String(m.sender_id) === me ? 'mine' : ''}">${window.escapeHtml(m.message)}<small>${window.escapeHtml(m.sender_username ? '@' + String(m.sender_username).replace(/^@/, '') : 'Пользователь')} · ${window.formatDate(m.created_at)}</small></div>`).join('') || '<div class="empty">Сообщений пока нет. Напишите первым.</div>';
      el.scrollTop = el.scrollHeight;
    } catch (e) { el.innerHTML = '<div class="empty">Ошибка чата</div>'; }
  };

  window.sendOrderMessage = async function sendOrderMessageSecure() {
    const input = document.getElementById('chatInput'); const message = input?.value.trim();
    if (!message || !window.activeChatOrderId) return;
    const button = document.getElementById('chatSendBtn'); if (button) button.disabled = true;
    try { await api('send_message', { order_id: Number(window.activeChatOrderId), message }); input.value = ''; await window.loadOrderMessages?.(); }
    catch (e) { showError(e); }
    finally { if (button) button.disabled = false; }
  };

  window.openReviewForm = async function openReviewFormSecure(orderId, sellerId, sellerUsername) {
    try {
      window.activeReviewRating = 5;
      document.getElementById('sellerModalTitle').textContent = '⭐ Отзыв продавцу';
      document.getElementById('sellerModalHandle').textContent = sellerUsername ? '@' + String(sellerUsername).replace(/^@/, '') : '';
      document.getElementById('sellerModalStats').innerHTML = '';
      document.getElementById('sellerModalReviews').innerHTML = `<div class="review-form"><div class="review-rating" id="reviewStars">${[1,2,3,4,5].map(n => `<button class="active" onclick="setReviewRating(${n})">★</button>`).join('')}</div><textarea id="reviewText" placeholder="Напишите отзыв..."></textarea><button class="seller-action" onclick="submitSellerReview(${Number(orderId)},'${window.escapeHtml(String(sellerId))}','${window.escapeHtml(String(sellerUsername || ''))}')">Опубликовать отзыв</button></div>`;
      document.getElementById('sellerModal').classList.add('open'); document.body.style.overflow = 'hidden';
    } catch (e) { showError(e); }
  };

  window.submitSellerReview = async function submitSellerReviewSecure(orderId, sellerId) {
    try { await api('create_review', { order_id:Number(orderId), seller_id:String(sellerId), rating:Number(window.activeReviewRating || 5), text:document.getElementById('reviewText')?.value.trim() || '' }); window.showToast?.('Отзыв опубликован ⭐'); window.closeSellerModal?.(); }
    catch (e) { showError(e); }
  };

  window.openSellerProfile = async function openSellerProfileSecure(sellerId, username) {
    try {
      const result = await api('seller_profile', { seller_id:String(sellerId) });
      const reviews = result.reviews || []; const orders = result.orders || [];
      const sales = orders.filter(o => String(o.status || '').toLowerCase() === 'completed' || o.buyer_received).length;
      const avg = reviews.length ? (reviews.reduce((a,r) => a + Number(r.rating || 0), 0) / reviews.length).toFixed(1) : '—';
      document.getElementById('sellerModalTitle').textContent = '🏪 ' + (username ? '@' + String(username).replace(/^@/, '') : 'Продавец');
      document.getElementById('sellerModalHandle').textContent = 'Профиль продавца';
      document.getElementById('sellerModalStats').innerHTML = `<div class="seller-stat"><b>${sales}</b><span>Продаж</span></div><div class="seller-stat"><b>${avg}</b><span>Рейтинг</span></div><div class="seller-stat"><b>${reviews.length}</b><span>Отзывов</span></div>`;
      document.getElementById('sellerModalReviews').innerHTML = reviews.length ? reviews.slice(0,50).map(r => `<div class="seller-card"><div class="review-stars">${'★'.repeat(Number(r.rating || 0))}${'☆'.repeat(5-Number(r.rating || 0))}</div><div class="seller-card-meta">${window.escapeHtml(r.buyer_username ? '@' + r.buyer_username : 'Покупатель')}</div><div class="review-text">${window.escapeHtml(r.text || 'Без текста')}</div><div class="review-date">${window.formatDate(r.created_at)}</div></div>`).join('') : '<div class="empty">Отзывов пока нет.</div>';
      document.getElementById('sellerModal').classList.add('open'); document.body.style.overflow = 'hidden';
    } catch (e) { showError(e); }
  };

  window.loadSellerDashboard = async function loadSellerDashboardSecure() {
    try {
      const result = await api('seller_dashboard');
      const items=result.items||[], reviews=result.reviews||[], sellerProducts=result.products||[], orders=result.orders||[];
      const productsBox=document.getElementById('sellerProductsList');
      if(productsBox) productsBox.innerHTML=sellerProducts.length?sellerProducts.map(p=>`<div class="seller-product-card"><div>${p.image_url?`<img class="seller-product-thumb" src="${window.escapeHtml(p.image_url)}" alt="">`:`<div class="seller-product-icon">${window.escapeHtml(p.icon||'📦')}</div>`}</div><div class="seller-product-info"><div class="seller-product-name">${window.escapeHtml(p.name)}</div><div class="seller-product-meta">${Number(p.price||0)} ₽ · Количество: ${Number(p.stock ?? 0)} шт.<br>Статус: ${String(p.approval_status)==='pending'?'⏳ Ожидает проверки':String(p.approval_status)==='rejected'?'❌ Отклонён':'Выставлен ✅'}${p.rejection_reason?`<div class="seller-rejection-reason">Причина: ${window.escapeHtml(p.rejection_reason)}</div>`:''}</div></div><button class="seller-product-delete" onclick="deleteSellerProduct(${Number(p.id)})">🗑</button></div>`).join(''):'<div class="empty">Вы ещё не выставили ни одного товара.</div>';
      const sales=orders.filter(o=>String(o.status||'').toLowerCase()==='completed'||o.buyer_received).length;
      const avg=reviews.length?(reviews.reduce((a,r)=>a+Number(r.rating||0),0)/reviews.length).toFixed(1):'—';
      document.getElementById('sellerStats').innerHTML=`<div class="seller-stat"><b>${sales}</b><span>Продаж</span></div><div class="seller-stat"><b>${avg}</b><span>Рейтинг</span></div><div class="seller-stat"><b>${reviews.length}</b><span>Отзывов</span></div>`;
      document.getElementById('sellerOrdersList').innerHTML=orders.length?orders.slice(0,30).map(o=>{const its=items.filter(i=>Number(i.order_id)===Number(o.id));const done=String(o.seller_status)==='completed'||Boolean(o.seller_completed_at);return `<div class="seller-card"><div class="seller-card-top"><div class="seller-card-name">Заказ #${o.id}</div><div class="seller-sub">${o.buyer_received?'Получен покупателем':done?'Выполнен продавцом':'В работе'}</div></div><div class="seller-card-meta">${its.map(i=>window.escapeHtml(i.product_name)+' × '+Number(i.quantity||1)).join('<br>')}</div><div class="order-actions"><button class="order-action-btn" onclick="openOrderChat(${Number(o.id)},'seller')">💬 Чат</button>${!done&&!o.buyer_received?`<button class="order-action-btn green" onclick="sellerCompleteOrder(${Number(o.id)})">✅ Заказ выполнен</button>`:''}</div></div>`}).join(''):'<div class="empty">Заказов продавца пока нет.</div>';
      document.getElementById('sellerReviewsList').innerHTML=reviews.length?reviews.slice(0,30).map(r=>`<div class="seller-card"><div class="review-stars">${'★'.repeat(Number(r.rating||0))}${'☆'.repeat(5-Number(r.rating||0))}</div><div class="seller-card-meta">${window.escapeHtml(r.buyer_username?'@'+r.buyer_username:'Покупатель')}</div><div class="review-text">${window.escapeHtml(r.text||'Без текста')}</div><div class="review-date">${window.formatDate(r.created_at)}</div></div>`).join(''):'<div class="empty">Отзывов пока нет.</div>';
    } catch (e) { showError(e); }
  };

  window.deleteSellerProduct = async function deleteSellerProductSecure(id) { if(!confirm('Удалить товар?'))return; try { await api('seller_delete_product',{product_id:Number(id)}); window.showToast?.('Товар удалён 🗑'); await window.loadProducts?.(); await window.loadSellerDashboard?.(); } catch(e){showError(e);} };

  window.saveSellerProduct = async function saveSellerProductSecure(event) {
    event?.preventDefault?.(); event?.stopPropagation?.();
    const btn=document.getElementById('sellerPublishProductBtn'); if(btn?.disabled)return; if(btn)btn.disabled=true;
    try {
      const file=document.getElementById('sellerProductImage')?.files?.[0]; if(!file)throw new Error('Добавьте фото товара');
      if(!file.type.startsWith('image/'))throw new Error('Выберите изображение');
      if(file.size>5*1024*1024)throw new Error('Фото должно быть до 5 МБ');
      const imageUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Не удалось прочитать фото'));r.readAsDataURL(file);});
      if(imageUrl.length>900000)throw new Error('Фото слишком большое. Выберите изображение меньшего размера.');
      const result=await api('seller_create_product',{name:document.getElementById('sellerProductName').value.trim(),description:document.getElementById('sellerProductDescription').value.trim(),details:document.getElementById('sellerProductDetails').value.trim(),price:Number(document.getElementById('sellerProductPrice').value),stock:Number(document.getElementById('sellerProductStock').value||0),icon:document.getElementById('sellerProductIcon').value.trim()||'📦',category:document.getElementById('sellerProductCategory').value,image_url:imageUrl});
      ['sellerProductName','sellerProductDescription','sellerProductDetails','sellerProductPrice'].forEach(id=>{const e=document.getElementById(id);if(e)e.value='';});document.getElementById('sellerProductStock').value='1';document.getElementById('sellerProductImage').value='';document.getElementById('sellerProductImagePreview').innerHTML='';document.getElementById('sellerProductForm').style.display='none';window.showToast?.('Товар отправлен на проверку 🕐');await window.loadProducts?.();await window.loadSellerDashboard?.();
    } catch(e){showError(e);} finally {if(btn)btn.disabled=false;}
  };

  window.sellerCompleteOrder = async function sellerCompleteOrderSecure(id){try{await api('seller_complete',{order_id:Number(id)});window.showToast?.('Заказ выполнен ✅');await window.loadSellerDashboard?.();}catch(e){showError(e);}};

  window.syncSellerSettings = async function syncSellerSettingsSecure(){
    try { const rec=await api('my_profile'); const seller=Boolean(rec.user?.is_seller); document.getElementById('sellerSettingsBtn').style.display=seller?'grid':'none'; document.getElementById('becomeSellerBtn').style.display=seller?'none':'grid'; document.getElementById('navProductsBtn').style.display=seller?'flex':'none'; document.getElementById('bottomNav').classList.toggle('seller-mode',seller); return rec.user; } catch(e){return null;}
  };

  window.openSellerPanel = async function openSellerPanelSecure(focus='orders') { try { const rec=await api('my_profile'); if(!rec.user?.is_seller){window.openBecomeSeller?.();return;} window.closeSettings?.(); document.getElementById('sellerPanel').classList.add('open');document.body.style.overflow='hidden';document.getElementById('sellerPanelSub').textContent=rec.user.username?'@'+rec.user.username:'Ваш магазин';await window.loadSellerDashboard?.(); const id=focus==='products'?'sellerProductsTitle':'sellerOrdersTitle';setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}),50);}catch(e){showError(e);} };
  window.openRoleOrders = async function(){ try { const rec=await api('my_profile'); if(rec.user?.is_seller) await window.openSellerPanel('orders'); else {window.buyerChatOnly=false;window.openPurchases();} }catch(e){showError(e);} };
  window.openRoleChats = async function(){ if(typeof window.openChatCenter==='function') return window.openChatCenter(); window.openPurchases(); };

  window.loadProductModeration = async function loadProductModerationSecure(){
    const box=document.getElementById('productModerationList');if(!box)return;box.innerHTML='<div class="loading">Загрузка объявлений...</div>';
    const password=window.__emAdminPassword||'';
    try{const r=await api('admin_moderation',{password});const data=r.products||[];box.innerHTML=data.length?data.map(p=>`<div class="moderation-card">${p.image_url?`<img class="moderation-thumb" src="${window.escapeHtml(p.image_url)}" alt="">`:`<div class="moderation-thumb" style="display:flex;align-items:center;justify-content:center;font-size:28px;">${window.escapeHtml(p.icon||'📦')}</div>`}<div class="moderation-info"><div class="moderation-title">${window.escapeHtml(p.name)} <span class="moderation-badge pending">⏳ На проверке</span></div><div class="moderation-meta">${Number(p.price||0)} ₽ · ${window.escapeHtml(p.category||'other')}<br>Продавец: ${window.escapeHtml(p.seller_username?'@'+p.seller_username:'ID '+String(p.seller_id||'—'))}<br>${window.escapeHtml(window.cleanProductText?.(p.description||'')||p.description||'')}</div><div class="moderation-actions"><button class="admin-btn" onclick="approveProduct(${Number(p.id)})">✅ Одобрить</button><button class="admin-btn danger" onclick="rejectProduct(${Number(p.id)})">❌ Отклонить</button></div></div></div>`).join(''):'<div class="empty">Новых объявлений на проверке нет ✅</div>';}catch(e){showError(e);box.innerHTML='<div class="empty">'+window.escapeHtml(e.message)+'</div>';}
  };
  window.approveProduct=async function(id){try{await api('admin_update_product',{password:window.__emAdminPassword||'',product_id:Number(id),approval_status:'approved',rejection_reason:null});window.showToast?.('Товар одобрен и опубликован ✅');await window.loadProductModeration();await window.loadProducts();}catch(e){showError(e);}};
  window.rejectProduct=async function(id){const reason=prompt('Укажите причину отклонения объявления:','Фото или описание товара не соответствует требованиям площадки.');if(reason===null)return;try{await api('admin_update_product',{password:window.__emAdminPassword||'',product_id:Number(id),approval_status:'rejected',rejection_reason:String(reason).trim()});window.showToast?.('Объявление отклонено ❌');await window.loadProductModeration();}catch(e){showError(e);}};

  window.openAdmin = function(){document.getElementById('loginPanel').classList.add('open');document.getElementById('adminPassword').focus();};
  window.loginAdmin = async function(){const password=document.getElementById('adminPassword').value;if(!password){window.showToast?.('Введите пароль');return;}try{await api('admin_users',{password});window.__emAdminPassword=password;window.closeLogin?.();document.getElementById('adminPanel').classList.add('open');window.renderAdminProducts?.();await window.loadOrders?.();window.updateStats?.();}catch(e){showError(e);}};
  window.loadOrders = async function(){const box=document.getElementById('ordersList');if(!box)return;box.innerHTML='<div class="loading">Загрузка заказов...</div>';try{const r=await api('admin_orders',{password:window.__emAdminPassword||''});const orders=r.orders||[],items=r.items||[];const revenue=orders.filter(o=>String(o.status).toLowerCase()==='completed').reduce((a,o)=>a+Number(o.total||0),0);document.getElementById('statOrders').textContent=orders.length;document.getElementById('statRevenue').textContent=revenue+' ₽';box.innerHTML=orders.map(o=>{const its=items.filter(i=>Number(i.order_id)===Number(o.id));const done=String(o.status).toLowerCase()==='completed';return `<div class="order-card"><div class="order-top"><div class="order-id">Заказ #${Number(o.id)}</div><div class="order-status">${done?'Выполнено':'В ожидании'}</div></div><div class="order-info">👤 ${window.escapeHtml(o.telegram_username?'@'+o.telegram_username:'Без username')}<br>Telegram ID: ${window.escapeHtml(o.telegram_id||'—')}<br>💰 Сумма: <b>${Number(o.total||0)} ₽</b><br>📅 ${window.formatDate(o.created_at)}</div><div class="order-items-admin"><b>Товары:</b><br>${its.map(i=>'• '+window.escapeHtml(i.product_name)+' × '+Number(i.quantity||1)).join('<br>')}</div><div class="order-status-controls"><select id="status-${Number(o.id)}" class="order-status-select"><option value="pending" ${!done?'selected':''}>⏳ В ожидании</option><option value="completed" ${done?'selected':''}>✅ Выполнено</option></select><button class="status-save-btn" onclick="changeOrderStatus(${Number(o.id)})">Сохранить</button></div></div>`}).join('')||'<div class="empty">Заказов пока нет 🧾</div>';}catch(e){showError(e);}};
  window.changeOrderStatus=async function(id){const select=document.getElementById('status-'+id);try{await api('admin_update_order',{password:window.__emAdminPassword||'',order_id:Number(id),status:select.value});window.showToast?.('Статус заказа сохранён');await window.loadOrders?.();await window.loadPurchases?.();}catch(e){showError(e);}};
  window.loadUsers=async function(){const box=document.getElementById('usersList');if(!box)return;box.innerHTML='<div class="loading">Загрузка пользователей...</div>';try{const r=await api('admin_users',{password:window.__emAdminPassword||''});const users=r.users||[];box.innerHTML=users.map(u=>`<div class="order-card"><div class="order-top"><div class="order-id">👤 ${window.escapeHtml([u.first_name,u.last_name].filter(Boolean).join(' ')||'Без имени')}</div><div class="order-status">${u.is_seller?'🏪 Продавец':'Покупатель'}</div></div><div class="order-info">${window.escapeHtml(u.username?'@'+u.username:'Без username')}<br>Telegram ID: ${window.escapeHtml(u.telegram_id||'—')}<br>📅 ${window.formatDate(u.created_at)}</div><div class="order-actions"><button class="order-action-btn" onclick="toggleSellerRights('${window.escapeHtml(String(u.telegram_id))}',${!Boolean(u.is_seller)})">${u.is_seller?'✓ Снять права':'🏪 Сделать продавцом'}</button></div></div>`).join('')||'<div class="empty">Пользователей пока нет</div>';}catch(e){showError(e);}};
  window.toggleSellerRights=async function(id,make){try{await api('admin_toggle_seller',{password:window.__emAdminPassword||'',telegram_id:String(id),is_seller:Boolean(make)});window.showToast?.(make?'Права продавца выданы ✅':'Права продавца сняты');await window.loadUsers?.();}catch(e){showError(e);}};
  window.changeOrderStatus = window.changeOrderStatus;

  /* Product CRUD for admin now goes through the verified API. */
  window.saveProduct = async function(){try{const id=Number(document.getElementById('editProductId').value||0);const name=document.getElementById('productName').value.trim();const description=document.getElementById('productDescription').value.trim();const details=document.getElementById('productDetails').value.trim();const price=Number(document.getElementById('productPrice').value);const icon=document.getElementById('productIcon').value.trim()||'📦';const category=document.getElementById('productCategory').value;if(!name||!Number.isFinite(price)||price<0)throw new Error('Проверьте название и цену');let image_url=null;if(id){const old=(window.products||[]).find(p=>Number(p.id)===id);image_url=old?.image_url||null;}const file=document.getElementById('productImage')?.files?.[0];if(file){if(file.size>5*1024*1024)throw new Error('Фото должно быть до 5 МБ');image_url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Не удалось прочитать фото'));r.readAsDataURL(file);});if(image_url.length>900000)throw new Error('Фото слишком большое');}const payload={password:window.__emAdminPassword||'',product_id:id||undefined,name,description,details,price,icon,category,image_url,approval_status:'approved'};if(id)await api('admin_update_product',payload);else await api('admin_create_product',payload);window.hideProductForm?.();window.showToast?.(id?'Товар обновлён ✅':'Товар добавлен ✅');await window.loadProducts?.();await window.loadOrders?.();}catch(e){showError(e);}};
  window.deleteProduct=async function(id){const p=(window.products||[]).find(x=>Number(x.id)===Number(id));if(!p||!confirm('Удалить «'+p.name+'»?'))return;try{await api('admin_delete_product',{password:window.__emAdminPassword||'',product_id:Number(id)});window.showToast?.('Товар удалён 🗑');await window.loadProducts?.();}catch(e){showError(e);}};

  /* Modal guards from the previous fix. */
  function installModalGuards() {
    const modal = document.getElementById('productModal');
    if (!modal || modal.dataset.emGuardsInstalled === '1') return;
    modal.dataset.emGuardsInstalled = '1';
    modal.addEventListener('click', function (event) {
      if (event.target !== modal) return;
      event.preventDefault(); event.stopPropagation();
      if (typeof window.closeProductModal === 'function') window.closeProductModal(); else { modal.classList.remove('open'); document.body.style.overflow = ''; }
    }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installModalGuards, { once:true }); else installModalGuards();
})();
