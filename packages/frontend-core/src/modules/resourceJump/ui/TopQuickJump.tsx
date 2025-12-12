import { AppSwitcher } from "~/modules/resourceJump/ui/AppSwitcher";
import { CommandPalette } from "~/modules/resourceJump/ui/cmdk/CommandPalette";
import { EnvSwitcher } from "~/modules/resourceJump/ui/EnvSwitcher";

export function TopQuickJump() {
    return (
        <div className="border border-dashed border-amber-400 rounded-2xl w-[800px] p-4 flex">
            <div className="flex flex-col gap-2 items-center">
                <CommandPalette label='Other Env...'  />
                <div><EnvSwitcher /></div>
            </div>
            <div className="border border-l-1 mx-4 my-2 border-border/50"></div>
            <div className="flex flex-col gap-2 items-center">
                <div>Apps</div>
                <div><AppSwitcher /></div>
            </div>

                
        </div>
    );
}