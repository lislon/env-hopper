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
      </div>
    </footer>
  )
}
