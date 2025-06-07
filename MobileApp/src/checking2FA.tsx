import { useEffect, useRef, useState } from 'react';

export function use2FAPolling(userId, onPassed2FA) {
  const intervalRef = useRef(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setIsChecking(true);

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3002/users/check2FAStatus/${userId}`);
        const data = await res.json();

        if (data.passed2FA === true) {
          clearInterval(intervalRef.current);
          setIsChecking(false);
          onPassed2FA();
        }
      } catch (err) {
        console.error('2FA polling error:', err);
      }
    }, 5000);

    // Cleanup on unmount or userId change
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsChecking(false);
    };
  }, [userId]);

  return { isChecking };
}
