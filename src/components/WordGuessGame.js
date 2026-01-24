import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Sparkles, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, X } from 'lucide-react';

// --- 확장된 데이터베이스 (예시로 양을 대폭 늘림) ---
const wordDatabase = [
  { word: 'APPLE', category: 'FRUIT' }, { word: 'BANANA', category: 'FRUIT' }, { word: 'CHERRY', category: 'FRUIT' }, { word: 'GRAPE', category: 'FRUIT' }, { word: 'ORANGE', category: 'FRUIT' },
  { word: 'MANGO', category: 'FRUIT' }, { word: 'MELON', category: 'FRUIT' }, { word: 'PEACH', category: 'FRUIT' }, { word: 'LEMON', category: 'FRUIT' }, { word: 'BERRY', category: 'FRUIT' },
  { word: 'TIGER', category: 'ANIMAL' }, { word: 'LION', category: 'ANIMAL' }, { word: 'ZEBRA', category: 'ANIMAL' }, { word: 'HORSE', category: 'ANIMAL' }, { word: 'PANDA', category: 'ANIMAL' },
  { word: 'BEAR', category: 'ANIMAL' }, { word: 'RABBIT', category: 'ANIMAL' }, { word: 'MONKEY', category: 'ANIMAL' }, { word: 'KOALA', category: 'ANIMAL' }, { word: 'CAMEL', category: 'ANIMAL' },
  { word: 'PIZZA', category: 'FOOD' }, { word: 'BREAD', category: 'FOOD' }, { word: 'PASTA', category: 'FOOD' }, { word: 'SUSHI', category: 'FOOD' }, { word: 'STEAK', category: 'FOOD' },
  { word: 'TACO', category: 'FOOD' }, { word: 'RAMEN', category: 'FOOD' }, { word: 'BURGER', category: 'FOOD' }, { word: 'SALAD', category: 'FOOD' }, { word: 'COOKIE', category: 'FOOD' }
];
const twoWordDatabase = [
  { word: 'ICE CREAM', category: 'DESSERT' }, { word: 'HOT DOG', category: 'FOOD' }, { word: 'RED APPLE', category: 'FRUIT' }, { word: 'BLUE SKY', category: 'NATURE' },
  { word: 'GOLD FISH', category: 'ANIMAL' }, { word: 'BIG BEAR', category: 'ANIMAL' }, { word: 'FAST CAR', category: 'VEHICLE' }, { word: 'FIRE TRUCK', category: 'VEHICLE' },
  { word: 'GREEN TEA', category: 'DRINK' }, { word: 'COFFEE BEAN', category: 'DRINK' }, { word: 'SEA TURTLE', category: 'ANIMAL' }, { word: 'POLAR BEAR', category: 'ANIMAL' }
];
const threeWordDatabase = [
  { word: 'I LOVE YOU', category: 'PHRASE' }, { word: 'HAPPY NEW YEAR', category: 'EVENT' }, { word: 'COFFEE AND TEA', category: 'DRINK' },
  { word: 'RED WHITE BLUE', category: 'COLOR' }, { word: 'ONE TWO THREE', category: 'NUMBER' }, { word: 'SUN MOON STAR', category: 'SPACE' }
];

