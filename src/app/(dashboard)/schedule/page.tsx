"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit2, Trash, X, Loader2 } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";

interface Meal {
  id: string;
  type: string;
  time: string;
  name: string;
  desc: string;
  completed: boolean;
  date: string;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Meal, "id" | "completed" | "date">>({ type: "Morning", time: "", name: "", desc: "" });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/schedule`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Meal[];
      setMeals(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const formattedCurrentDate = format(currentDate, "yyyy-MM-dd");
  const currentMeals = useMemo(() => {
    return meals
      .filter(m => m.date === formattedCurrentDate)
      .sort((a, b) => {
        const order = { "Morning": 1, "Afternoon": 2, "Snack": 3, "Dinner": 4 };
        return (order[a.type as keyof typeof order] || 5) - (order[b.type as keyof typeof order] || 5);
      });
  }, [meals, formattedCurrentDate]);

  const handleOpenModal = (meal?: Meal) => {
    if (meal) {
      setEditingId(meal.id);
      setFormData({ type: meal.type, time: meal.time, name: meal.name, desc: meal.desc });
    } else {
      setEditingId(null);
      setFormData({ type: "Morning", time: "", name: "", desc: "" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name || !formData.time) {
      toast.error("Name and time are required");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, `users/${user.uid}/schedule`, editingId), formData);
        toast.success("Meal updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/schedule`), {
          ...formData,
          completed: false,
          date: formattedCurrentDate
        });
        toast.success("Meal added");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save meal");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this meal?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/schedule`, id));
        toast.success("Meal deleted");
      } catch (error) {
        toast.error("Failed to delete meal");
      }
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/schedule`, id), { completed: !currentStatus });
    } catch (error) {
      toast.error("Failed to update meal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Cooking Schedule</h2>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Add Meal
        </Button>
      </div>

      <Card className="p-4 sm:p-6">
        {/* Date Selector */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
            <ChevronLeft size={20} />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <CalendarIcon size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{format(currentDate, "MMMM d, yyyy")}</h3>
              <p className="text-sm text-muted-foreground">{format(currentDate, "EEEE")}</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Meals List */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-4">
            {currentMeals.map((meal) => (
              <div 
                key={meal.id} 
                className={`flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all-smooth
                  ${meal.completed ? 'bg-muted/30 border-border/50' : 'bg-card border-border hover:border-primary/30 hover:shadow-soft'}`}
              >
                <div className="w-24 shrink-0 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-primary">{meal.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{meal.time}</p>
                </div>
                
                <div className="flex-1 border-l sm:border-l-2 border-border pl-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => toggleComplete(meal.id, meal.completed)}>
                      <h4 className={`text-lg font-semibold ${meal.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {meal.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{meal.desc}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenModal(meal)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                        <Edit2 size={18} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(meal.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {currentMeals.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No meals scheduled</h3>
                <p className="text-muted-foreground mb-6">Plan your day to stay on track with your cooking.</p>
                <Button variant="outline" onClick={() => handleOpenModal()}>Schedule a Meal</Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Meal' : 'Add Meal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="Meal Name" 
                placeholder="E.g. Chicken Rice" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <select 
                    className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </select>
                </div>
                <Input 
                  label="Time" 
                  placeholder="E.g. 08:00 AM" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <Input 
                label="Description (Optional)" 
                placeholder="E.g. High protein meal" 
                value={formData.desc}
                onChange={(e) => setFormData({...formData, desc: e.target.value})}
              />
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Meal'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
