import type { Editor } from '@tiptap/react'
import { Bold, Italic, Link, List, ListOrdered, Redo, Undo } from 'lucide-react'
import { Button } from '~/ui/button'
import { cn } from '~/lib/utils'

interface MarkdownToolbarProps {
  editor: Editor
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
}

function ToolbarButton({
  onClick,
  isActive,
  icon: Icon,
  title,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('h-7 w-7 p-0', isActive && 'bg-muted')}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  )
}

export function MarkdownToolbar({ editor }: MarkdownToolbarProps) {
  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={List}
        title="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={ListOrdered}
        title="Numbered List"
      />
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive('link')}
        icon={Link}
        title="Add Link"
      />
      <div className="w-px h-4 bg-border mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        icon={Undo}
        title="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        icon={Redo}
        title="Redo"
      />
    </div>
  )
}
