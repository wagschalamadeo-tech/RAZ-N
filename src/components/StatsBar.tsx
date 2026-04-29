import { motion } from 'motion/react';
import { Star, Zap, Trophy } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsBarProps {
  points: number;
  streak: number;
  levelName: string;
  mistakeCount: number;
}

export default function StatsBar({ points, streak, levelName, mistakeCount }: StatsBarProps) {
  const healthPercent = Math.min(Math.max(points, 0), 100);

  return (
    <div className="fixed top-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-b-4 border-[#e9e3d0] flex items-center justify-between z-50">
      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#f1c40f] font-black">
            <Star className="w-5 h-5 fill-[#f1c40f]" />
            <span className="text-sm uppercase tracking-widest text-slate-500">血槽 (HP)</span>
            <span className="ml-auto text-xs tabular-nums text-slate-400">{points} / 100</span>
          </div>
          <div className="w-48 h-4 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200 p-0.5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${healthPercent}%` }}
              className={cn(
                "h-full rounded-full shadow-[0_0_8px_rgba(241,196,15,0.4)]",
                healthPercent > 50 ? "bg-emerald-400" : healthPercent > 20 ? "bg-orange-400" : "bg-rose-500"
              )}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-orange-500 font-black h-full pt-4" title="连胜积分增加">
          <Zap className="w-6 h-6 fill-orange-500" />
          <span className="text-2xl tabular-nums">{streak}</span>
        </div>
        {mistakeCount > 0 && (
          <div className="flex items-center gap-2 text-rose-500 font-black" title="待复习单词">
            <div className="bg-rose-100 px-2 py-1 rounded-lg text-sm flex items-center gap-1 mt-2">
              <span>错题:</span>
              <span className="text-lg">{mistakeCount}</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="hidden lg:block text-[#4a6741] font-black tracking-widest uppercase text-sm">
        探索中: <span className="text-[#2c3e50]">{levelName}</span>
      </div>

      <div className="flex items-center gap-2 text-[#4a6741]">
        <Trophy className="w-6 h-6" />
        <span className="text-xs font-black uppercase tracking-tighter">词汇小特工</span>
      </div>
    </div>
  );
}
