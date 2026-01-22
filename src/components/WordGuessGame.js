import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // 기본 점수를 300점으로 설정 (localStorage에 데이터가 없을 경우만 적용)
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => {
    const savedScore = localStorage.getItem('word-game-score');
    return savedScore !== null ? Number(savedScore) : 300;
  });
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-used-indices')) || []; } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try { return JSON.parse(localStorage.getItem('word-game-scrambled')) || []; } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const targetWords = useMemo(() => 
    currentWord.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  , [currentWord]);

  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';
    
    const available = db.map((_, i) => i).filter(i => !usedWordIndices.includes(`${dbKey}-${i}`));
    
    let targetIndex;
    if (available.length === 0) {
      targetIndex = Math.floor(Math.random() * db.length);
    } else {
      targetIndex = available[Math.floor(Math.random() * available.length)];
    }

    const wordObj = db[targetIndex];
    
    const chars = wordObj.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, 
      id: `letter-${Date.now()}-${i}-${Math.random()}` 
    }));

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIndices]);

  useEffect(() => {
    if (!currentWord) loadNewWord();
  }, [currentWord, loadNewWord]);

  const handleHintClick = () => {
    if (!showHint) {
      setScore(prev => Math.max(0, prev - 100));
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  };

  const checkGuess = () => {
    const userAll = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAll = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAll === correctAll) {
      setMessage('EXCELLENT! 🎉');
      setIsCorrect(true);
      const earnedScore = targetWords.length * 10; 
      
      setTimeout(() => {
        setScore(s => s + earnedScore);
        setLevel(l => l + 1);
        setCurrentWord('');
      }, 1500);
    } else {
      setMessage('TRY AGAIN!');
    }
  };

  const renderFreeOrderWords = () => {
    let tempSelected = [...selectedLetters];
    let matchedWords = Array(targetWords.length).fill(null);
    let usedInMatch = new Set();

    targetWords.forEach((target, wordIdx) => {
      for (let i = 0; i <= tempSelected.length - target.length; i++) {
        const slice = tempSelected.slice(i, i + target.length);
        const sliceText = slice.map(l => l.char).join('').toLowerCase();

        if (sliceText === target) {
          matchedWords[wordIdx] = { letters: slice, isMatch: true };
          slice.forEach(l => usedInMatch.add(l.id));
          break;
        }
      }
    });

    let unmatchedLetters = selectedLetters.filter(l => !usedInMatch.has(l.id));
    
    return targetWords.map((target, idx) => {
      const isWordCorrect = matchedWords[idx] !== null;
      const displayLetters = isWordCorrect 
        ? matchedWords[idx].letters 
        : unmatchedLetters.splice(0, target.length);

      return (
        <div key={`row-${idx}`} className="flex flex-col items-center mb-6 last:mb-0 w-full">
          <div className="flex gap-2 items-center flex-wrap justify-center min-h-[48px]">
            {displayLetters.map((l) => (
              <span 
                key={l.id} 
                onClick={() => {
                  if (isCorrect) return;
                  setSelectedLetters(prev => prev.filter(i => i.id !== l.id));
                  setScrambledLetters(prev => [...prev, l]);
                  setMessage('');
                }} 
                className={`font-black cursor-pointer transition-all duration-300 ${
                  isWordCorrect ? 'text-green-500 scale-110' : 'text-indigo-600'
                } ${target.length > 8 ? 'text-2xl' : 'text-4xl'}`}
              >
                {l.char.toUpperCase()}
              </span>
            ))}
            {isWordCorrect && <span className="text-green-500 font-bold ml-2 text-2xl animate-bounce">✓</span>}
          </div>
          <div className={`h-1.5 rounded-full mt-2 transition-all duration-500 ${isWordCorrect ? 'bg-green-400 w-full' : 'bg-indigo-100 w-20'}`} />
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 font-sans text-gray-800">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-bold text-indigo-600 uppercase">
            <Sparkles size={18} className="text-yellow-400" /> Level {level}
          </div>
          <div className="flex items-center gap-1 font-black text-gray-700">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex flex-col items-center gap-1 mb-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{category}</h2>
            <div className="mt-2">
              <span className="text-[11px] font-black text-white bg-indigo-500 px-3 py-1 rounded-full shadow-sm">
                {targetWords.length} {targetWords.length > 1 ? 'WORDS' : 'WORD'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={handleHintClick} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold active:bg-gray-200 transition-colors">
              <Lightbulb size={14} className={`inline mr-1 ${showHint ? 'text-yellow-500' : ''}`}/>
              {showHint ? 'HINT ON' : 'HINT (-100)'}
            </button>
            <button onClick={() => {
              if (isCorrect) return;
              setScrambledLetters(prev => [...prev].sort(() => Math.random() - 0.5));
            }} className="px-4 py-2 bg-gray-50 border rounded-full text-xs font-bold active:bg-gray-200 transition-colors">
              <RotateCcw size={14} className="inline mr-1"/>SHUFFLE
            </button>
          </div>
          {showHint && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-xl border border-yellow-100 text-xs text-yellow-700 font-bold">
              Hint: <span className="text-indigo-600">{targetWords.map(w => w[0].toUpperCase() + "...").join(", ")}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => {
              if (isCorrect) return;
              setScrambledLetters(prev => prev.filter(i => i.id !== l.id));
              setSelectedLetters(prev => [...prev, l]);
              setMessage('');
            }} className="w-11 h-11 bg-white border-2 border-gray-100 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition-all">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="min-h-[180px] bg-indigo-50 rounded-2xl flex flex-col justify-center items-center p-6 mb-8 border-2 border-dashed border-indigo-200">
          <div className="w-full">{renderFreeOrderWords()}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            if (isCorrect) return;
            setScrambledLetters(prev => [...prev, ...selectedLetters]);
            setSelectedLetters([]);
            setMessage('');
          }} className="flex-1 bg-gray-50 py-4 rounded-2xl font-bold text-gray-400">RESET</button>
          <button onClick={checkGuess} disabled={selectedLetters.length === 0 || isCorrect} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:bg-indigo-700 transition-all">
            {isCorrect ? 'PERFECT!' : 'CHECK'}
          </button>
        </div>
        
        {message && <div className="mt-4 text-center font-black text-indigo-600 tracking-widest uppercase animate-pulse">{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
