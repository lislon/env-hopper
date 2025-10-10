import { Image, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/ui/button'
import { Label } from '~/ui/label'
import { IconPickerDialog } from './IconPickerDialog'

interface IconPickerFieldProps {
  label?: string
  value?: string
  onChange: (iconName: string | undefined) => void
  placeholder?: string
  required?: boolean
}

export function IconPickerField({
  label = 'Icon',
  value,
  onChange,
  placeholder = 'No icon selected',
  required = false,
}: IconPickerFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleClear = () => {
    onChange(undefined)
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(true)}
          className="flex-1 justify-start"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <img
                  src={`/api/icons/${value}`}
                  alt={value}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback if icon not found
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Image className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
        </Button>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            title="Clear icon"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <IconPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelect={onChange}
        selectedIconName={value}
      />
    </div>
  )
}
