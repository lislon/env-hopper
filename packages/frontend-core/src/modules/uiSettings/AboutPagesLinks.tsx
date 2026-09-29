import { Button } from '~/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/ui/dialog'
import { useUiSettings } from './UiSettingsContext'

/**
 * One trigger per consumer-supplied about page, each opening the page content
 * in a modal. The core supplies only the chrome; a later UI pass owns how this
 * is ultimately presented.
 */
export function AboutPagesLinks() {
  const { slots } = useUiSettings()
  const pages = slots?.aboutPages

  if (!pages?.length) {
    return null
  }

  return pages.map((page) => (
    <Dialog key={page.id}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          {page.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page.title}</DialogTitle>
        </DialogHeader>
        {page.content}
      </DialogContent>
    </Dialog>
  ))
}
