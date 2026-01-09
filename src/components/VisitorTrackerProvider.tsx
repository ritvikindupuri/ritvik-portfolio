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
  trackProjectClick: (projectName: string, projectUrl?: string) => void;
  trackSectionView: (sectionName: string) => void;
  trackContactClick: (contactType: string, contactValue?: string) => void;
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

// Recruiter likelihood keywords
const RECRUITER_KEYWORDS = [
  'experience', 'resume', 'skills', 'work', 'projects', 'contact', 
  'hire', 'job', 'position', 'role', 'team', 'available', 'salary', 'rate'
];

// Availability/contact intent keywords
const AVAILABILITY_KEYWORDS = [
  'available', 'availability', 'when can', 'start date', 'notice period',
  'open to', 'looking for', 'interested in', 'hire', 'hiring', 'reach out',
  'contact', 'email', 'phone', 'call', 'interview', 'schedule', 'meet'
];

// Professional sections that indicate recruiter interest
const PROFESSIONAL_SECTIONS = ['experience', 'skills', 'certifications', 'about', 'contact'];

interface VisitorTrackerProviderProps {
  children: React.ReactNode;
  isOwner: boolean;
}

export const VisitorTrackerProvider = ({ children, isOwner }: VisitorTrackerProviderProps) => {
  const activitiesRef = useRef<Activity[]>([]);
  const chatbotQueriesRef = useRef<string[]>([]);
  const sessionIdRef = useRef<string>(getSessionId());
  const alertSentRef = useRef<boolean>(false);
  const recruiterAlertSentRef = useRef<boolean>(false);
  const activityCountRef = useRef<number>(0);
  const sessionStartRef = useRef<Date>(new Date());
  
  // Track specific metrics for recruiter scoring
  const resumeViewsRef = useRef<number>(0);
  const resumeDownloadsRef = useRef<number>(0);
  const sectionsViewedRef = useRef<string[]>([]);
  const contactClicksRef = useRef<string[]>([]);
  const highScoreAlertSentRef = useRef<boolean>(false);

  // Calculate recruiter likelihood score
  const calculateRecruiterScore = useCallback(() => {
    let score = 0;
    
    // Signal 1: Resume interactions (strong signal - 30 points for download)
    if (resumeDownloadsRef.current > 0) score += 30;
    if (resumeViewsRef.current > 0) score += 15;
    
    // Signal 2: Relevant chatbot queries
    const recruiterQueries = chatbotQueriesRef.current.filter(q => 
      RECRUITER_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
    );
    if (recruiterQueries.length > 0) {
      score += Math.min(recruiterQueries.length * 15, 30);
    }
    
    // Signal 3: Viewed relevant sections
    const viewedProfessionalSections = sectionsViewedRef.current.filter(s => 
      PROFESSIONAL_SECTIONS.some(ps => s.toLowerCase().includes(ps))
    );
    score += Math.min(viewedProfessionalSections.length * 10, 20);
    
    // Signal 4: Session duration (3+ minutes)
    const sessionDuration = Math.round((new Date().getTime() - sessionStartRef.current.getTime()) / 1000 / 60);
    if (sessionDuration >= 3) score += 10;
    
    // Signal 5: Multiple chatbot interactions
    if (chatbotQueriesRef.current.length >= 3) score += 10;
    
    // Signal 6: Contact intent - clicked contact links (+15) or asked about availability (+15)
    if (contactClicksRef.current.length > 0) score += 15;
    const availabilityQueries = chatbotQueriesRef.current.filter(q => 
      AVAILABILITY_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
    );
    if (availabilityQueries.length > 0) score += 15;
    
    return score;
  }, []);
  
  // Check if visitor has contact intent
  const hasContactIntent = useCallback(() => {
    // Check if they clicked any contact links
    if (contactClicksRef.current.length > 0) return true;
    
    // Check if they asked about availability/contact in chatbot
    const availabilityQueries = chatbotQueriesRef.current.filter(q => 
      AVAILABILITY_KEYWORDS.some(kw => q.toLowerCase().includes(kw))
    );
    return availabilityQueries.length > 0;
  }, []);

  // Send recruiter-specific alert
  const sendRecruiterAlert = useCallback(async (isHighScore: boolean = false) => {
    // For high score (70+), use separate flag to allow both alerts
    if (isHighScore) {
      if (highScoreAlertSentRef.current || isOwner) return;
      highScoreAlertSentRef.current = true;
    } else {
      if (recruiterAlertSentRef.current || isOwner) return;
      recruiterAlertSentRef.current = true;
    }
    
    const score = calculateRecruiterScore();
    
    // For standard alerts, require 50+; for high score alerts, require 70+
    if (!isHighScore && score < 50) return;
    if (isHighScore && score < 70) return;
    
    const sessionDuration = Math.round((new Date().getTime() - sessionStartRef.current.getTime()) / 1000 / 60);
    
    try {
      const { error } = await supabase.functions.invoke('send-recruiter-alert', {
        body: {
          session_id: sessionIdRef.current,
          recruiter_score: score,
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current,
          sections_viewed: sectionsViewedRef.current,
          resume_views: resumeViewsRef.current,
          resume_downloads: resumeDownloadsRef.current,
          session_duration_minutes: sessionDuration,
          contact_clicks: contactClicksRef.current,
          has_contact_intent: hasContactIntent(),
          is_high_confidence: isHighScore
        }
      });

      if (error) {
        console.error('Error sending recruiter alert:', error);
        if (isHighScore) {
          highScoreAlertSentRef.current = false;
        } else {
          recruiterAlertSentRef.current = false;
        }
      } else {
        console.log(`Recruiter alert sent for score: ${score} (high confidence: ${isHighScore})`);
      }
    } catch (e) {
      console.error('Failed to send recruiter alert:', e);
      if (isHighScore) {
        highScoreAlertSentRef.current = false;
      } else {
        recruiterAlertSentRef.current = false;
      }
    }
  }, [isOwner, calculateRecruiterScore, hasContactIntent]);

  // Send visitor alert email - defined before trackActivity to avoid circular dependency
  const sendVisitorAlert = useCallback(async () => {
    if (alertSentRef.current || isOwner) return;
    alertSentRef.current = true;

    try {
      console.log('[VisitorTracker] Sending visitor alert for session:', sessionIdRef.current);
      const { error } = await supabase.functions.invoke('send-visitor-alert', {
        body: {
          session_id: sessionIdRef.current,
          ip_address: 'Captured server-side',
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        }
      });

      if (error) {
        console.error('[VisitorTracker] Error sending visitor alert:', error);
        alertSentRef.current = false;
      } else {
        console.log('[VisitorTracker] Visitor alert sent successfully');
      }
    } catch (e) {
      console.error('[VisitorTracker] Failed to send visitor alert:', e);
      alertSentRef.current = false;
    }
  }, [isOwner]);

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

    // Send general alert after just 2 meaningful activities (more responsive)
    // This ensures visitors get tracked even for short sessions
    if (activityCountRef.current >= 2 && !alertSentRef.current) {
      sendVisitorAlert();
    }
    
    // Check for recruiter alert after each activity
    const score = calculateRecruiterScore();
    if (score >= 50 && !recruiterAlertSentRef.current) {
      sendRecruiterAlert(false);
    }
    // Also check for high-confidence recruiter (70+) - sends separate alert
    if (score >= 70 && !highScoreAlertSentRef.current) {
      sendRecruiterAlert(true);
    }
  }, [isOwner, calculateRecruiterScore, sendRecruiterAlert, sendVisitorAlert]);

  // Track chatbot query
  const trackChatbotQuery = useCallback((query: string) => {
    chatbotQueriesRef.current.push(query);
    trackActivity('chatbot_query', { query: query.substring(0, 200) });
  }, [trackActivity]);

  // Track resume view
  const trackResumeView = useCallback((resumeName: string) => {
    resumeViewsRef.current++;
    trackActivity('resume_view', { resume_name: resumeName });
  }, [trackActivity]);

  // Track resume download
  const trackResumeDownload = useCallback((resumeName: string) => {
    resumeDownloadsRef.current++;
    trackActivity('resume_download', { resume_name: resumeName });
  }, [trackActivity]);

  // Track project view
  const trackProjectView = useCallback((projectName: string) => {
    trackActivity('project_view', { project_name: projectName });
  }, [trackActivity]);

  // Track project click (when user clicks to view details/github)
  const trackProjectClick = useCallback((projectName: string, projectUrl?: string) => {
    trackActivity('project_click', { project_name: projectName, url: projectUrl });
  }, [trackActivity]);

  // Track section view
  const trackSectionView = useCallback((sectionName: string) => {
    if (!sectionsViewedRef.current.includes(sectionName)) {
      sectionsViewedRef.current.push(sectionName);
    }
    trackActivity('section_view', { section: sectionName });
  }, [trackActivity]);
  
  // Track contact link clicks (email, LinkedIn, GitHub, etc.)
  const trackContactClick = useCallback((contactType: string, contactValue?: string) => {
    contactClicksRef.current.push(contactType);
    trackActivity('contact_click', { contact_type: contactType, value: contactValue });
  }, [trackActivity]);

  // Track initial page view
  useEffect(() => {
    if (!isOwner) {
      trackActivity('page_view', { page: window.location.pathname });
    }
  }, [isOwner, trackActivity]);

  // Send alert when user leaves (if they had any activity and alert wasn't sent)
  useEffect(() => {
    if (isOwner) return;

    const handleBeforeUnload = () => {
      // Lower threshold - send if ANY activity and alert wasn't sent
      if (activitiesRef.current.length >= 1 && !alertSentRef.current) {
        // Use sendBeacon for reliability on page unload
        const data = JSON.stringify({
          session_id: sessionIdRef.current,
          ip_address: 'Captured server-side',
          activities: activitiesRef.current,
          chatbot_queries: chatbotQueriesRef.current
        });
        
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-visitor-alert`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
        };
        
        // Create FormData with proper headers for sendBeacon
        navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
        console.log('[VisitorTracker] Sent beacon alert on page unload');
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
      trackProjectClick,
      trackSectionView,
      trackContactClick
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
      trackProjectClick: () => {},
      trackSectionView: () => {},
      trackContactClick: () => {}
    };
  }
  return context;
};