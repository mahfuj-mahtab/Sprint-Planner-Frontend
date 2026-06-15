import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

function ToolbarButton({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md border transition text-muted-foreground hover:text-foreground hover:bg-muted/60",
        active ? "bg-muted text-foreground border-border" : "border-transparent"
      )}
    >
      {children}
    </button>
  );
}

export function RichDocEditor({ value, onChange, editable = true, placeholder = "Start writing…" }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || EMPTY_DOC,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-doc min-h-[420px] px-6 py-5 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || value === undefined) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value || EMPTY_DOC);
    if (current !== incoming) {
      editor.commands.setContent(value || EMPTY_DOC, false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {editable ? (
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-border bg-card/80">
          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarButton
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarButton
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Quote"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
            <Link2 className="w-4 h-4" />
          </ToolbarButton>
          <span className="w-px h-5 bg-border mx-1" />
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>
        </div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}

export { EMPTY_DOC };
