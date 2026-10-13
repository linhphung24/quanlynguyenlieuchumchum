'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseDecimal } from '@/lib/utils';

export interface DecimalInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'step'> {
  value: number | string | undefined | null;
  onChange: (val: number, rawStr: string) => void;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  fallback?: number;
}

export function DecimalInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  allowNegative = false,
  fallback = 0,
  className = '',
  placeholder = '0',
  disabled = false,
  readOnly = false,
  onBlur,
  onKeyDown,
  ...rest
}: DecimalInputProps) {
  const formatInitial = (v: number | string | undefined | null): string => {
    if (v === undefined || v === null || v === '') return '';
    return String(v);
  };

  const [text, setText] = useState<string>(() => formatInitial(value));
  const isFocusedRef = useRef(false);
  const lastParsedRef = useRef<number>(parseDecimal(value, fallback));

  // Đồng bộ khi prop `value` thay đổi từ phía ngoài (load API, nạp công thức BOM, v.v.)
  useEffect(() => {
    const parentNum = parseDecimal(value, fallback);
    const currentNum = parseDecimal(text, fallback);

    // Nếu giá trị từ component cha lệch so với số hiện tại và khác với lần cập nhật gõ gần nhất
    if (
      Math.abs(parentNum - currentNum) > 0.00001 &&
      Math.abs(parentNum - lastParsedRef.current) > 0.00001
    ) {
      setText(formatInitial(value));
      lastParsedRef.current = parentNum;
    } else if (!isFocusedRef.current && formatInitial(value) !== text) {
      setText(formatInitial(value));
      lastParsedRef.current = parentNum;
    }
  }, [value, fallback]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputStr = e.target.value;

    // Lọc ký tự hợp lệ: chỉ cho phép chữ số, dấu '.' hoặc dấu ','
    const sepRegex = allowNegative ? /[^0-9.,-]/g : /[^0-9.,]/g;
    inputStr = inputStr.replace(sepRegex, '');

    // Chỉ cho phép tối đa 1 dấu phân cách thập phân (dấu '.' hoặc ',')
    let foundSep = false;
    let sanitized = '';
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr[i];
      if (char === '.' || char === ',') {
        if (!foundSep) {
          sanitized += char;
          foundSep = true;
        }
      } else if (char === '-') {
        if (i === 0 && allowNegative) {
          sanitized += char;
        }
      } else {
        sanitized += char;
      }
    }

    setText(sanitized);

    // Tính toán giá trị số thực để thông báo lên component cha
    const num = parseDecimal(sanitized, fallback);
    lastParsedRef.current = num;
    onChange(num, sanitized);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;

    let trimmed = text.trim();
    // Bỏ dấu chấm/phẩy dư ở cuối nếu người dùng gõ xong nhưng bỏ dở (ví dụ "1," -> "1")
    if (trimmed.endsWith('.') || trimmed.endsWith(',')) {
      trimmed = trimmed.slice(0, -1);
    }

    let num = parseDecimal(trimmed, fallback);

    if (min !== undefined && num < min) {
      num = min;
      trimmed = String(min);
    }
    if (max !== undefined && num > max) {
      num = max;
      trimmed = String(max);
    }

    setText(trimmed);
    lastParsedRef.current = num;
    onChange(num, trimmed);

    if (onBlur) onBlur(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    if (rest.onFocus) rest.onFocus(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentNum = parseDecimal(text, fallback);
      const inc = step || 1;
      const nextNum = Math.round((currentNum + inc) * 10000) / 10000;
      if (max !== undefined && nextNum > max) return;
      setText(String(nextNum));
      lastParsedRef.current = nextNum;
      onChange(nextNum, String(nextNum));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentNum = parseDecimal(text, fallback);
      const inc = step || 1;
      const nextNum = Math.round((currentNum - inc) * 10000) / 10000;
      if (min !== undefined && nextNum < min) return;
      setText(String(nextNum));
      lastParsedRef.current = nextNum;
      onChange(nextNum, String(nextNum));
    }

    if (onKeyDown) onKeyDown(e);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
    />
  );
}

export { DecimalInput as QuantityInput };
export default DecimalInput;
