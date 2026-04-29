import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word } from '../data/words';
import { cn } from '../lib/utils';

interface QuizProps {
  words: Word[];
  allWordsInPool: Word[];
  onFinish: (score: number) => void;
  onCorrect: () => void;
  onWrong: () => void;
  onStep?: (index: number) => void;
}

export default function Quiz({ words, allWordsInPool, onFinish, onCorrect, onWrong, onStep }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const currentQuestion = words[currentIndex];

  useEffect(() => {
    onStep?.(currentIndex);
  }, [currentIndex, onStep]);

  const options = useMemo(() => {
    const wrongAnswers = allWordsInPool
      .filter(w => w.word !== currentQuestion.word)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map(w => w.meaning);
    
    return [currentQuestion.meaning, ...wrongAnswers].sort(() => 0.5 - Math.random());
  }, [currentQuestion, allWordsInPool]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    
    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.meaning;
    setIsCorrect(correct);

    if (correct) {
      setScore(s => s + 1);
      onCorrect();
      if (currentIndex === words.length - 1) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8fb339', '#4a6741']
        });
      }
    } else {
      onWrong();
    }

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        onFinish(score + (correct ? 1 : 0));
      }
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <div className="text-[#4a6741] font-bold text-sm uppercase tracking-[0.3em]">挑战时间: {currentIndex + 1} / {words.length}</div>
        <h2 className="text-6xl font-black text-[#2c3e50] tracking-tight">{currentQuestion.word}</h2>
        <div className="text-xl font-mono text-slate-500 bg-white/50 px-4 py-1 rounded-lg inline-block">[{currentQuestion.phonetic}]</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
        {options.map((option, idx) => {
          const isThisSelected = selectedAnswer === option;
          const isThisCorrect = option === currentQuestion.meaning;
          
          return (
            <motion.button
              key={idx}
              whileHover={!selectedAnswer ? { y: -2 } : {}}
              whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
              onClick={() => handleAnswer(option)}
              disabled={!!selectedAnswer}
              className={cn(
                "p-8 rounded-[1.5rem] border-4 text-left transition-all relative overflow-hidden group shadow-sm h-full min-h-[100px]",
                !selectedAnswer 
                  ? "bg-white border-[#e9e3d0] text-[#2c3e50] hover:border-[#8fb339] hover:shadow-md"
                  : isThisCorrect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-lg scale-[1.02] z-10"
                    : isThisSelected
                      ? "bg-rose-50 border-rose-500 text-rose-900"
                      : "bg-slate-50 border-slate-200 text-slate-400 opacity-50"
              )}
            >
              <div className="flex items-center justify-between gap-4 h-full">
                <span className="font-black text-xl leading-tight">{option}</span>
                <div className="w-8 flex-shrink-0">
                  <AnimatePresence>
                    {selectedAnswer && isThisCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-8 h-8 text-emerald-600" />
                      </motion.div>
                    )}
                    {selectedAnswer && isThisSelected && !isThisCorrect && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <X className="w-8 h-8 text-rose-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
