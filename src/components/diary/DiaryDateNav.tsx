'use client';

import { useRef } from 'react';
import Link from 'next/link';

interface Props {
  date: string; // YYYY-MM-DD
  prevDate: string;
  nextDate: string;
  isToday: boolean;
  displayLabel: string;
  displayDate: string;
}

export default function DiaryDateNav({ date, prevDate, nextDate, isToday, displayLabel, displayDate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    if (newDate && newDate !== date) {
      window.location.href = `/diary/${newDate}`;
    }
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <Link href={`/diary/${prevDate}`} className="text-brand-600 font-medium min-w-[44px] min-h-[44px] flex items-center">
        &larr; Prev
      </Link>
      <button
        onClick={() => inputRef.current?.showPicker()}
        className="text-center min-h-[44px] flex flex-col items-center justify-center active:bg-gray-100 rounded-lg px-3"
      >
        <span className="text-lg font-bold text-gray-900">{displayLabel}</span>
        <span className="text-xs text-brand-600">{displayDate} &#x25BE;</span>
        <input
          ref={inputRef}
          type="date"
          value={date}
          onChange={handleDateChange}
          className="sr-only"
          tabIndex={-1}
        />
      </button>
      <Link href={`/diary/${nextDate}`} className="text-brand-600 font-medium min-w-[44px] min-h-[44px] flex items-center">
        Next &rarr;
      </Link>
    </div>
  );
}
