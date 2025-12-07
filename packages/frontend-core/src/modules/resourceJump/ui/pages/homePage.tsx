import { ConstructionIcon } from "lucide-react";

export function HomePage() {
  return (
    <div className="flex flex-col gap-4 w-[600px] py-12 items-center">
      <div>
      <ConstructionIcon className="w-16 h-16 stroke-amber-500" />
      </div>
      <div>
        Please select app and env first, this page is not yet ready
      </div>
    </div>
  )
}
