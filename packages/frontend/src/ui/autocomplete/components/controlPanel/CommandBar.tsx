import React, { useState } from "react";
import { Input } from "~/components/ui/input";
import { useEhUserContext } from "~/contexts";
import { Slash } from "lucide-react";

interface CommandBarProps {
  onCommand?: (command: string) => void;
}

export function CommandBar({ onCommand }: CommandBarProps) {
  const [command, setCommand] = useState("");
  const { env, app, setEnv, setApp } = useEhUserContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onCommand?.(command.trim());
      setCommand("");
    }
  };

  const handleEnvClick = () => {
    // Could open environment selector or trigger some action
    console.log("Environment clicked:", env?.slug);
  };

  const handleAppClick = () => {
    // Could open app selector or trigger some action
    console.log("App clicked:", app?.slug);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Command Input */}
      <form onSubmit={handleSubmit}>
        <Input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Type environment or app"
          className="text-base h-12 px-4"
        />
      </form>

      {/* Context Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          onClick={handleEnvClick}
          className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          {env?.displayName || env?.slug || "no-env"}
        </button>
        <Slash className="w-3 h-3" />
        <button
          onClick={handleAppClick}
          className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          {app?.displayName || app?.slug || "no-app"}
        </button>
      </div>
    </div>
  );
} 