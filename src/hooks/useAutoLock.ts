import { useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function useAutoLock(onLock: () => void) {
  const resetTimer = useCallback(() => {
    localStorage.setItem('lastActivity', Date.now().toString());
  }, []);

  useEffect(() => {
    const checkIdle = () => {
      const lastActivity = Number(localStorage.getItem('lastActivity'));
      if (Date.now() - lastActivity > IDLE_TIMEOUT) {
        onLock();
      }
    };

    const handleActivity = () => {
      resetTimer();
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Check for idle state every minute
    const interval = setInterval(checkIdle, 60000);

    // Initialize last activity
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [onLock, resetTimer]);
}