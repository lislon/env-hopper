import React from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Settings, ChevronDown } from "lucide-react";
import { useEhUserContext } from "~/contexts";
import { JumpButton } from "./JumpButton";

interface ActionButtonProps {
  onJump?: () => void;
}

function ToolsMenuContent() {
  return (
    <DropdownMenuContent className="w-52 text-xs">
      <DropdownMenuLabel>Environment</DropdownMenuLabel>
      <DropdownMenuItem>Manage env</DropdownMenuItem>
      <DropdownMenuItem>AWS console</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>Application</DropdownMenuLabel>
      <DropdownMenuItem>Releases</DropdownMenuItem>
      <DropdownMenuItem>Config table</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>App + Env</DropdownMenuLabel>
      <DropdownMenuItem>DB credentials</DropdownMenuItem>
      <DropdownMenuItem>Feature flags</DropdownMenuItem>
    </DropdownMenuContent>
  );
}

export function ActionButton({ onJump }: ActionButtonProps) {
  const { env, app } = useEhUserContext();
  const disabled = !env || !app;

  return (
    <div className="flex items-center gap-2">
      {/* Main Jump Button */}
      <JumpButton onJump={onJump} />

      {/* Tools Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="lg"
            disabled={disabled}
            className="px-3"
          >
            <Settings className="h-4 w-4 mr-1" />
            Tools
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <ToolsMenuContent />
      </DropdownMenu>
    </div>
  );
}
