import { useState, useEffect } from 'react';

interface UseSecurityPoliciesProps {
  autoDelete: boolean;
  visualShield: boolean;
  blockCopyPaste: boolean;
  absolutePrivacy: boolean;
  isTranslationEnabled: boolean;
  setIsTranslationEnabled: (val: boolean) => void;
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
}

export function useSecurityPolicies({
  autoDelete,
  visualShield,
  blockCopyPaste,
  absolutePrivacy,
  isTranslationEnabled,
  setIsTranslationEnabled,
  addLog,
}: UseSecurityPoliciesProps) {
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isBlurred, setIsBlurred] = useState<boolean>(false);

  // Tick current time for auto-delete reactive UI update
  useEffect(() => {
    if (!autoDelete) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [autoDelete]);

  // Visual Shield Tab obscuring & window blur handler
  useEffect(() => {
    if (!visualShield) {
      setIsBlurred(false);
      return;
    }
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibilityChange = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [visualShield]);

  // Block Copy/Paste clipboard security hook
  useEffect(() => {
    if (!blockCopyPaste) return;
    const preventAll = (e: Event) => {
      e.preventDefault();
      addLog('WARN', 'أمن الحافظة // Clipboard transfer attempt blocked by Enclave protocol.');
    };
    document.addEventListener('copy', preventAll);
    document.addEventListener('cut', preventAll);
    document.addEventListener('paste', preventAll);
    document.addEventListener('contextmenu', preventAll);
    document.addEventListener('selectstart', preventAll);
    return () => {
      document.removeEventListener('copy', preventAll);
      document.removeEventListener('cut', preventAll);
      document.removeEventListener('paste', preventAll);
      document.removeEventListener('contextmenu', preventAll);
      document.removeEventListener('selectstart', preventAll);
    };
  }, [blockCopyPaste, addLog]);

  // Absolute Privacy AI isolation enforcement
  useEffect(() => {
    if (absolutePrivacy && isTranslationEnabled) {
      setIsTranslationEnabled(false);
      addLog('WARN', 'الأمن المطلق // AI translation forced OFF due to Absolute Privacy settings.');
    }
  }, [absolutePrivacy, isTranslationEnabled, setIsTranslationEnabled, addLog]);

  return {
    currentTime,
    isBlurred,
  };
}
export default useSecurityPolicies;
