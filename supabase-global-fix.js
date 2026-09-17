/* EasyMarket: global Supabase bootstrap + compatibility fixes.
 * Loaded before the legacy application code.
 */
(function () {
  'use strict';

  var URL = 'https://uhmgjcoyxehknkehfbbj.supabase.co';
  var KEY = 'sb_publishable_7Bn4Azfm58BkIJS_6vSsUw_qbGS4wTH';

  function ensureClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
    try {
      window.supabaseClient = window.supabase.createClient(URL, KEY);
      return window.supabaseClient;
    } catch (e) {
      console.error('[EasyMarket] Supabase client init failed', e);
      return null;
    }
  }

  /* Legacy code expects window.supabaseClient, while index.html historically
     declared a block-scoped const with the same name. */
  ensureClient();

  /* Keep the compatibility global available if another script touches it. */
  var timer = setInterval(function () {
    if (!window.supabaseClient) ensureClient();
  }, 250);
  setTimeout(function () { clearInterval(timer); }, 30000);

  window.EasyMarketSupabase = {
    url: URL,
    key: KEY,
    getClient: ensureClient
  };
})();