const WordGuessGame = () => {
  // --- 상태 관리 ---
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 300);
  const [usedWordIds, setUsedWordIds] = useState(() => JSON.parse(localStorage.getItem('word-game-used-ids') || '[]'));
  const [currentWord, setCurrentWord] = useState('');
  const [category, setCategory] = useState('');
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false); // 전면 광고 상태

  // --- 효과음 재생 함수 ---
  const playSound = (type) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.start(); osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.1);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        o.start(ctx.currentTime + i * 0.1); o.stop(ctx.currentTime + 0.4);
      });
    }
  };

  const targetWords = useMemo(() => currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0), [currentWord]);

  // --- 새 단어 로드 ---
  const loadNewWord = useCallback(() => {
    let db = level <= 5 ? wordDatabase : (level <= 15 ? twoWordDatabase : threeWordDatabase);
    let avail = db.filter(i => !usedWordIds.includes(i.word));
    if (avail.length === 0) avail = db;
    const sel = avail[Math.floor(Math.random() * avail.length)];
    
    const chars = sel.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}` 
    })).sort(() => Math.random() - 0.5);

    setCurrentWord(sel.word);
    setCategory(sel.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setHintLevel(0);
    setMessage('');
  }, [level, usedWordIds]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  // --- 정답 체크 ---
  useEffect(() => {
    const combined = selectedLetters.map(l => l.char).join('').toLowerCase();
    const target = currentWord.replace(/\s/g, '').toLowerCase();
    if (combined === target && target.length > 0 && !isCorrect) {
      setIsCorrect(true);
      playSound('success');
      setMessage('정답입니다! 🎉');
    }
  }, [selectedLetters, currentWord, isCorrect]);

  // --- 다음 레벨 핸들러 (10단위 광고 포함) ---
  const handleNextLevel = () => {
    if (level % 10 === 0) {
      setShowInterstitial(true); // 10레벨마다 전면 광고 표시
    } else {
      processNextLevel();
    }
  };

  const processNextLevel = () => {
    setScore(s => s + 50);
    setLevel(l => l + 1);
    setUsedWordIds(p => [...p, currentWord]);
    setCurrentWord('');
    setShowInterstitial(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-indigo-600 p-4 font-sans relative">
      
      {/* 전면 광고 오버레이 */}
      {showInterstitial && (
        <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-10 text-white text-center">
          <button onClick={processNextLevel} className="absolute top-10 right-10 text-white"><X size={40}/></button>
          <div className="text-sm text-gray-400 mb-2">SPONSORED AD</div>
          <div className="w-full max-w-sm aspect-video bg-gray-800 rounded-2xl mb-6 flex items-center justify-center text-xl font-bold">
            멋진 광고가 나옵니다...
          </div>
          <button onClick={processNextLevel} className="bg-white text-black px-10 py-4 rounded-full font-black text-xl animate-pulse">
            광고 닫고 다음 레벨로
          </button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center border-t-8 border-indigo-500 mx-auto">
        <div className="w-full flex justify-between items-center mb-6 font-black text-indigo-600">
          <span className="text-lg">LV {level}</span>
          <span className="flex items-center gap-1 text-gray-700"><Trophy size={18} className="text-yellow-500"/> {score}</span>
        </div>

        <h2 className="text-3xl font-black text-gray-900 uppercase mb-1">{category}</h2>
        <div className="text-[12px] font-bold text-indigo-400 mb-6 min-h-[1.5rem]">{message}</div>

        {/* 상단 버튼바 */}
        <div className="flex gap-2 mb-8">
          <button onClick={() => { playSound('click'); setScore(s => s - 100); setHintLevel(1); }} disabled={score < 100 || hintLevel > 0 || isCorrect} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black"><Lightbulb size={12}/> HINT</button>
          <button onClick={() => { playSound('click'); setScrambledLetters(p => [...p].sort(() => Math.random() - 0.5)); }} className="px-4 py-2 bg-gray-100 rounded-full text-[10px] font-black"><RotateCcw size={12}/> SHUFFLE</button>
          <button onClick={() => { setIsAdLoading(true); setTimeout(() => { setScore(s => s + 200); setIsAdLoading(false); playSound('success'); }, 3000); }} className="px-4 py-2 bg-amber-400 text-white rounded-full text-[10px] font-black shadow-sm"><PlayCircle size={12}/> {isAdLoading ? '...' : '+200P'}</button>
        </div>

        {/* 글자 조각 */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => { playSound('click'); setSelectedLetters(p => [...p, l]); setScrambledLetters(p => p.filter(i => i.id !== l.id)); }} className="w-12 h-12 bg-white border-2 border-gray-100 rounded-2xl font-black text-xl shadow-sm hover:border-indigo-400">{l.char.toUpperCase()}</button>
          ))}
        </div>

        {/* 정답 표시 영역 */}
        <div className={`w-full min-h-[140px] rounded-[2rem] flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedLetters.map(l => <span key={l.id} className={`text-4xl font-black ${isCorrect ? 'text-green-500' : 'text-indigo-600'}`}>{l.char.toUpperCase()}</span>)}
          </div>
        </div>

        {/* 하단 컨트롤 버튼 */}
        <div className="w-full">
          {isCorrect ? (
            <button onClick={handleNextLevel} className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-black text-2xl shadow-lg animate-bounce flex items-center justify-center gap-2">
              NEXT LEVEL <ArrowRight size={28}/>
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => { setScrambledLetters(p => [...p, ...selectedLetters]); setSelectedLetters([]); }} className="flex-1 bg-gray-100 py-5 rounded-[1.5rem] font-black text-gray-400">RESET</button>
              <button onClick={() => { if(selectedLetters.length > 0) { const last = selectedLetters[selectedLetters.length-1]; setSelectedLetters(p => p.slice(0, -1)); setScrambledLetters(p => [...p, last]); } }} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-2"><Delete size={22}/> BACKSPACE</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordGuessGame;
