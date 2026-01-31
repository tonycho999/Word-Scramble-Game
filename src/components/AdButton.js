import React, { useState, useEffect } from 'react';

const AdButtonComponent = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  // 1. 초기 데이터 로드 (클릭 횟수 및 5분 쿨타임 확인)
  useEffect(() => {
    const today = new Date().toLocaleDateString();
    const savedDate = localStorage.getItem('ad_click_date');
    const savedCount = localStorage.getItem('ad_click_count');
    const lastClickTime = localStorage.getItem('ad_last_click_time');

    // 날짜가 바뀌었으면 클릭 횟수 초기화
    if (savedDate !== today) {
      localStorage.setItem('ad_click_date', today);
      localStorage.setItem('ad_click_count', '0');
      setClickCount(0);
    } else {
      setClickCount(parseInt(savedCount || '0'));
    }

    // 5분 쿨타임 체크
    if (lastClickTime) {
      const diff = Date.now() - parseInt(lastClickTime);
      if (diff < 5 * 60 * 1000) {
        setIsVisible(false);
        const remainingTime = 5 * 60 * 1000 - diff;
        setTimeout(() => setIsVisible(true), remainingTime);
      }
    }
  }, []);

  const handleAdClick = () => {
    const currentCount = clickCount + 1;

    // 하루 20번 제한 체크
    if (currentCount > 20) {
      alert("Daily limit reached (20/20).");
      setIsVisible(false);
      return;
    }

    // 로직 실행: 버튼 숨기기
    setIsVisible(false);
    setClickCount(currentCount);

    // 기록 저장
    localStorage.setItem('ad_click_count', currentCount.toString());
    localStorage.setItem('ad_last_click_time', Date.now().toString());

    // 5분(300,000ms) 후 버튼 다시 표시 (단, 하루 제한 안 걸렸을 때만)
    if (currentCount < 20) {
      setTimeout(() => {
        setIsVisible(true);
      }, 5 * 60 * 1000);
    }

    // 여기에 실제 광고 실행 코드(예: AdMob 또는 Reward Ad 호출)를 넣으세요
    console.log("광고 실행 중...");
  };

  return (
    <div className="flex justify-center my-4">
      {isVisible && clickCount < 20 ? (
        <button 
          onClick={handleAdClick}
          className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-black py-2 px-6 rounded-full shadow-lg transition-transform active:scale-95"
        >
          📺 WATCH AD FOR HINT ({clickCount}/20)
        </button>
      ) : (
        <div className="text-[10px] text-white/50 italic">
          {clickCount >= 20 ? "Limit reached for today" : "Ad will reappear in 5 mins"}
        </div>
      )}
    </div>
  );
};

export default AdButtonComponent;
