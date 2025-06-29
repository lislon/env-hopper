import React from "react";
import { Button } from "~/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useEhUserContext } from "~/contexts";

interface JumpButtonProps {
  onJump?: () => void;
}

export function JumpButton({ onJump }: JumpButtonProps) {
  const { env, app } = useEhUserContext();
  const disabled = !env || !app;

  return (
    <Button 
      size="lg"
      className="
        animated-button
        relative overflow-hidden group
        bg-gradient-to-r from-primary to-primary/80 
        hover:from-primary/90 hover:to-primary/70
        text-primary-foreground font-semibold
        shadow-lg hover:shadow-xl
        hover:scale-105 active:scale-95
        transition-all duration-200 ease-out
        min-w-[120px]
      "
      disabled={disabled}
      onClick={onJump}
    >
      {/* Animated background shine effect */}
      <div className="
        absolute inset-0 
        bg-gradient-to-r from-transparent via-white/20 to-transparent
        -translate-x-full group-hover:translate-x-full
        transition-transform duration-700 ease-out
      " />
      
      {/* Button content */}
      <div className="relative flex items-center gap-2">
        <Zap 
          className="h-4 w-4 group-hover:animate-pulse"
        />
        <span>Jump</span>
        <ArrowRight className="
          h-4 w-4 
          transform group-hover:translate-x-1
          transition-transform duration-200 ease-out
        " />
      </div>
      
      {/* Pulse effect when enabled */}
      {!disabled && (
        <div className="
          absolute inset-0 rounded-md
          bg-primary/30 animate-ping
          group-hover:animate-none
          transition-opacity duration-200 ease-out
        " />
      )}
    </Button>
  );
} 