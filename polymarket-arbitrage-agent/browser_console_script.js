/**
 * Browser Console Script to Extract Token IDs (Safe Version)
 * 
 * Instructions:
 * 1. Go to Polymarket website
 * 2. Navigate to a "Bitcoin Up/Down 15m" market
 * 3. Open DevTools (F12 or Cmd+Option+I)
 * 4. Go to Console tab
 * 5. Paste this entire script and press Enter
 * 6. Wait 10-15 seconds for token IDs to appear
 * 
 * NOTE: If this script causes errors, use Method 2 (Network tab) instead!
 */

(() => {
  console.log('🔍 Starting token ID extraction (safe mode)...\n');
  console.log('⚠️  If you see errors, use the Network tab method instead!\n');
  
  const tokens = new Map(); // Store token IDs with their metadata
  const seenMessages = new Set();
  
  // Safer approach: Hook into WebSocket prototype instead of replacing constructor
  const originalAddEventListener = WebSocket.prototype.addEventListener;
  const originalOnMessage = Object.getOwnPropertyDescriptor(WebSocket.prototype, 'onmessage');
  
  // Track all WebSocket instances
  const wsInstances = new WeakSet();
  
  // Intercept addEventListener on WebSocket
  WebSocket.prototype.addEventListener = function(type, listener, options) {
    if (type === 'message' && this.url?.includes('polymarket.com')) {
      wsInstances.add(this);
      const wrappedListener = (event) => {
        if (listener) listener(event);
        processMessage(event.data);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  
  // Also intercept onmessage property
  if (originalOnMessage) {
    Object.defineProperty(WebSocket.prototype, 'onmessage', {
      get: originalOnMessage.get,
      set: function(fn) {
        if (this.url?.includes('polymarket.com')) {
          wsInstances.add(this);
          const wrappedFn = (event) => {
            if (fn) fn(event);
            processMessage(event.data);
          };
          originalOnMessage.set.call(this, wrappedFn);
        } else {
          originalOnMessage.set.call(this, fn);
        }
      },
      configurable: true,
      enumerable: true
    });
  }
  
  function processMessage(data) {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Skip duplicate messages
      const msgKey = JSON.stringify(msg);
      if (seenMessages.has(msgKey)) return;
      seenMessages.add(msgKey);
      
      // Look for asset_id in various message types
      if (msg.asset_id) {
        const assetId = msg.asset_id;
        
        // Try to determine if it's UP or DOWN based on context
        let label = 'UNKNOWN';
        if (msg.market?.toLowerCase().includes('up')) label = 'UP';
        if (msg.market?.toLowerCase().includes('down')) label = 'DOWN';
        if (msg.outcome === 'Yes' || msg.outcome === 'Up') label = 'UP';
        if (msg.outcome === 'No' || msg.outcome === 'Down') label = 'DOWN';
        
        tokens.set(assetId, {
          id: assetId,
          label: label,
          market: msg.market || 'unknown',
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Found ${label} token: ${assetId}`);
        
        // If we have 2 tokens, show results
        if (tokens.size >= 2) {
          showResults();
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  
  function showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('✅ TOKEN IDs FOUND!');
    console.log('='.repeat(60) + '\n');
    
    const tokenArray = Array.from(tokens.values());
    
    // Try to identify UP and DOWN
    let upToken = tokenArray.find(t => t.label === 'UP') || tokenArray[0];
    let downToken = tokenArray.find(t => t.label === 'DOWN') || tokenArray[1];
    
    if (!downToken && tokenArray.length === 2) {
      downToken = tokenArray[1];
    }
    
    console.log('📋 Add these to your .env file:\n');
    console.log(`POLYMARKET_TOKEN_UP_ID=${upToken.id}`);
    console.log(`POLYMARKET_TOKEN_DOWN_ID=${downToken.id}`);
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Copy the two lines above and paste them into your .env file');
    console.log('   Location: polymarket-arbitrage-agent/.env\n');
  }
  
  // Also listen to Network tab messages if available
  if (window.performance && window.performance.getEntriesByType) {
    const checkInterval = setInterval(() => {
      // Check if we have enough tokens
      if (tokens.size >= 2) {
        clearInterval(checkInterval);
        showResults();
      }
    }, 1000);
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (tokens.size > 0) {
        console.log('\n⏱️  Timeout reached. Showing results so far:');
        showResults();
      } else {
        console.log('\n⚠️  No token IDs found via script.');
        console.log('\n📋 USE THE NETWORK TAB METHOD INSTEAD:');
        console.log('   1. Go to DevTools → Network tab');
        console.log('   2. Filter for "WS" (WebSocket)');
        console.log('   3. Click on the WebSocket to ws-subscriptions-clob.polymarket.com');
        console.log('   4. Go to "Messages" tab');
        console.log('   5. Look for messages with "asset_id" field');
        console.log('   6. Copy the two different asset_id values');
        console.log('\n💡 The Network tab method is more reliable and won\'t cause errors!');
      }
    }, 30000);
  }
  
  console.log('⏳ Listening for token IDs... (wait up to 30 seconds)');
  console.log('💡 Make sure you are on a Polymarket market page!');
  console.log('⚠️  If errors appear, refresh the page and use Network tab method instead\n');
})();

