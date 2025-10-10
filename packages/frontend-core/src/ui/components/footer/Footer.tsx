import { ExternalLink } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>Built with</span>
          <a
            href="https://ui.shadcn.com/docs/components"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            shadcn/ui
            <ExternalLink className="h-3 w-3" />
          </a>
          <span className="mx-2">•</span>
          <a
            href="https://lucide.dev/icons/expand"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Lucide Icons
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
          <div className='grid grid-cols-4 w-[700px] gap-1 text-sm '>
            <div className='p-1 bg-accent'>bg-accent</div>
            <div className='p-1 bg-background'>bg-background</div>
            <div className='p-1 bg-highlight'>bg-highglight</div>
            <div className='p-1 bg-card'>bg-card</div>
            <div className='p-1 bg-popover'>bg-poprover</div>
            <div className='p-1 bg-secondary'>bg-secondary</div>
            <div className='p-1 bg-muted'>bg-muted</div>
            <div className='p-1 bg-chart-1'>bg-chart-1</div>
            <div className='p-1 bg-chart-2'>bg-chart-2</div>
            <div className='p-1 bg-sidebar'>bg-sidebar</div>
            <div className='p-1 bg-input'>bg-input</div>
            <div className='p-1 bg-border'>bg-border</div>
            <div className='p-1 bg-sidebar-primary'>bg-sidebar-primary</div>
            <div className='p-1 bg-sidebar-accent'>bg-sidebar-accent</div>
            <div className='p-1 bg-sidebar-border'>bg-sidebar-border</div>
          </div>
      </div>
    </footer>
  )
}
