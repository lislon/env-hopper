import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '~/lib/utils'
import { Button } from '~/ui/button'
import { Textarea } from '~/ui/textarea'
import { MarkdownToolbar } from './MarkdownToolbar'

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
  disabled?: boolean
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className,
  minHeight = '120px',
  disabled = false,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<'visual' | 'raw'>('visual')
  const [rawValue, setRawValue] = useState(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: editorInstance }) => {
      const markdown = editorInstance.storage.markdown.getMarkdown()
      onChange(markdown)
      setRawValue(markdown)
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.storage.markdown.getMarkdown()) {
      editor.commands.setContent(value)
      setRawValue(value)
    }
  }, [value, editor])

  const handleModeToggle = useCallback(() => {
    if (mode === 'visual') {
      // Switching to raw - get current markdown
      if (editor) {
        setRawValue(editor.storage.markdown.getMarkdown())
      }
      setMode('raw')
    } else {
      // Switching to visual - update editor with raw content
      if (editor) {
        editor.commands.setContent(rawValue)
      }
      onChange(rawValue)
      setMode('visual')
    }
  }, [mode, editor, rawValue, onChange])

  const handleRawChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setRawValue(e.target.value)
      onChange(e.target.value)
    },
    [onChange],
  )

  return (
    <div className={cn('border rounded-md', className)}>
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between border-b px-2 py-1 bg-muted/30">
        {mode === 'visual' && editor && <MarkdownToolbar editor={editor} />}
        {mode === 'raw' && (
          <span className="text-xs text-muted-foreground">Markdown</span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleModeToggle}
          className="text-xs"
          disabled={disabled}
        >
          {mode === 'visual' ? 'Raw' : 'Visual'}
        </Button>
      </div>

      {/* Editor content */}
      {mode === 'visual' ? (
        <EditorContent
          editor={editor}
          className={cn(
            'prose prose-sm max-w-none p-3',
            'focus-within:outline-none',
            '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[var(--min-h)]',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          style={{ '--min-h': minHeight } as React.CSSProperties}
        />
      ) : (
        <Textarea
          value={rawValue}
          onChange={handleRawChange}
          placeholder={placeholder}
          className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-none"
          style={{ minHeight }}
          disabled={disabled}
        />
      )}
    </div>
  )
}
