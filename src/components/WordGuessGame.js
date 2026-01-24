import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Delete, ArrowRight, Lightbulb, RotateCcw, PlayCircle, X } from 'lucide-react';
// 외부 데이터베이스 불러오기
import { wordDatabase, twoWordDatabase, threeWordDatabase } from '../data/wordDatabase';

const WordGuessGame = () => {
  // ... (기타 상태 및 useEffect 로직은 이전과 동일) ...

  const loadNewWord = useCallback(() => {
    // 1. 레벨에 따른 DB 선택
    let db = level <= 5 ? wordDatabase : (level <= 15 ? twoWordDatabase : threeWordDatabase);
    
    // 2. 50:50 확률로 타입 선택 (Normal vs Phrase)
    const preferPhrase = Math.random() < 0.5;
    
    // 3. 필터링 (사용하지 않은 단어 우선 + 확률에 맞는 타입)
    let filtered = db.filter(i => 
      !usedWordIds.includes(i.word) && 
      (db[0].type === 'Normal' && level <= 5 ? true : i.type === (preferPhrase ? 'Phrase' : 'Normal'))
    );
    
    // 조건에 맞는 단어가 없으면 전체에서 미사용 단어 선택
    if (filtered.length === 0) {
      filtered = db.filter(i => !usedWordIds.includes(i.word));
    }
    // 다 썼으면 전체 리셋 효과
    if (filtered.length === 0) filtered = db;

    const sel = filtered[Math.floor(Math.random() * filtered.length)];
    
    // 띄어쓰기 제거 후 셔플
    const chars = sel.word.replace(/\s/g, '').split('').map((char, i) => ({ 
      char, id: `l-${Date.now()}-${i}` 
    })).sort(() => Math.random() - 0.5);

    setCurrentWord(sel.word);
    setCategory(sel.category);
    setWordType(sel.type);
    setScrambledLetters(chars);
    setSelectedLetters([]);
    setIsCorrect(false);
    setHintLevel(0);
  }, [level, usedWordIds]);

  // ... (이하 UI 렌더링 로직 동일) ...
};

export default WordGuessGame;
