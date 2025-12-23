import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  type: string;
  data: any;
  timestamp: string;
}

interface VisitorTrackerContextType {
  trackActivity: (type: string, data?: any) => void;
  trackChatbotQuery: (query: string) => void;
  trackResumeView: (resumeName: string) => void;
  trackResumeDownload: (resumeName: string) => void;
  trackProjectView: (projectName: string) => void;
  trackSectionView: (sectionName: string) => void;
}

const VisitorTrackerContext = createContext<VisitorTrackerContextType | null>(null);

// Generate a unique session ID for this visitor
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = `vs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

interface VisitorTrackerProviderProps {
  children: React.ReactNode;
  isOwner: boolean;
}

export const VisitorTrackerProvider = ({ children, isOwner }: VisitorTrackerProviderProps) => {
  const activitiesRef = useRef<Activity[]>([]);
  const chatbotQueriesRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string>(getSessionId());
  const alertSentRef = useRef<boolean>(false);
  const activityCountRef = useRef<number>(0);

  // Track activity (only for guests)
  const trackActivity = useCallback((type: string, data: any = {}) => {
    if (isOwner) return; // Don't track owner activity

    const activity: Activity = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    activitiesRef.current.push(activity);
    activityCountRef.current++;

    // Log to database
    supabase
      .from('visitor_activity')
      .insert({
        session_id: sessionIdRef.current,
        activity_type: type,
        activity_data: data
      })
      .then(({ error }) => {
        if (error) console.error('Error logging activity:', error);
      });

    // Send alert after significant activity (5+ actions)
    if (activityCountRef.current >= 5 && !alertSentRef.current) {
      sendVisitorAlert();
    }
  }, [isOwner]);

  // Track chatbot query
  const trackChatbotQuery = useCallback((query: string) => {
    chatbotQueriesRef.current.push(query);
    trackActivity('chatbot_query', { query: query.substring(0, 200) });
  }, [trackActivity]);

  // Track resume view
  const trackResumeView = useCallback((resumeName: string) => {
    trackActivity('resume_view', { resume_name: resumeName });
  }, [trackActivity]);

  // Track resume download
  const trackResumeDownload = useCallback((resumeName: string) => {
    trackActivity('resume_download', { resume_name: resumeName });
  }, [trackActivity]);

  // Track project view
  const trackProjectView = useCallback((projectName: string) => {
    trackActivity('project_view', { project_name: projectName });
  }, [trackActivity]);

  // Track section view
  const trackSectionView = useCallback((sectionName: string) => {
    trackActivity('section_view', { section: sectionName });
  }, [trackActivity]);

  // Send visitor alert email
  const sendVisitorAlert = async () => {
    if (alertSentRef.current || isOwner) return;
    alertSentRef.current = true;

    try {
      const { error } = await supabase.functions.invoke('send-visitor-alert', {
        body: {
          session_id: sessionIdRef.current,
          ip_address: 'Captured server-side',
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        }
      });

      if (error) {
        console.error('Error sending visitor alert:', error);
        alertSentRef.current = false;
      }
    } catch (e) {
      console.error('Failed to send visitor alert:', e);
      alertSentRef.current = false;
    }
  };

  // Track initial page view
  useEffect(() => {
    if (!isOwner) {
      trackActivity('page_view', { page: window.location.pathname });
    }
  }, [isOwner, trackActivity]);

  // Send alert when user leaves (if they had significant activity)
  useEffect(() => {
    if (isOwner) return;

    const handleBeforeUnload = () => {
      if (activitiesRef.current.length >= 3 && !alertSentRef.current) {
        // Use sendBeacon for reliability on page unload
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          ip_address: 'Captured server-side',
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        });
        
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-visitor-alert`;
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOwner]);

  return (
    <VisitorTrackerContext.Provider value={{
      trackActivity,
      trackChatbotQuery,
      trackResumeView,
      trackResumeDownload,
      trackProjectView,
      trackSectionView
    }}>
      {children}
    </VisitorTrackerContext.Provider>
  );
};

export const useVisitorTracker = () => {
  const context = useContext(VisitorTrackerContext);
  if (!context) {
    // Return no-op functions if outside provider
    return {
      trackActivity: () => {},
      trackChatbotQuery: () => {},
      trackResumeView: () => {},
      trackResumeDownload: () => {},
      trackProjectView: () => {},
      trackSectionView: () => {}
    };
  }
  return context;
};