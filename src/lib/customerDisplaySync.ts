import { PosOrder } from '@/types';

export interface CustomerDisplayPayload {
  order: PosOrder | null;
  showQr: boolean;
  qrInfo?: {
    vietQrUrl: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferContent: string;
    amount: number;
  };
  isPaidSuccess?: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'ccb_pos_customer_display_payload';
const CHANNEL_NAME = 'ccb_pos_customer_display_channel';

// Get a safe BroadcastChannel instance if supported in browser
function getChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Broadcast current active order and optional QR info to customer display
 */
export function broadcastCustomerOrder(
  order: PosOrder | null,
  showQr: boolean = false,
  qrInfo?: CustomerDisplayPayload['qrInfo']
) {
  if (typeof window === 'undefined') return;

  const payload: CustomerDisplayPayload = {
    order,
    showQr,
    qrInfo,
    isPaidSuccess: false,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'SYNC_ORDER', payload });
      channel.close();
    } catch (e) {}
  }
}

/**
 * Broadcast payment success event
 */
export function broadcastPaymentSuccess(order: PosOrder) {
  if (typeof window === 'undefined') return;

  const payload: CustomerDisplayPayload = {
    order,
    showQr: false,
    isPaidSuccess: true,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'PAYMENT_SUCCESS', payload });
      channel.close();
    } catch (e) {}
  }
}

/**
 * Broadcast order clear / reset
 */
export function broadcastClearCustomerDisplay() {
  if (typeof window === 'undefined') return;

  const payload: CustomerDisplayPayload = {
    order: null,
    showQr: false,
    isPaidSuccess: false,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {}

  const channel = getChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'CLEAR_ORDER', payload });
      channel.close();
    } catch (e) {}
  }
}

/**
 * Read latest order payload from localStorage
 */
export function getActiveOrderFromStorage(): CustomerDisplayPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * Subscribe to customer display updates across tabs/windows
 */
export function subscribeCustomerDisplay(
  onUpdate: (payload: CustomerDisplayPayload) => void,
  onRequestSync?: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const channel = getChannel();

  const handleMessage = (event: MessageEvent) => {
    if (!event.data) return;
    if (event.data.type === 'SYNC_ORDER' || event.data.type === 'PAYMENT_SUCCESS' || event.data.type === 'CLEAR_ORDER') {
      onUpdate(event.data.payload);
    } else if (event.data.type === 'REQUEST_LATEST_ORDER' && onRequestSync) {
      onRequestSync();
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const payload: CustomerDisplayPayload = JSON.parse(e.newValue);
        onUpdate(payload);
      } catch (err) {}
    }
  };

  window.addEventListener('storage', handleStorage);

  // Request latest order from any active POS window
  if (channel) {
    try {
      channel.postMessage({ type: 'REQUEST_LATEST_ORDER' });
    } catch (e) {}
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
    window.removeEventListener('storage', handleStorage);
  };
}
