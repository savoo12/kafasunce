'use client';

import React, { useState, useEffect, useRef } from 'react';
import SunCalc from 'suncalc';

interface TimeSliderProps {
  lat?: number;
  lng?: number;
  onTimeChange: (time: Date) => void;
}

export default function TimeSlider({ lat = 44.81, lng = 20.46, onTimeChange }: TimeSliderProps) {
  const [rangeValue, setRangeValue] = useState<number>(50);
  const [sunrise, setSunrise] = useState<Date>(new Date());
  const [sunset, setSunset] = useState<Date>(new Date());
  const throttleRef = useRef<number | null>(null);

  // Compute sunrise/sunset for today
  useEffect(() => {
    const now = new Date();
    const times = SunCalc.getTimes(now, lat, lng);
    setSunrise(times.sunrise);
    setSunset(times.sunset);

    // Initialize slider at current time
    const start = times.sunrise.getTime();
    const end = times.sunset.getTime();
    const curr = now.getTime();
    const perc = Math.min(Math.max((curr - start) / (end - start) * 100, 0), 100);
    setRangeValue(perc);
    onTimeChange(now);
  }, [lat, lng, onTimeChange]);

  // Throttled update
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setRangeValue(value);
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = window.setTimeout(() => {
      const start = sunrise.getTime();
      const end = sunset.getTime();
      const newTime = new Date(start + (value / 100) * (end - start));
      onTimeChange(newTime);
    }, 100);
  };

  const formatLabel = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="p-4">
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={rangeValue}
        onChange={handleChange}
        className="w-full"
      />
      <div className="flex justify-between text-xs mt-1">
        <span>{formatLabel(sunrise)}</span>
        <span>{formatLabel(new Date(sunrise.getTime() + (rangeValue / 100) * (sunset.getTime() - sunrise.getTime())))}</span>
        <span>{formatLabel(sunset)}</span>
      </div>
    </div>
  );
} 