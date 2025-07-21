import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Toggle } from '@/components/ui/toggle';
import { Textarea } from '@/components/ui/textarea';
import { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Eye,
  Code2,
  Type
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [markdownContent, setMarkdownContent] = useState(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        HTMLAttributes: {
          class: 'rounded-lg mx-auto',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setMarkdownContent(html);
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Ingresa la URL de la imagen:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Ingresa la URL del enlace:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = window.prompt('Ingresa la URL de YouTube:');
    if (url && editor) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const toggleMarkdownView = () => {
    if (showMarkdown) {
      // Switching back to rich text
      editor?.commands.setContent(markdownContent);
      setShowMarkdown(false);
    } else {
      // Switching to markdown
      setMarkdownContent(editor?.getHTML() || '');
      setShowMarkdown(true);
    }
  };

  const handleMarkdownChange = (value: string) => {
    setMarkdownContent(value);
    onChange(value);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b p-2 bg-muted/30">
        <div className="flex flex-wrap items-center gap-1">
          {/* View Toggle */}
          <div className="flex items-center gap-1 mr-2">
            <Toggle
              size="sm"
              pressed={!showMarkdown}
              onPressedChange={() => !showMarkdown && toggleMarkdownView()}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Eye className="h-4 w-4" />
            </Toggle>
            <Toggle
              size="sm"
              pressed={showMarkdown}
              onPressedChange={() => showMarkdown && toggleMarkdownView()}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Code2 className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {!showMarkdown && (
            <>
              {/* Text Formatting */}
              <Toggle
                size="sm"
                pressed={editor.isActive('bold')}
                onPressedChange={() => editor.chain().focus().toggleBold().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Bold className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('italic')}
                onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Italic className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('strike')}
                onPressedChange={() => editor.chain().focus().toggleStrike().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Strikethrough className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('code')}
                onPressedChange={() => editor.chain().focus().toggleCode().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Code className="h-4 w-4" />
              </Toggle>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Headings */}
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 1 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Heading1 className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 2 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Heading2 className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('heading', { level: 3 })}
                onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Heading3 className="h-4 w-4" />
              </Toggle>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Lists */}
              <Toggle
                size="sm"
                pressed={editor.isActive('bulletList')}
                onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <List className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('orderedList')}
                onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <ListOrdered className="h-4 w-4" />
              </Toggle>
              <Toggle
                size="sm"
                pressed={editor.isActive('blockquote')}
                onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Quote className="h-4 w-4" />
              </Toggle>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Media */}
              <Button
                variant="ghost"
                size="sm"
                onClick={addImage}
                className="h-8 w-8 p-0"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={addLink}
                className="h-8 w-8 p-0"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={addYoutube}
                className="h-8 w-8 p-0"
              >
                <Video className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              {/* Undo/Redo */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {showMarkdown ? (
          <Textarea
            value={markdownContent}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder={placeholder || 'Escribe el contenido en markdown...'}
            className="min-h-[300px] border-0 resize-none focus-visible:ring-0 font-mono text-sm"
          />
        ) : (
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-4 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[260px] [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_p]:mb-2 [&_.ProseMirror_ul]:mb-2 [&_.ProseMirror_ol]:mb-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted-foreground [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded"
          />
        )}
      </div>
    </div>
  );
}