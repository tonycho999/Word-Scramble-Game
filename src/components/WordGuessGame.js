import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Lightbulb, RotateCcw, Sparkles } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 0);
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-used-indices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentWord, setCurrentWord] = useState(() => localStorage.getItem('word-game-current-word') || '');
  const [category, setCategory] = useState(() => localStorage.getItem('word-game-category') || '');
  const [scrambledLetters, setScrambledLetters] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-scrambled');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [selectedLetters, setSelectedLetters] = useState([]);
  const [message, setMessage] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';
    const availableIndices = db.map((_, i) => i).filter(i => !usedWordIndices.includes(`${dbKey}-${i}`));

    let targetIndex;
    if (availableIndices.length === 0) {
      targetIndex = Math.floor(Math.random() * db.length);
      setUsedWordIndices([`${dbKey}-${targetIndex}`]);
    } else {
      targetIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    }

    const wordObj = db[targetIndex];
    const chars = wordObj.word.replace(/\s/g, '').split('');
    const newScrambled = shuffleArray(chars.map((char, index) => ({ char, id: Math.random() + index })));

    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(newScrambled);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
    setShowHint(false);
  }, [level, usedWordIndices, shuffleArray]);

  useEffect(() => { if (!currentWord) loadNewWord(); }, [currentWord, loadNewWord]);

  const checkGuess = () => {
    const userAnswer = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAnswer = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAnswer === correctAnswer) {
      setMessage('Great Job! 🎉');
      setIsCorrect(true);
      setTimeout(() => {
        setCurrentWord('');
        setScore(prev => prev + (level * 10));
        setLevel(prev => prev + 1);
      }, 1500);
    } else {
      setMessage('Try Again!');
    }
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-400" size={20} />
            <span className="text-indigo-600 font-bold uppercase tracking-tight">Level {level}</span>
          </div>
          <div className="flex items-center gap-1 font-black text-gray-800">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Category</p>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">{category}</h2>
          
          <div className="flex justify-center gap-4">
            <button onClick={() => setShowHint(!showHint)} className={`flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-full border transition-all ${showHint ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
              <Lightbulb size={14} /> HINT
            </button>
            <button onClick={() => setScrambledLetters(prev => shuffleArray(prev))} className="flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-500 active:scale-95">
              <RotateCcw size={14} /> SHUFFLE
            </button>
          </div>

          {showHint && currentWord && (
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-800">
              Starts with: <span className="font-bold">{currentWord[0].toUpperCase()}</span> | Length: {currentWord.replace(/\s/g, '').length}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[60px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => {
              setScrambledLetters(prev => prev.filter(item => item.id !== l.id));
              setSelectedLetters(prev => [...prev, l]);
              setMessage('');
            }} className="w-12 h-12 bg-white border-2 border-gray-100 rounded-xl font-bold text-xl shadow-sm active:scale-90 transition-transform">
              {l.char.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="min-h-[80px] bg-indigo-50 rounded-2xl flex justify-center items-center gap-2 p-4 mb-6 border-2 border-dashed border-indigo-200">
          {selectedLetters.length === 0 ? (
            <span className="text-indigo-300 text-xs uppercase font-bold tracking-widest">Select Letters</span>
          ) : (
            selectedLetters.map(l => (
              <button key={l.id} onClick={() => {
                setSelectedLetters(prev => prev.filter(item => item.id !== l.id));
                setScrambledLetters(prev => [...prev, l]);
              }} className="w-12 h-12 bg-indigo-600 text-white rounded-xl font-bold text-xl shadow-md active:scale-90 transition-transform">
                {l.char.toUpperCase()}</button>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            const all = [...scrambledLetters, ...selectedLetters].sort((a, b) => a.id - b.id);
            setScrambledLetters(all);
            setSelectedLetters([]);
            setMessage('');
          }} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold text-gray-500 active:bg-gray-200">RESET</button>
          <button onClick={checkGuess} disabled={selectedLetters.length === 0 || isCorrect} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg disabled:bg-green-500 transition-colors">
            {isCorrect ? 'CORRECT!' : 'CHECK'}
          </button>
        </div>

        {message && <div className={`mt-4 text-center font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
