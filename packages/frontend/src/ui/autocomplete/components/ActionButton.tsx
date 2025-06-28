import React from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui";
import { ChevronDown } from "lucide-react";
import { useEhUserContext } from "~/contexts";

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
    <div className="flex">
      <Button 
        className="rounded-r-none" 
        disabled={disabled}
        onClick={onJump}
      >
        Jump
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="rounded-l-none" disabled={disabled}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <ToolsMenuContent />
      </DropdownMenu>
    </div>
  );
} 