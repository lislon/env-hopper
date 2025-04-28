import React, { useRef, useState } from 'react';

export function ReadonlyCopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const defaultIconRef = useRef(null);
  const successIconRef = useRef(null);

  async function onClick() {
    if (inputRef.current) {
      await navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }

  return (
    <label className="input input-bordered flex items-center gap-2 pr-0 input-sm">
      <input
        ref={inputRef}
        type="text"
        className="grow text-ellipsis"
        value={value}
        onClick={(e) => e.currentTarget.select()}
        readOnly={true}
      />
      <button
        tabIndex={-1}
        className="btn btn-ghost items-center font-medium text-center btn-sm"
        title="Copy to clipboard"
        type="button"
        onClick={onClick}
      >
        <span ref={defaultIconRef} className={copied ? 'hidden' : ''}>
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 20"
          >
            <path d="M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z" />
          </svg>
        </span>
        <span
          ref={successIconRef}
          className={copied ? 'inline-flex items-center' : 'hidden'}
        >
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 16 12"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 5.917 5.724 10.5 15 1.5"
            />
          </svg>
        </span>
      </button>
    </label>
  );
  return (
    <label>
      <div className="flex">
        <input
          type="text"
          value={value}
          className="dark:text-gray-000 py-1 px-2 bg-gray-200 dark:bg-gray-700 rounded-l w-full dark:border-0 border"
        />
        <div className="dark:bg-gray-700 flex items-center rounded-r"></div>
      </div>
    </label>
  );
}
