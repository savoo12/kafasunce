'use client';

import React, { Dispatch, SetStateAction, useEffect } from 'react';

interface SunControlPanelProps {
  controlDate: Date;
  setControlDate: Dispatch<SetStateAction<Date>>;
  isRealTime: boolean;
  setIsRealTime: Dispatch<SetStateAction<boolean>>;
  show24h: boolean;
  setShow24h: Dispatch<SetStateAction<boolean>>;
}

export default function SunControlPanel({
  controlDate,
  setControlDate,
  isRealTime,
  setIsRealTime,
  show24h,
  setShow24h
}: SunControlPanelProps) {
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formatTime = (date: Date) => {
    if (show24h) {
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    const h12 = date.getHours() % 12 || 12;
    const ampm = date.getHours() < 12 ? 'am' : 'pm';
    return `${h12}:${pad(date.getMinutes())}${ampm}`;
  };

  const formatDate = (date: Date) => {
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const startOfYear = new Date(controlDate.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((controlDate.getTime() - startOfYear.getTime() + 1) / 86400000);

  useEffect(() => {
    if (!isRealTime) return;
    const t = setInterval(() => setControlDate(new Date()), 1000);
    return () => clearInterval(t);
  }, [isRealTime]);

  return (
    <div className="absolute top-4 left-4 z-20 w-80 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg text-gray-800 dark:text-gray-200">
      <div className="flex space-x-2">
        <button className="flex-1 py-1 rounded bg-yellow-500 text-white text-sm">VISUALIZE</button>
        <button className="flex-1 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-500 text-sm cursor-not-allowed" disabled>ANALYZE</button>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm">
        <span>{formatTime(controlDate)}</span>
        <span>UTC{(controlDate.getTimezoneOffset() / -60) >= 0 ? '+' : ''}{Math.abs(controlDate.getTimezoneOffset() / 60)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={86400}
        value={controlDate.getHours() * 3600 + controlDate.getMinutes() * 60 + controlDate.getSeconds()}
        onChange={(e) => {
          const secs = Number(e.currentTarget.value);
          const n = new Date(controlDate);
          n.setHours(0, 0, 0, 0);
          n.setSeconds(secs);
          setControlDate(n);
          setIsRealTime(false);
        }}
        className="w-full mt-2"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1"><span>0:00</span><span>24:00</span></div>

      <div className="flex space-x-2 mt-4">
        <button onClick={() => { setControlDate(new Date()); setIsRealTime(true); }} className="flex-1 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded">Now</button>
        <button onClick={() => setShow24h(!show24h)} className="flex-1 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded">24H</button>
      </div>

      <div className="mt-4 flex justify-between items-center text-sm"><span>01/01</span><span>12/31</span></div>
      <input
        type="range"
        min={1}
        max={365}
        value={dayOfYear}
        onChange={(e) => {
          const newDay = Number(e.currentTarget.value);
          const n = new Date(controlDate.getFullYear(), 0, newDay - 1, controlDate.getHours(), controlDate.getMinutes(), controlDate.getSeconds());
          setControlDate(n);
          setIsRealTime(false);
        }}
        className="w-full mt-1"
      />
      <div className="mt-2 text-center text-sm">{formatDate(controlDate)}</div>
    </div>
  );
} 