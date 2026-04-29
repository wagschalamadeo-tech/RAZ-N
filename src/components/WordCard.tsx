import { motion, AnimatePresence } from 'motion/react';
import { Volume2, ChevronRight } from 'lucide-react';
import { Word } from '../data/words';

interface WordCardProps {
  word: Word;
  onNext: () => void;
  onPrev: () => void;
  index: number;
  total: number;
}

export default function WordCard({ word, onNext, onPrev, index, total }: WordCardProps) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <motion.div
        key={word.word}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="w-full aspect-[3/4] bg-white rounded-[2rem] border-4 border-[#e9e3d0] shadow-xl flex flex-col items-center justify-between p-10 relative overflow-hidden"
      >
        <div className="text-slate-400 font-bold text-xs tracking-[0.2em] uppercase">
          单词探索: {index + 1} / {total}
        </div>

        <div className="flex flex-col items-center gap-4">
          <motion.h2 
            className="text-6xl font-black text-[#4a6741] tracking-tight text-center"
            layoutId={`word-${word.word}`}
          >
            {word.word}
          </motion.h2>
          
          <div className="text-xl font-mono text-indigo-900 bg-slate-100 px-4 py-1 rounded-lg border border-slate-200">
            [{word.phonetic}]
          </div>

          <button 
            onClick={speak}
            className="mt-2 p-5 bg-[#8fb339]/10 hover:bg-[#8fb339]/20 rounded-full text-[#4a6741] transition-all border-2 border-[#8fb339]/20 shadow-sm active:scale-95"
          >
            <Volume2 className="w-10 h-10" />
          </button>
        </div>

        <div className="w-full space-y-4 text-center">
          <div className="inline-block px-4 py-1 bg-[#4a6741] text-white text-xs font-black rounded-full mb-2 uppercase tracking-widest">
            {word.pos}
          </div>
          <p className="text-4xl text-[#2c3e50] font-bold">
            {word.meaning}
          </p>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
            "{word.example}"
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4 w-full">
        {index > 0 && (
          <button 
            onClick={onPrev}
            className="flex-1 py-5 bg-white border-4 border-[#e9e3d0] text-[#4a6741] rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-md"
          >
            上一个
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-[2] py-5 bg-[#5b7d52] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:bg-[#4a6741]"
        >
          <span>{index === total - 1 ? "开启挑战" : "掌握了，下一个"}</span>
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
