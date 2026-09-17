/* EasyMarket stability patch
   The previous helper intercepted clicks and ran repeated timers, which could freeze the Mini App.
   Keep this file intentionally passive: the main index.html owns modal, cart and checkout logic.
*/
(function () {
  'use strict';
  // No global click interception, no function wrapping, no polling and no DOM mutation.
  // This prevents duplicate handlers and restores the native product-modal close behavior.
})();
