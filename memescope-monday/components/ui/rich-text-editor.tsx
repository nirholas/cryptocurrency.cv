"use client"

import {
  RiBold,
  RiDoubleQuotesL,
  RiH1,
  RiH2,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
} from "@remixicon/react"
import Placeholder from "@tiptap/extension-placeholder"
import type { AnyExtension } from "@tiptap/core"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@/lib/utils"

import { Button } from "./button"

// Styles communs pour le contenu riche
const RICH_TEXT_STYLES =
  "prose prose-sm prose-zinc dark:prose-invert max-w-none w-full whitespace-pre-wrap [&_h1]:my-2 [&_h2]:my-1 [&_p]:my-2 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0.5"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

interface RichTextDisplayProps {
  content: string
  className?: string
}

// Composant pour afficher le contenu riche formaté
export function RichTextDisplay({ content, className }: RichTextDisplayProps) {
  return (
    <div
      className={cn(RICH_TEXT_STYLES, className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// Composant éditeur
export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }) as unknown as AnyExtension,
      Placeholder.configure({
        placeholder,
      }) as unknown as AnyExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(RICH_TEXT_STYLES, "focus:outline-none min-h-[120px] px-3 py-2"),
        spellcheck: "false",
      },
    },
  })

  if (!editor) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain = () => editor.chain().focus() as any

  return (
    <div
      className={cn(
        "focus-within:border-ring focus-within:ring-ring rounded-md border focus-within:ring-1",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="bg-muted sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-t-sm border-b px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleHeading({ level: 1 }).run()}
          className={cn("h-8 px-2", editor.isActive("heading", { level: 1 }) && "bg-muted")}
        >
          <RiH1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
          className={cn("h-8 px-2", editor.isActive("heading", { level: 2 }) && "bg-muted")}
        >
          <RiH2 className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleBold().run()}
          className={cn("h-8 px-2", editor.isActive("bold") && "bg-muted")}
        >
          <RiBold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleItalic().run()}
          className={cn("h-8 px-2", editor.isActive("italic") && "bg-muted")}
        >
          <RiItalic className="h-4 w-4" />
        </Button>

        <div className="bg-border mx-1 h-6 w-px" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleBulletList().run()}
          className={cn("h-8 px-2", editor.isActive("bulletList") && "bg-muted")}
        >
          <RiListUnordered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleOrderedList().run()}
          className={cn("h-8 px-2", editor.isActive("orderedList") && "bg-muted")}
        >
          <RiListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => chain().toggleBlockquote().run()}
          className={cn("h-8 px-2", editor.isActive("blockquote") && "bg-muted")}
        >
          <RiDoubleQuotesL className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
