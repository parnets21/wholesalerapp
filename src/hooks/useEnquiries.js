// src/hooks/useEnquiries.js
import { useCallback, useEffect, useState } from 'react';
import { enquiryService } from '../services/enquiryService';

export default function useEnquiries(status) {
  const [enquiries,   setEnquiries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await enquiryService.list(status ? { status } : {});
      const list = res?.data ?? res ?? [];
      setEnquiries(Array.isArray(list) ? list : []);
      if (!status) {
        const newCount = (Array.isArray(list) ? list : []).filter(e => e.status === 'New').length;
        setUnreadCount(newCount);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return { enquiries, loading, error, refetch: load, unreadCount };
}
