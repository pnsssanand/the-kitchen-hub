"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, Pin, FileText, Loader2, X, Trash, Edit2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";

interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: any;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "", pinned: false });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, `users/${user.uid}/notes`),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(fetchedNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveNote = async () => {
    if (!user) return;
    if (!newNote.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    setIsSaving(true);
    try {
      if (editingNoteId) {
        await updateDoc(doc(db, `users/${user.uid}/notes`, editingNoteId), {
          title: newNote.title,
          content: newNote.content,
          pinned: newNote.pinned,
        });
        toast.success("Note updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/notes`), {
          ...newNote,
          createdAt: serverTimestamp()
        });
        toast.success("Note added");
      }
      handleCloseModal();
    } catch (error) {
      toast.error(editingNoteId ? "Failed to update note" : "Failed to add note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenModal = (note?: Note) => {
    if (note) {
      setEditingNoteId(note.id);
      setNewNote({ title: note.title, content: note.content, pinned: note.pinned });
    } else {
      setEditingNoteId(null);
      setNewNote({ title: "", content: "", pinned: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNoteId(null);
    setNewNote({ title: "", content: "", pinned: false });
  };

  const togglePin = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/notes`, id), {
        pinned: !currentStatus
      });
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/notes`, id));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned === b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Personal Notes</h2>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> New Note
        </Button>
      </div>

      <div className="w-full md:w-96">
        <Input 
          placeholder="Search notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={18} />} 
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNotes.map((note) => (
            <Card key={note.id} className={`relative group hover:shadow-soft-lg transition-all-smooth ${note.pinned ? 'bg-yellow-50/50 border-yellow-200/50' : ''}`}>
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => handleOpenModal(note)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-600 p-1"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1"
                >
                  <Trash size={16} />
                </button>
                <button 
                  onClick={() => togglePin(note.id, note.pinned)}
                  className={`${note.pinned ? 'text-primary' : 'text-muted-foreground opacity-0 group-hover:opacity-100'} transition-opacity p-1`}
                >
                  <Pin size={18} className={note.pinned ? 'fill-primary/20' : ''} />
                </button>
              </div>
              
              <h3 className="font-semibold text-lg mb-2 pr-16">{note.title}</h3>
              <p className="text-muted-foreground text-sm line-clamp-6 mb-4 whitespace-pre-wrap">
                {note.content}
              </p>
            </Card>
          ))}

          {sortedNotes.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card rounded-3xl border border-dashed border-border">
              <FileText size={48} className="mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notes found.</h3>
              <p className="text-muted-foreground mb-6">Write down your kitchen thoughts, recipes, or ideas.</p>
              <Button onClick={() => handleOpenModal()}>Create a Note</Button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingNoteId ? 'Edit Note' : 'Create Note'}</h3>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="Title" 
                placeholder="Grocery List" 
                value={newNote.title}
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Content</label>
                <textarea 
                  className="flex min-h-[150px] w-full rounded-2xl border border-border bg-card px-4 py-3 text-base transition-all-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                  placeholder="Write your note here..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  checked={newNote.pinned}
                  onChange={(e) => setNewNote({...newNote, pinned: e.target.checked})}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Pin this note</span>
              </label>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                <Button onClick={handleSaveNote} isLoading={isSaving}>{editingNoteId ? 'Save Changes' : 'Save Note'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
