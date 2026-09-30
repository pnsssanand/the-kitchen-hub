"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, BookOpen, Star, Clock, Edit2, Trash, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";

interface Recipe {
  id: string;
  name: string;
  category: "known" | "wishlist";
  time: string;
  type: string;
  steps?: string[];
}

export default function RecipesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"known" | "wishlist">("known");

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Recipe, "id">>({ name: "", category: "known", time: "", type: "Lunch", steps: [] });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/recipes`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];
      setRecipes(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredRecipes = recipes.filter(r => 
    r.category === activeTab && 
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingId(recipe.id);
      setFormData({ name: recipe.name, category: recipe.category, time: recipe.time, type: recipe.type, steps: recipe.steps || [] });
    } else {
      setEditingId(null);
      setFormData({ name: "", category: activeTab, time: "", type: "Lunch", steps: [] });
    }
    setIsModalOpen(true);
  };

  const handleStepCountChange = (count: number) => {
    setFormData(prev => {
      const currentSteps = prev.steps || [];
      const newSteps = [...currentSteps];
      if (count > currentSteps.length) {
        for (let i = currentSteps.length; i < count; i++) {
          newSteps.push("");
        }
      } else if (count < currentSteps.length && count >= 0) {
        newSteps.splice(count);
      }
      return { ...prev, steps: newSteps };
    });
  };

  const handleStepChange = (index: number, value: string) => {
    setFormData(prev => {
      const newSteps = [...(prev.steps || [])];
      newSteps[index] = value;
      return { ...prev, steps: newSteps };
    });
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name) {
      toast.error("Recipe name is required");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, `users/${user.uid}/recipes`, editingId), formData);
        toast.success("Recipe updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/recipes`), formData);
        toast.success("Recipe added");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save recipe");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm("Are you sure you want to delete this recipe?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/recipes`, id));
        toast.success("Recipe deleted");
      } catch (error) {
        toast.error("Failed to delete recipe");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">My Recipes</h2>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Add Recipe
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex bg-card p-1 rounded-xl border border-border w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("known")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "known" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            I Know How To Cook
          </button>
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "wishlist" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Wishlist To Learn
          </button>
        </div>

        <div className="w-full sm:w-72">
          <Input 
            placeholder="Search recipes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} />} 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <Card 
              key={recipe.id} 
              className="p-0 overflow-hidden hover:shadow-soft-lg transition-all-smooth cursor-pointer group relative"
              onClick={() => handleOpenModal(recipe)}
            >
              <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-lg p-1">
                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(recipe); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md">
                  <Edit2 size={16} />
                </button>
                <button onClick={(e) => handleDelete(recipe.id, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md">
                  <Trash size={16} />
                </button>
              </div>

              <div className="h-40 bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <BookOpen size={40} className="opacity-20" />
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{recipe.name}</h3>
                  <Star size={18} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {recipe.time}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                    {recipe.type}
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {filteredRecipes.length === 0 && (
            <div className="col-span-full py-16 text-center bg-card rounded-3xl border border-dashed border-border">
              <BookOpen size={48} className="mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your kitchen story starts here.</h3>
              <p className="text-muted-foreground mb-6">Start building your personal recipe book.</p>
              <Button onClick={() => handleOpenModal()}>Add Your First Recipe</Button>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Recipe' : 'Add Recipe'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="Recipe Name" 
                placeholder="E.g. Chicken Biryani" 
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
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Dessert</option>
                    <option>Snack</option>
                  </select>
                </div>
                <Input 
                  label="Time" 
                  placeholder="E.g. 45 min" 
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as "known" | "wishlist"})}
                >
                  <option value="known">I Know How To Cook</option>
                  <option value="wishlist">Wishlist To Learn</option>
                </select>
              </div>

              <div className="border-t border-border pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-foreground">Recipe Steps</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Count:</span>
                    <input 
                      type="number" 
                      min="0"
                      className="w-16 h-8 rounded-lg border border-border bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.steps?.length || 0}
                      onChange={(e) => handleStepCountChange(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {formData.steps?.map((step, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                        {index + 1}
                      </span>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder={`Step ${index + 1} instructions...`}
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                      />
                      <button 
                        onClick={() => handleStepCountChange((formData.steps?.length || 1) - 1)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 mt-1"
                        title="Remove step"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 border-dashed"
                    onClick={() => handleStepCountChange((formData.steps?.length || 0) + 1)}
                  >
                    <Plus size={16} className="mr-2" /> Add Step
                  </Button>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-card py-2 border-t border-border mt-4">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Recipe'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
