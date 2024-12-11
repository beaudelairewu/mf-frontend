// useTypingEffect.js
import { useState, useEffect } from 'react';

const useTypingEffect = (typingSpeed = 100, pauseDuration = 7000, deletingSpeed = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const phrases = [
    "A teddy bear wearing santa hat...",
    "A sleek sports car with a spoiler at the back.",
    "A cozy armchair with a cushioned seat and wooden legs.",
    "A friendly dog wearing a superhero cape.",
    "A cat curled up inside a cozy basket.",
  ];
  useEffect(() => {
    if (isTyping) {
      if (displayText.length < phrases[currentPhraseIndex].length) {
        const timeout = setTimeout(() => {
          setDisplayText(phrases[currentPhraseIndex].slice(0, displayText.length + 1));
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), pauseDuration);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deletingSpeed);
        return () => clearTimeout(timeout);
      } else {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsTyping(true);
      }
    }
  }, [displayText, currentPhraseIndex, isTyping, phrases, typingSpeed, pauseDuration, deletingSpeed]);

  return displayText;
};

export default useTypingEffect;