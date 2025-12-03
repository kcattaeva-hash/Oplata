import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface DateInputProps {
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export function DateInput({ value, onChange, label, required, className, id }: DateInputProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Parse incoming value only when it changes from outside
  useEffect(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        setYear(y);
        setMonth(parseInt(m).toString());
        setDay(parseInt(d).toString());
      }
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Only update parent when all fields are completely filled
  const tryUpdateDate = () => {
    if (day && month && year && year.length === 4) {
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);

      // Validate
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
        // Format with leading zeros
        const paddedDay = dayNum.toString().padStart(2, '0');
        const paddedMonth = monthNum.toString().padStart(2, '0');
        const isoDate = `${yearNum}-${paddedMonth}-${paddedDay}`;
        
        if (isoDate !== value) {
          onChange(isoDate);
        }
      }
    } else if (!day && !month && !year && value) {
      onChange('');
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
      setDay(val);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
      setMonth(val);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '' || (val.length <= 4)) {
      setYear(val);
    }
  };

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="День"
            value={day}
            onChange={handleDayChange}
            onBlur={tryUpdateDate}
            required={required}
            maxLength={2}
            className="text-center glass border-slate-300/50"
            id={id ? `${id}-day` : undefined}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">День</p>
        </div>
        <div>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Месяц"
            value={month}
            onChange={handleMonthChange}
            onBlur={tryUpdateDate}
            required={required}
            maxLength={2}
            className="text-center glass border-slate-300/50"
            id={id ? `${id}-month` : undefined}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">Месяц</p>
        </div>
        <div>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Год"
            value={year}
            onChange={handleYearChange}
            onBlur={tryUpdateDate}
            required={required}
            maxLength={4}
            className="text-center glass border-slate-300/50"
            id={id ? `${id}-year` : undefined}
          />
          <p className="text-xs text-gray-500 mt-1 text-center">Год</p>
        </div>
      </div>
    </div>
  );
}