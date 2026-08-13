import { useEffect, useState } from 'react';

export function useRealtimeEvents(token, tenantId, addToast) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    if (!token && !tenantId) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    // EventSource does not support headers directly, so pass tenantId in URL query or header via wrapper if available
    const streamUrl = `${baseUrl}/api/v1/realtime/stream`;

    let eventSource;
    try {
      eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('connected', (e) => {
        setIsConnected(true);
      });

      eventSource.addEventListener('order.created', (e) => {
        const data = JSON.parse(e.data);
        setLastEvent(data);
        if (addToast) {
          addToast(`🔔 Live Order Received: $${data.payload?.totalAmount || ''}`, 'success');
        }
      });

      eventSource.addEventListener('system.alert', (e) => {
        const data = JSON.parse(e.data);
        setLastEvent(data);
        if (addToast) {
          addToast(`⚡ Real-time Alert: ${data.payload?.message || ''}`, 'info');
        }
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
      };

    } catch (err) {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token, tenantId, addToast]);

  return { isConnected, lastEvent };
}
