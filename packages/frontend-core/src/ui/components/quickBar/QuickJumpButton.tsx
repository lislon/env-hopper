import React from 'react'

interface QuickJumpButtonProps {
  onClick?: (e: React.MouseEvent) => void
  className?: string
}

export function QuickJumpButton({
  onClick,
  className = '',
}: QuickJumpButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute right-0 top-0 bottom-0 pl-3 pr-4 text-[10px] font-medium text-green-600 hover:bg-green-600 hover:text-white rounded-r-md cursor-pointer flex items-center ${className}`}
    >
      QUICK JUMP
    </button>
  )
}
