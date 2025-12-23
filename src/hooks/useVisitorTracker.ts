import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  type: string;
  data: any;
  timestamp: string;
}

// Generate a unique session ID for this visitor
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `vs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

export const useVisitorTracker = () => {
  const activitiesRef = useRef<Activity[]>([]);
  const chatbotQueriesRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string>(getSessionId());
  const hasTriggeredRef = useRef<boolean>(false);
  const ipAddressRef = useRef<string>('');

  // Get visitor IP via edge function
  useEffect(() => {
    const getIP = async () => {
      try {
        const { data } = await supabase.functions.invoke('geolocate-ip', {
          body: { ip_addresses: ['self'] }
        });
        // For now we'll use the request info from the edge function
        // The IP will be captured server-side
      } catch (e) {
        console.log('Could not get IP');
      }
    };
    getIP();
  }, []);

  // Track activity
  const trackActivity = useCallback((type: string, data: any = {}) => {
    const activity: Activity = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    activitiesRef.current.push(activity);

    // Also log to database
    supabase
      .from('visitor_activity')
      .insert({
        session_id: sessionIdRef.current,
        ip_address: ipAddressRef.current || null,
        activity_type: type,
        activity_data: data
      })
      .then(({ error }) => {
        if (error) console.error('Error logging activity:', error);
      });
  }, []);

  // Track chatbot query
  const trackChatbotQuery = useCallback((query: string) => {
    chatbotQueriesRef.current.push(query);
    trackActivity('chatbot_query', { query });
  }, [trackActivity]);

  // Send visitor alert email
  const sendVisitorAlert = useCallback(async (visitorEmail?: string) => {
    if (hasTriggeredRef.current) return;
    if (activitiesRef.current.length < 2) return; // Only send if they did something

    hasTriggeredRef.current = true;

    try {
      const { error } = await supabase.functions.invoke('send-visitor-alert', {
        body: {
          session_id: sessionIdRef.current,
          ip_address: ipAddressRef.current || 'Unknown',
          email: visitorEmail,
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        }
      });

      if (error) {
        console.error('Error sending visitor alert:', error);
        hasTriggeredRef.current = false; // Allow retry
      }
    } catch (e) {
      console.error('Failed to send visitor alert:', e);
      hasTriggeredRef.current = false;
    }
  }, []);

  // Track page view on mount
  useEffect(() => {
    trackActivity('page_view', { page: window.location.pathname });
  }, [trackActivity]);

  // Send alert when user leaves (with significant activity)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activitiesRef.current.length >= 3) {
        // Use sendBeacon for reliability on page unload
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          ip_address: ipAddressRef.current || 'Unknown',
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        });
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-visitor-alert`,
          new Blob([data], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    trackActivity,
    trackChatbotQuery,
    sendVisitorAlert,
    sessionId: sessionIdRef.current
  };
};