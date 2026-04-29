import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Map as MapIcon, ChevronLeft, Lock, Star, Zap } from 'lucide-react';
import { WORD_LIST, Level, Word } from './data/words';
import StatsBar from './components/StatsBar';
import WordCard from './components/WordCard';
import Quiz from './components/Quiz';
import ClozeTest from './components/ClozeTest';
import { cn } from './lib/utils';

type GameState = 'MAP' | 'STORY_INTRO' | 'LEARN' | 'STORY_PASSAGE' | 'QUIZ' | 'SUCCESS' | 'GAME_OVER';

interface MasteryData {
  correctStreak: number;
}

const allWords = WORD_LIST.flatMap(l => l.words);
const totalWordsCount = allWords.length;

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MAP');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [points, setPoints] = useState(() => Number(localStorage.getItem('sco_points') || 50));
  const [streak, setStreak] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem('sco_unlocked');
    return saved ? JSON.parse(saved) : [1];
  });
  
  // Mistake Book State: word -> mastery info
  const [mistakeBook, setMistakeBook] = useState<Record<string, MasteryData>>(() => {
    const saved = localStorage.getItem('sco_mistakes');
    return saved ? JSON.parse(saved) : {};
  });

  const [activeQueue, setActiveQueue] = useState<Word[]>([]);
  const [currentIndexInQuiz, setCurrentIndexInQuiz] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState(0);

  useEffect(() => {
    localStorage.setItem('sco_points', points.toString());
    localStorage.setItem('sco_unlocked', JSON.stringify(unlockedLevels));
    localStorage.setItem('sco_mistakes', JSON.stringify(mistakeBook));
    
    if (points <= 0 && gameState !== 'GAME_OVER' && gameState !== 'MAP') {
      setGameState('GAME_OVER');
    }
  }, [points, unlockedLevels, mistakeBook, gameState]);

  const currentLevel = WORD_LIST.find(l => l.id === currentLevelId) || WORD_LIST[0];
  
  // Progress Calculation
  const masteredCount = allWords.filter(w => !mistakeBook[w.word] && unlockedLevels.includes(WORD_LIST.find(l => l.words.includes(w))?.id || 0)).length;
  const totalProgress = Math.round((masteredCount / totalWordsCount) * 100);

  const handleStartLevel = (id: number) => {
    if (!unlockedLevels.includes(id)) return;
    const level = WORD_LIST.find(l => l.id === id) || WORD_LIST[0];
    
    // Sort words: Priority to words in the mistake book
    const levelMistakes = level.words.filter(w => mistakeBook[w.word]);
    const levelNormal = level.words.filter(w => !mistakeBook[w.word]);
    
    setActiveQueue([...levelMistakes, ...levelNormal]);
    setCurrentLevelId(id);
    setCurrentWordIndex(0);
    setCurrentIndexInQuiz(0);
    setSessionMistakes(0);
    setGameState('STORY_INTRO');
  };

  const handleLevelComplete = () => {
    let finalReward = 250;
    const isPerfect = sessionMistakes === 0;
    
    if (isPerfect) {
      finalReward += 5; // Perfect score bonus
    }

    setPoints(p => p + finalReward);
    
    if (!unlockedLevels.includes(currentLevelId + 1) && currentLevelId < WORD_LIST.length) {
      setUnlockedLevels(prev => [...prev, currentLevelId + 1]);
    }
    setGameState('SUCCESS');
  };

  const nextWord = () => {
    if (currentWordIndex < activeQueue.length - 1) {
      setCurrentWordIndex(i => i + 1);
    } else {
      setGameState('STORY_PASSAGE');
    }
  };

  const prevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(i => i - 1);
    }
  };

  const handleCorrect = (word: string) => {
    setPoints(p => Math.min(p + 1, 100));
    setStreak(s => s + 1);
    
    // Progress in Mistake Book
    if (mistakeBook[word]) {
      setMistakeBook(prev => {
        const next = { ...prev };
        next[word] = { correctStreak: (prev[word]?.correctStreak || 0) + 1 };
        
        // Remove if streak reaches 10
        if (next[word].correctStreak >= 10) {
          delete next[word];
        }
        return next;
      });
    }
  };

  const handleWrong = (word: string) => {
    setPoints(p => Math.max(p - 1, 0));
    setStreak(0);
    setSessionMistakes(prev => prev + 1);
    // Add to Mistake Book
    setMistakeBook(prev => ({
      ...prev,
      [word]: { correctStreak: 0 }
    }));
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] text-[#2c3e50] selection:bg-[#8fb339]/30 font-sans">
      {/* Nature Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#8fb339]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-[#4a6741]/5 rounded-full blur-3xl" />
      </div>

      <StatsBar 
        points={points} 
        streak={streak} 
        levelName={currentLevel.name} 
        mistakeCount={Object.keys(mistakeBook).length}
      />

      <main className="relative pt-24 pb-12 px-4 min-h-screen flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'MAP' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl space-y-12"
            >
              <div className="text-center space-y-6">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block p-6 bg-[#4a6741] rounded-[2rem] shadow-2xl mb-2"
                >
                  <Leaf className="w-12 h-12 text-white" />
                </motion.div>
                <div className="space-y-2">
                  <h1 className="text-6xl font-black tracking-tight text-[#2c3e50] uppercase">词汇探险地图</h1>
                  <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                    <div className="flex justify-between w-full text-xs font-black text-[#4a6741] uppercase tracking-[0.1em]">
                      <span>总探险进度</span>
                      <span>{totalProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border-2 border-[#e9e3d0] shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        className="h-full bg-[#8fb339]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {WORD_LIST.map((level) => {
                  const isUnlocked = unlockedLevels.includes(level.id);
                  
                  return (
                    <motion.button
                      key={level.id}
                      whileHover={isUnlocked ? { scale: 1.05, y: -2 } : {}}
                      whileTap={isUnlocked ? { scale: 0.95 } : {}}
                      onClick={() => handleStartLevel(level.id)}
                      className={cn(
                        "relative p-4 rounded-2xl border-2 transition-all group h-32 flex flex-col justify-end text-left shadow-sm",
                        isUnlocked 
                          ? "bg-white border-[#e9e3d0] hover:border-[#8fb339] cursor-pointer" 
                          : "bg-slate-100 border-slate-200 cursor-not-allowed grayscale opacity-60"
                      )}
                    >
                      <div className={cn(
                        "absolute top-3 right-3 p-1.5 rounded-lg",
                        isUnlocked ? "bg-[#8fb339]/20 text-[#4a6741]" : "bg-slate-200 text-slate-400"
                      )}>
                        {isUnlocked ? <Star className="w-4 h-4 fill-current" /> : <Lock className="w-4 h-4" />}
                      </div>

                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-[#8fb339] uppercase tracking-[0.1em] mb-1 italic">LV.{level.id}</div>
                        <div className="text-sm font-black text-[#2c3e50] group-hover:text-[#4a6741] transition-colors line-clamp-2 leading-tight">{level.name}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {gameState === 'STORY_INTRO' && (
            <motion.div 
              key="story_intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-2xl bg-white rounded-[2.5rem] border-4 border-[#e9e3d0] p-10 py-12 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setGameState('MAP')}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>返回地图</span>
              </button>

              <div className="absolute top-0 left-0 w-full h-2 bg-[#8fb339]" />
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <div className="text-sm font-black text-[#8fb339] uppercase tracking-[0.3em]">探险手记 · 第{currentLevel.id}章</div>
                  <h2 className="text-4xl font-black text-[#2c3e50]">{currentLevel.storyTitle}</h2>
                </div>
                
                <p className="text-xl leading-relaxed text-slate-600 font-medium indent-8">
                  {currentLevel.storySegment}
                </p>

                <div className="pt-6">
                  <button
                    onClick={() => setGameState('LEARN')}
                    className="w-full py-5 bg-[#4a6741] text-white rounded-2xl font-black text-xl hover:bg-[#3d5535] transition-all shadow-lg uppercase tracking-widest"
                  >
                    开始学习本章词汇
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'LEARN' && (
            <div key="learn" className="w-full flex flex-col items-center gap-6">
              <button 
                onClick={() => setGameState('STORY_INTRO')}
                className="self-start ml-[calc(50%-224px)] flex items-center gap-2 text-slate-400 hover:text-[#4a6741] font-bold transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>返回章节</span>
              </button>

              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[#4a6741] uppercase">
                  <span>学习进度</span>
                  <span>{currentWordIndex + 1} / {activeQueue.length}</span>
                </div>
                <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-[#e9e3d0]">
                   <motion.div 
                    animate={{ width: `${((currentWordIndex + 1) / activeQueue.length) * 100}%` }}
                    className="h-full bg-[#4a6741]"
                  />
                </div>
              </div>
              <button 
                onClick={() => setGameState('MAP')}
                className="flex items-center gap-2 text-slate-400 hover:text-[#4a6741] font-bold transition-all px-6 py-2 rounded-full border-2 border-slate-200 hover:border-[#4a6741]"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>回到地图</span>
              </button>
              <WordCard 
                word={activeQueue[currentWordIndex]} 
                index={currentWordIndex}
                total={activeQueue.length}
                onNext={nextWord}
                onPrev={prevWord}
              />
            </div>
          )}

          {gameState === 'STORY_PASSAGE' && (
            <motion.div 
              key="story_passage"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-6xl bg-white rounded-[2.5rem] border-4 border-[#e9e3d0] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-400" />
              <button 
                onClick={() => setGameState('LEARN')}
                className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-orange-500 font-bold transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>返回复习</span>
              </button>

              <div className="space-y-8 mt-4">
                <div className="text-center space-y-2">
                  <div className="text-sm font-black text-orange-400 uppercase tracking-[0.3em]">航海阅读 · 理财大挑战</div>
                  <h2 className="text-4xl font-black text-[#2c3e50]">{currentLevel.storyTitle}</h2>
                  <p className="text-slate-400 font-bold text-sm">点击空格，选择下方正确的单词填入</p>
                </div>
                
                <ClozeTest 
                  passage={currentLevel.storyPassage}
                  words={currentLevel.words}
                  onCorrect={() => {
                    setPoints(p => Math.min(p + 1, 100)); // Gain 1 point/HP
                    setStreak(s => s + 1);
                  }}
                  onWrong={() => {
                    setPoints(p => Math.max(p - 1, 0)); // Lose 1 HP
                    setStreak(0);
                  }}
                  onFinish={() => setGameState('QUIZ')}
                />
              </div>
            </motion.div>
          )}

          {gameState === 'QUIZ' && (
            <div key="quiz" className="w-full space-y-6">
              <div className="flex justify-center">
                <button 
                  onClick={() => setGameState('LEARN')}
                  className="flex items-center gap-2 text-slate-400 hover:text-[#8fb339] font-bold transition-all px-6 py-2 rounded-full border-2 border-slate-200 hover:border-[#8fb339]"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>回到复习</span>
                </button>
              </div>
              <div className="w-full max-w-2xl mx-auto space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[#8fb339] uppercase tracking-widest">
                  <span>能量挑战</span>
                  <span>{currentIndexInQuiz + 1} / {activeQueue.length}</span>
                </div>
                <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-[#e9e3d0]">
                   <motion.div 
                    animate={{ width: `${((currentIndexInQuiz + 1) / activeQueue.length) * 100}%` }}
                    className="h-full bg-orange-400"
                  />
                </div>
              </div>
              <Quiz 
                words={activeQueue}
                allWordsInPool={allWords}
                onCorrect={() => handleCorrect(activeQueue[currentIndexInQuiz]?.word || '')}
                onWrong={() => handleWrong(activeQueue[currentIndexInQuiz]?.word || '')}
                onFinish={() => {
                  handleLevelComplete();
                }}
                onStep={(idx) => setCurrentIndexInQuiz(idx)}
              />
            </div>
          )}

          {gameState === 'GAME_OVER' && (
             <motion.div 
               key="game_over"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-10"
             >
               <div className="relative inline-block">
                 <div className="bg-rose-500 p-10 rounded-[3rem] shadow-[0_0_60px_rgba(244,63,94,0.4)]">
                    <Zap className="w-24 h-24 text-white fill-white" />
                 </div>
               </div>

               <div className="space-y-4">
                 <h2 className="text-7xl font-black tracking-tight text-[#2c3e50] uppercase">体力耗尽！</h2>
                 <p className="text-xl text-[#5b7d52] font-bold max-w-2xl leading-relaxed">
                   别灰心，整理一下错题，休息一会儿再来挑战吧。
                 </p>
               </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setPoints(50);
                      setGameState('MAP');
                    }}
                    className="w-full sm:w-auto px-16 py-6 bg-rose-500 text-white rounded-full font-black text-2xl hover:bg-rose-600 transition-all shadow-2xl uppercase tracking-widest"
                  >
                    重振旗鼓 (+50 HP)
                  </button>
                  <button
                    onClick={() => setGameState('MAP')}
                    className="w-full sm:w-auto px-10 py-6 bg-white text-rose-500 border-4 border-rose-500 rounded-full font-black text-xl hover:bg-slate-50 transition-all shadow-xl uppercase tracking-widest"
                  >
                    返回地图
                  </button>
                </div>
             </motion.div>
          )}

          {gameState === 'SUCCESS' && (
             <motion.div 
               key="success"
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-10"
             >
               <div className="relative inline-block">
                 <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-10 border-8 border-dashed border-[#8fb339]/20 rounded-full"
                 />
                 <div className="bg-[#4a6741] p-10 rounded-[3rem] shadow-[0_0_60px_rgba(143,179,57,0.4)]">
                    <Star className="w-24 h-24 text-white fill-white" />
                 </div>
               </div>

               <div className="space-y-4">
                 {sessionMistakes === 0 && (
                   <div className="inline-block px-4 py-1 bg-yellow-400 text-[#2c3e50] font-black text-xs rounded-full animate-bounce mb-2">
                     🌟 完美通关奖励 +5 积分 🌟
                   </div>
                 )}
                 <h2 className="text-7xl font-black tracking-tight text-[#2c3e50] uppercase">本章终：{currentLevel.storyTitle}</h2>
                 <p className="text-xl text-[#5b7d52] font-bold max-w-2xl leading-relaxed">
                   “{currentLevel.storyEnding}”
                 </p>
               </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => setGameState('MAP')}
                    className="w-full sm:w-auto px-16 py-6 bg-[#4a6741] text-white rounded-full font-black text-2xl hover:bg-[#3d5535] transition-all shadow-2xl uppercase tracking-widest"
                  >
                    继续探险
                  </button>
                  <button
                    onClick={() => setGameState('MAP')}
                    className="w-full sm:w-auto px-10 py-6 bg-white text-[#4a6741] border-4 border-[#4a6741] rounded-full font-black text-xl hover:bg-slate-50 transition-all shadow-xl uppercase tracking-widest"
                  >
                    返回地图
                  </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
