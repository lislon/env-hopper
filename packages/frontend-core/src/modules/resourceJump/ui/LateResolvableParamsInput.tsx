import { ArrowUpLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'

interface LateResolvableParamsInputProps {
  className?: string
}

export function LateResolvableParamsInput({
  className,
}: LateResolvableParamsInputProps) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Button variant="outline" className="justify-start">
        <ArrowUpLeft className="w-4 h-4 mr-2" />
        <span>Home</span>
      </Button>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-sm font-medium text-foreground">
          Rm Case ID
        </label>
        <Input type="text" placeholder="Enter Rm Case ID" />
      </div>
    </div>
  )
}

