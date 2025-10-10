import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTRPC } from '~/api/infra/trpc'
import { Button } from '~/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '~/ui/dialog'
import { Input } from '~/ui/input'
import { ScrollArea } from '~/ui/scroll-area'

interface IconPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (iconName: string) => void
  selectedIconName?: string
}

export function IconPickerDialog({
  open,
  onOpenChange,
  onSelect,
  selectedIconName,
}: IconPickerDialogProps) {
  const [search, setSearch] = useState('')
  const trpc = useTRPC()

  const queryOptions = trpc.icon.list.queryOptions()
  const { data: icons = [], isLoading } = useQuery({
    ...queryOptions,
    enabled: open,
  })

  type IconData = (typeof icons)[number]

  const filteredIcons = icons.filter((icon: IconData) =>
    icon.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSelect = (iconName: string) => {
    onSelect(iconName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Icon</DialogTitle>
          <DialogDescription>
            Search and select an icon from the available icons
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search icons by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading icons...</div>
          ) : filteredIcons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? `No icons found matching "${search}"` : 'No icons available'}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 pb-4">
              {filteredIcons.map((icon: IconData) => {
                const isSelected = icon.name === selectedIconName
                return (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => handleSelect(icon.name)}
                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-primary hover:shadow-md ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                    title={icon.name}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      <img
                        src={`/api/assets/${icon.id}?w=64`}
                        alt={icon.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <span className="text-xs text-center line-clamp-2 w-full wrap-break-word">
                      {icon.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
