import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Volume2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word } from '../data/words';
import { cn } from '../lib/utils';

interface BossFightProps {
  words: Word[];
  onFinish: (score: number) => void;
  onCorrect: () => void;
  onWrong: () => void;
}

export default function BossFight({ words, onFinish, onCorrect, onWrong }: BossFightProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'typing' | 'correct' | 'wrong'>('typing');
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (status !== 'typing' || !inputValue) return;

    const isCorrect = inputValue.toLowerCase().trim() === currentWord.word.toLowerCase();
    
    if (isCorrect) {
      setStatus('correct');
      setScore(s => s + 1);
      onCorrect();
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#4f46e5', '#818cf8', '#ffffff']
      });
    } else {
      setStatus('wrong');
      onWrong();
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1);
        setInputValue('');
        setStatus('typing');
      } else {
        onFinish(score + (isCorrect ? 1 : 0));
      }
    }, 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/50 rounded-full text-rose-400 text-xs font-bold tracking-[0.2em] animate-pulse uppercase">
          <ShieldAlert className="w-4 h-4" />
          Boss Level: Spelling Override
        </div>
        <h2 className="text-4xl font-bold text-white tracking-widest uppercase">Target Detected</h2>
        <div className="text-2xl text-indigo-300 font-medium italic">"{currentWord.meaning}"</div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <form onSubmit={handleSubmit} className="relative bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-8 space-y-6">
          <div className="flex justify-center">
             <button 
              type="button"
              onClick={speak}
              className="p-4 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-full text-indigo-300 transition-colors border border-indigo-500/30"
            >
              <Volume2 className="w-10 h-10" />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={status !== 'typing'}
            placeholder="TYPE WORD TO OVERRIDE..."
            className={cn(
              "w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl p-4 text-center text-3xl font-bold tracking-widest focus:outline-none transition-all uppercase",
              status === 'typing' && "focus:border-indigo-500 text-white placeholder:text-slate-600",
              status === 'correct' && "border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]",
              status === 'wrong' && "border-rose-500 text-rose-400 animate-shake shadow-[0_0_20px_rgba(244,63,94,0.3)]"
            )}
          />

          <button
            type="submit"
            disabled={status !== 'typing' || !inputValue}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10 group disabled:opacity-30"
          >
            <span className="tracking-widest">SEND OVERRIDE</span>
            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
          
          <div className="text-center text-slate-500 font-mono text-xs uppercase tracking-tighter">
            Progress: {currentIndex + 1} / {words.length}
          </div>
        </form>
      </div>
    </div>
  );
}
