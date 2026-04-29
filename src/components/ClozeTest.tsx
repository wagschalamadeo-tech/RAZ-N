import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, Timer, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Word } from '../data/words';

interface ClozeTestProps {
  passage: string;
  words: Word[];
  onFinish: () => void;
  onCorrect: () => void;
  onWrong: () => void;
}

export default function ClozeTest({ passage, words, onFinish, onCorrect, onWrong }: ClozeTestProps) {
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [showErrors, setShowErrors] = useState(false);
  const [validationResult, setValidationResult] = useState<Record<number, boolean>>({});

  // Parse passage into parts
  const parts = passage.split(/(\[.*?\])/g);
  const totalBlanks = parts.filter(p => p.startsWith('[') && p.endsWith(']')).length;

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isFinished]);

  const setAnswer = (blankIdx: number, word: string) => {
    if (isFinished) return;
    setUserAnswers(prev => ({ ...prev, [blankIdx]: word }));
    setShowErrors(false);
    setSelectedWord(null);
  };

  const handleLevelSubmit = () => {
    let allCorrect = true;
    const newResults: Record<number, boolean> = {};
    let blankIdx = 0;

    parts.forEach((part) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const expected = part.slice(1, -1);
        const UserAnswer = userAnswers[blankIdx];
        const isCorrect = UserAnswer === expected;
        newResults[blankIdx] = isCorrect;
        
        if (isCorrect) {
          onCorrect();
        } else {
          onWrong();
          allCorrect = false;
        }
        blankIdx++;
      }
    });

    setValidationResult(newResults);
    setShowErrors(true);

    if (allCorrect) {
      setIsFinished(true);
      setTimeout(onFinish, 2000);
    } else {
      // Keep correct ones, remove incorrect ones from userAnswers
      // This allows words to return to pool and slots to be empty for wrong ones
      setTimeout(() => {
        setUserAnswers(prev => {
          const next = { ...prev };
          Object.keys(newResults).forEach(idxStr => {
            const idx = parseInt(idxStr);
            if (!newResults[idx]) {
              delete next[idx];
            }
          });
          return next;
        });
        setShowErrors(false);
      }, 1500); // Give user 1.5s to see what was wrong
    }
  };

  const isAllFilled = Object.keys(userAnswers).length === totalBlanks;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* LEFT: READING AREA (Passage) */}
      <div className="flex-[2] bg-white p-8 rounded-3xl border-2 border-slate-200 relative shadow-inner min-h-[400px] w-full">
        <div className="text-xl leading-[2.8] text-slate-700 font-medium whitespace-pre-wrap">
          {(() => {
            let blankCount = 0;
            return parts.map((part, i) => {
              if (part.startsWith('[') && part.endsWith(']')) {
                const currentIdx = blankCount++;
                const value = userAnswers[currentIdx];
                const isIncorrect = showErrors && validationResult[currentIdx] === false;
                const isCorrect = showErrors && validationResult[currentIdx] === true;

                return (
                  <div
                    key={i}
                    className={cn(
                      "inline-flex items-center justify-center min-w-[100px] h-9 mx-1 px-3 border-b-4 transition-all rounded-lg font-black text-sm align-middle mb-1 cursor-pointer",
                      value 
                        ? (isIncorrect ? "border-rose-500 bg-rose-50 text-rose-600" : 
                           isCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-600" :
                           "border-sky-400 bg-sky-50 text-sky-600 shadow-sm") 
                        : (selectedWord ? "border-orange-300 bg-orange-50 animate-pulse border-dashed" : "border-slate-300 bg-slate-50")
                    )}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const word = e.dataTransfer.getData("word");
                      if (word) setAnswer(currentIdx, word);
                    }}
                    onClick={() => {
                      if (!isFinished) {
                        if (selectedWord) {
                          setAnswer(currentIdx, selectedWord);
                        } else if (value) {
                          const next = { ...userAnswers };
                          delete next[currentIdx];
                          setUserAnswers(next);
                          setShowErrors(false);
                        }
                      }
                    }}
                  >
                    {value || (selectedWord ? "FILL?" : "DROP")}
                  </div>
                );
              }
              return <span key={i}>{part}</span>;
            });
          })()}
        </div>
      </div>

      {/* RIGHT: CONTROL PANEL (Timer, Words, Submit) */}
      <div className="flex-1 space-y-6 w-full lg:sticky lg:top-4">
        {/* Timer & Status */}
        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold">
              <Timer className={cn("w-5 h-5", timeLeft < 20 ? "text-rose-500 animate-pulse" : "")} />
              <span className={timeLeft < 20 ? "text-rose-500" : ""}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="text-sky-600 font-black text-sm">
              {Object.keys(userAnswers).length} / {totalBlanks} DONE
            </div>
          </div>
          
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-sky-500"
              initial={{ width: 0 }}
              animate={{ width: `${(Object.keys(userAnswers).length / totalBlanks) * 100}%` }}
            />
          </div>
        </div>

        {/* Word Pool */}
        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 space-y-4 min-h-[300px]">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">
            <MousePointer2 className="w-4 h-4" />
            <span>Drag or Click to Select</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => {
              const isUsed = Object.values(userAnswers).includes(w.word);
              const isSelected = selectedWord === w.word;
              
              return (
                <motion.div
                  key={i}
                  draggable={!isUsed && !isFinished}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("word", w.word);
                  }}
                  whileHover={!isUsed ? { scale: 1.05 } : {}}
                  whileTap={!isUsed ? { scale: 0.95 } : {}}
                  onClick={() => !isUsed && setSelectedWord(isSelected ? null : w.word)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-black text-sm transition-all border-2 cursor-pointer select-none",
                    isUsed 
                      ? "bg-slate-200 text-slate-400 border-slate-300 opacity-40 cursor-not-allowed scale-90"
                      : isSelected
                        ? "bg-orange-500 text-white border-orange-600 shadow-lg scale-110 z-10"
                        : "bg-white text-slate-600 border-slate-100 hover:border-sky-400 shadow-sm"
                  )}
                >
                  {w.word}
                </motion.div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button 
              onClick={() => {
                if (!isFinished) {
                  setUserAnswers({});
                  setShowErrors(false);
                  setValidationResult({});
                  setSelectedWord(null);
                }
              }}
              className="w-full py-2 text-slate-400 hover:text-rose-500 font-bold transition-all text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              RESET BOARD
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="space-y-4">
          <button
            disabled={!isAllFilled || isFinished}
            onClick={handleLevelSubmit}
            className={cn(
              "w-full py-5 rounded-2xl font-black text-xl transition-all shadow-xl uppercase tracking-widest",
              isAllFilled && !isFinished
                ? "bg-orange-500 text-white hover:bg-orange-600 transform active:scale-[0.98]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {isFinished ? "WELL DONE!" : "SUBMIT"}
          </button>

          <AnimatePresence>
            {showErrors && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm"
              >
                {Object.values(validationResult).every(v => v === true) ? (
                  <span className="text-emerald-500 font-black flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    All correct!
                  </span>
                ) : (
                  <span className="text-rose-500 font-black">Some errors found!</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
