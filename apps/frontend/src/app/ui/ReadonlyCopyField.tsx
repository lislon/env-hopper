import React, { useRef } from 'react';
import { CopyButton } from './CopyButton';

export interface ReadonlyCopyFieldProps {
  value: string;
  isHideSensitiveInfo?: boolean;
}

export function ReadonlyCopyField({
  value,
  isHideSensitiveInfo,
}: ReadonlyCopyFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label className="input input-bordered flex items-center gap-2 pr-0 input-sm">
      <input
        ref={inputRef}
        type={isHideSensitiveInfo ? 'password' : 'text'}
        className="grow text-ellipsis"
        value={value}
        onClick={(e) => e.currentTarget.select()}
        readOnly={true}
      />
      <CopyButton value={value} />
    </label>
  );
}
