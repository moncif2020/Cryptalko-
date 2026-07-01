import { useState, useEffect, useRef } from 'react';
import { ChatMessage, LogEntry } from '../types';

export interface UseAiTranslationProps {
  chatMessages: ChatMessage[];
  addLog: (type: 'INFO' | 'SUCCESS' | 'SECURE' | 'ERROR' | 'WARN', message: string) => void;
}

export function useAiTranslation({ chatMessages, addLog }: UseAiTranslationProps) {
  const [isTranslationEnabled, setIsTranslationEnabled] = useState<boolean>(() => {
    return localStorage.getItem('cryptalko_trans_enabled') !== 'false';
  });
  const [targetLanguage, setTargetLanguage] = useState<string>(() => {
    return localStorage.getItem('cryptalko_target_lang') || 'Arabic';
  });
  const [translations, setTranslations] = useState<Record<string, {
    text: string;
    audio?: string;
    loading: boolean;
    error?: string;
  }>>({});
  
  const fetchedKeysRef = useRef<Set<string>>(new Set());

  // Save translation preferences to local storage
  useEffect(() => {
    localStorage.setItem('cryptalko_trans_enabled', String(isTranslationEnabled));
  }, [isTranslationEnabled]);

  useEffect(() => {
    localStorage.setItem('cryptalko_target_lang', targetLanguage);
  }, [targetLanguage]);

  const translateMessage = async (msgId: string, text: string, audioPayload: string | undefined, lang: string) => {
    const cacheKey = `${msgId}_${lang}`;
    if (fetchedKeysRef.current.has(cacheKey)) return;
    
    fetchedKeysRef.current.add(cacheKey);

    // Short-circuit: if translating text, and the language already matches the target, resolve immediately
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const isEnglish = /^[a-zA-Z0-9\s.,\/#!$%\^&\*;:{}=\-_`~()?'"]+$/.test(text);
    const textMatchesTarget = text && (
      (lang === 'Arabic' && isArabic) || 
      (lang === 'English' && isEnglish)
    );

    if (textMatchesTarget) {
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: { text, loading: false }
      }));
      return;
    }

    setTranslations(prev => ({
      ...prev,
      [cacheKey]: { text: '', loading: true }
    }));

    try {
      addLog('INFO', `الذكاء الاصطناعي // Translating payload into ${lang}...`);
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: audioPayload ? undefined : text,
          audio: audioPayload || undefined,
          targetLanguage: lang,
          generateTts: !!audioPayload,
        })
      });

      if (!response.ok) {
        let errMsg = `Mainframe returned error code ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: {
          text: data.translatedText,
          audio: data.translatedAudio || undefined,
          loading: false
        }
      }));
      addLog('SUCCESS', `اكتمال الترجمة // Payload translated successfully into ${lang}.`);
    } catch (err: any) {
      console.error('AI Translation error:', err);
      addLog('ERROR', `فشل الترجمة // Translation failed: ${err.message || err}`);
      setTranslations(prev => ({
        ...prev,
        [cacheKey]: {
          text: '',
          loading: false,
          error: err.message || 'Translation failed'
        }
      }));
      fetchedKeysRef.current.delete(cacheKey);
    }
  };

  useEffect(() => {
    if (!isTranslationEnabled) return;

    chatMessages.forEach((msg) => {
      if (msg.sender === 'You' || msg.sender === 'System') return;
      
      const cacheKey = `${msg.id}_${targetLanguage}`;
      if (fetchedKeysRef.current.has(cacheKey)) return;

      if (msg.mediaType === 'audio' && msg.mediaPayload) {
        translateMessage(msg.id, '', msg.mediaPayload, targetLanguage);
      } else if (msg.text) {
        translateMessage(msg.id, msg.text, undefined, targetLanguage);
      }
    });
  }, [chatMessages, isTranslationEnabled, targetLanguage]);

  return {
    isTranslationEnabled,
    setIsTranslationEnabled,
    targetLanguage,
    setTargetLanguage,
    translations,
    translateMessage,
  };
}
