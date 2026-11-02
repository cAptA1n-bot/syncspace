'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { connectSocket, getSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  CodeSquare,
  Minus,
  Table as TableIcon,
  Highlighter,
  Link as LinkIcon,
  Undo,
  Redo,
  Sparkles,
  Check,
  CloudUpload,
  AlertCircle,
  Users,
} from 'lucide-react';

export const TipTapEditor = ({
  documentId,
  initialContent,
  onSave,
  isReadOnly = false,
  onOpenAiSummary,
}) => {
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [collaborators, setCollaborators] = useState([]);
  const saveTimeoutRef = useRef(null);
  const isRemoteUpdateRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: true,
      }),
      Placeholder.configure({
        placeholder: 'Write something, or type "/" for commands...',
      }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#60A5FA] underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
      }),
    ],
    content: initialContent || '',
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      if (isRemoteUpdateRef.current) {
        isRemoteUpdateRef.current = false;
        return;
      }

      setSaveStatus('saving');

      // Emit real-time content changes to other active collaborators
      const socket = getSocket();
      if (socket && socket.connected && documentId) {
        socket.emit('doc-change', {
          documentId,
          content: editor.getJSON(),
        });
      }

      // Debounce durable save to backend
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (onSave) {
            await onSave({ content: editor.getJSON() });
          }
          setSaveStatus('saved');
        } catch (err) {
          console.error('Autosave error:', err);
          setSaveStatus('error');
        }
      }, 1200);
    },
  });

  // Socket.IO real-time collaboration hook
  useEffect(() => {
    if (!documentId) return;

    const socket = connectSocket();
    if (!socket) return;

    socket.emit('join-document', { documentId });

    socket.on('user-joined', (userData) => {
      setCollaborators((prev) => {
        if (prev.some((u) => u.userId === userData.userId)) return prev;
        return [...prev, userData];
      });
    });

    socket.on('user-left', ({ userId }) => {
      setCollaborators((prev) => prev.filter((u) => u.userId !== userId));
    });

    socket.on('room-users', (users) => {
      setCollaborators(users.filter((u) => u.userId !== user?.id));
    });

    socket.on('doc-change', ({ content }) => {
      if (editor && content) {
        isRemoteUpdateRef.current = true;
        editor.commands.setContent(content, false);
      }
    });

    return () => {
      socket.emit('leave-document', { documentId });
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-users');
      socket.off('doc-change');
    };
  }, [documentId, editor, user]);

  // Update content if initialContent changes and editor is ready
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      const currentJSON = JSON.stringify(editor.getJSON());
      const nextJSON = JSON.stringify(initialContent);
      if (currentJSON !== nextJSON && !editor.isFocused) {
        editor.commands.setContent(initialContent);
      }
    }
  }, [initialContent, editor]);

  const addLink = () => {
    const url = window.prompt('Enter link URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col w-full h-full bg-[#0F172A]">
      {/* Top Editor Bar: Formatting Tools & Status */}
      <div className="sticky top-16 z-20 bg-[#111F33] border-b border-[#334155] px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        {/* Toolbar buttons */}
        <div className="flex items-center flex-wrap gap-0.5 text-[#94A3B8]">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('bold') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('italic') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('underline') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('strike') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors ${
              editor.isActive('highlight') ? 'bg-[#FDE047] text-[#0F172A] font-semibold shadow-sm' : ''
            }`}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('code') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#334155] mx-1" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('heading', { level: 1 }) ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('heading', { level: 2 }) ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('heading', { level: 3 }) ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#334155] mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('bulletList') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('orderedList') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('taskList') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('blockquote') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('codeBlock') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Code Block"
          >
            <CodeSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B]"
            title="Divider"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={addTable}
            className="p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B]"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>

          <button
            onClick={addLink}
            className={`p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] ${
              editor.isActive('link') ? 'bg-[#2563EB] text-white' : ''
            }`}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#334155] mx-1" />

          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:text-[#F8FAFC] hover:bg-[#1E293B] disabled:opacity-30"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Right side: Collaborators, AI action, and Save Status */}
        <div className="flex items-center gap-3">
          {/* Active Collaborators Presence */}
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded-full border border-[#334155]">
              <Users className="w-3.5 h-3.5 text-[#60A5FA]" />
              <div className="flex -space-x-1.5">
                {collaborators.slice(0, 4).map((c, i) => (
                  <div
                    key={c.userId || i}
                    className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold border border-[#0F172A]"
                    title={c.user?.firstName || 'Collaborator'}
                  >
                    {c.user?.firstName?.[0] || 'C'}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-[#94A3B8]">
                {collaborators.length} active
              </span>
            </div>
          )}

          {/* AI Summarize Action */}
          {onOpenAiSummary && (
            <button
              onClick={onOpenAiSummary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 border border-[#3B82F6]/40 text-xs font-medium text-[#60A5FA] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Summary</span>
            </button>
          )}

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[#94A3B8]">
                <CloudUpload className="w-3.5 h-3.5 animate-pulse text-[#60A5FA]" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[#10B981]">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save failed</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8">
        <EditorContent editor={editor} />
      </div>

      {/* Word / Character count footer */}
      <div className="border-t border-[#334155]/60 px-6 py-2 text-[11px] text-[#64748B] flex justify-between items-center bg-[#0F172A]">
        <span>SyncSpace Collaborative Canvas</span>
        <span>
          {editor.storage.characterCount?.words()} words ·{' '}
          {editor.storage.characterCount?.characters()} characters
        </span>
      </div>
    </div>
  );
};

export default TipTapEditor;

