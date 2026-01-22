import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // [1] 초기값: localStorage에서 즉시 읽어오기
  const [level, setLevel] = useState(() => Number(localStorage.getItem('word-game-level')) || 1);
  const [score, setScore] = useState(() => Number(localStorage.getItem('word-game-score')) || 0);
  const [usedWordIndices, setUsedWordIndices] = useState(() => {
    try {
      const saved = localStorage.getItem('word-game-used-indices');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // 현재 진행 중인 문제 상태 (새로고침 시 복구용)
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

  // [2] 상태 변경 시 localStorage 실시간 동기화
  useEffect(() => {
    localStorage.setItem('word-game-level', level);
    localStorage.setItem('word-game-score', score);
    localStorage.setItem('word-game-used-indices', JSON.stringify(usedWordIndices));
    localStorage.setItem('word-game-current-word', currentWord);
    localStorage.setItem('word-game-category', category);
    localStorage.setItem('word-game-scrambled', JSON.stringify(scrambledLetters));
  }, [level, score, usedWordIndices, currentWord, category, scrambledLetters]);

  // [3] 단어 섞기 함수
  const shuffleWord = useCallback((word) => {
    if (!word) return [];
    const chars = word.replace(/\s/g, '').split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.map((char, index) => ({ char, id: Math.random() + index }));
  }, []);

  // [4] 새 단어 선택 로직
  const loadNewWord = useCallback(() => {
    let db = level <= 19 ? wordDatabase : level <= 99 ? twoWordDatabase : threeWordDatabase;
    const dbKey = level <= 19 ? 's' : level <= 99 ? 'd' : 't';

    const availableIndices = db
      .map((_, index) => index)
      .filter(index => !usedWordIndices.includes(`${dbKey}-${index}`));

    let targetIndex;
    if (availableIndices.length === 0) {
      targetIndex = Math.floor(Math.random() * db.length);
      setUsedWordIndices([`${dbKey}-${targetIndex}`]);
    } else {
      targetIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setUsedWordIndices(prev => [...prev, `${dbKey}-${targetIndex}`]);
    }

    const wordObj = db[targetIndex];
    const newScrambled = shuffleWord(wordObj.word);

    setCurrentWord(wordObj.word);
    setCategory(wordObj.category);
    setScrambledLetters(newScrambled);
    setSelectedLetters([]);
    setMessage('');
    setIsCorrect(false);
  }, [level, usedWordIndices, shuffleWord]);

  // [5] 문제 로드 관리 (빌드 에러 방지 주석 포함)
  useEffect(() => {
    if (!currentWord) {
      loadNewWord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, currentWord]);

  // [6] 정답 확인
  const checkGuess = () => {
    const userAnswer = selectedLetters.map(l => l.char).join('').toLowerCase();
    const correctAnswer = currentWord.replace(/\s/g, '').toLowerCase();

    if (userAnswer === correctAnswer) {
      setMessage('정답입니다! 🎉');
      setIsCorrect(true);
      setTimeout(() => {
        setCurrentWord(''); // 새 단어 트리거
        setScore(prev => prev + level * 10);
        setLevel(prev => prev + 1);
      }, 1500);
    } else {
      setMessage('틀렸습니다!');
      setIsCorrect(false);
    }
  };

  const handleLetterClick = (letter) => {
    setScrambledLetters(prev => prev.filter(l => l.id !== letter.id));
    setSelectedLetters(prev => [...prev, letter]);
  };

  const handleSelectedLetterClick = (letter) => {
    setSelectedLetters(prev => prev.filter(l => l.id !== letter.id));
    setScrambledLetters(prev => [...prev, letter]);
  };

  const resetAnswer = () => {
    const all = [...scrambledLetters, ...selectedLetters].sort((a, b) => a.id - b.id);
    setScrambledLetters(all);
    setSelectedLetters([]);
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="text-indigo-600 font-bold">Level {level}</div>
          <div className="flex items-center gap-1 font-black text-gray-800">
            <Trophy size={18} className="text-yellow-500" /> {score}
          </div>
        </div>
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 uppercase">Category</p>
          <h2 className="text-2xl font-bold text-gray-700">{category}</h2>
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[50px]">
          {scrambledLetters.map(l => (
            <button key={l.id} onClick={() => handleLetterClick(l)} className="w-10 h-10 bg-gray-50 border rounded-xl font-bold text-lg active:scale-95">{l.char.toUpperCase()}</button>
          ))}
        </div>
        <div className="min-h-[70px] bg-indigo-50 rounded-2xl flex justify-center items-center gap-2 p-3 mb-6 border-2 border-dashed border-indigo-200">
          {selectedLetters.map(l => (
            <button key={l.id} onClick={() => handleSelectedLetterClick(l)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl font-bold text-lg">{l.char.toUpperCase()}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={resetAnswer} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">초기화</button>
          <button onClick={checkGuess} disabled={isCorrect} className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:bg-green-500">
            {isCorrect ? '정답!' : '확인'}
          </button>
        </div>
        {message && <div className={`mt-4 text-center font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{message}</div>}
      </div>
    </div>
  );
};

export default WordGuessGame;
