"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Search, ShoppingCart, CheckCircle2, Circle, Edit2, Trash, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";

interface KitchenItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  status: "have" | "buy" | "clothing" | "india";
}

export default function KitchenPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"have" | "buy" | "clothing" | "india">("have");

  const [items, setItems] = useState<KitchenItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<KitchenItem, "id">>({ name: "", category: "Pantry", quantity: "", status: "have" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/kitchen`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as KitchenItem[];
      setItems(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const filteredItems = items.filter(i => 
    i.status === activeTab && 
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (item?: KitchenItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ name: item.name, category: item.category, quantity: item.quantity, status: item.status });
    } else {
      setEditingId(null);
      setFormData({ name: "", category: "Pantry", quantity: "", status: activeTab });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name) {
      toast.error("Item name is required");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, `users/${user.uid}/kitchen`, editingId), formData);
        toast.success("Item updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/kitchen`), formData);
        toast.success("Item added");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/kitchen`, id));
        toast.success("Item deleted");
      } catch (error) {
        toast.error("Failed to delete item");
      }
    }
  };

  const changeStatus = async (id: string, newStatus: "have" | "buy" | "clothing" | "india") => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/kitchen`, id), {
        status: newStatus
      });
      toast.success("Item moved");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Kitchen Essentials</h2>
        <Button className="w-full sm:w-auto" onClick={() => handleOpenModal()}>
          <Plus size={18} className="mr-2" /> Add Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex bg-card p-1 rounded-xl border border-border w-full sm:w-fit overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab("have")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "have" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            I Have
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "buy" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Need To Buy
          </button>
          <button
            onClick={() => setActiveTab("clothing")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "clothing" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Clothing Items
          </button>
          <button
            onClick={() => setActiveTab("india")}
            className={`flex-1 sm:flex-none whitespace-nowrap px-6 py-2 rounded-lg text-sm font-medium transition-all-smooth ${
              activeTab === "india" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            India Items
          </button>
        </div>

        <div className="w-full sm:w-72">
          <Input 
            placeholder="Search ingredients..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search size={18} />} 
          />
        </div>
      </div>

      <Card className="p-2 sm:p-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border group">
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground">
                    {activeTab === "have" ? <CheckCircle2 size={24} className="text-primary" /> : <Circle size={24} />}
                  </div>
                  <div>
                    <h4 className="font-medium text-base">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 sm:mt-0 ml-10 sm:ml-0 justify-between sm:justify-end w-full sm:w-auto">
                  <span className="text-sm font-medium bg-secondary px-3 py-1 rounded-full text-secondary-foreground shrink-0">
                    {item.quantity}
                  </span>
                  
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                      <Edit2 size={18} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash size={18} />
                    </Button>
                    <select
                      className="hidden sm:flex ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      value={item.status}
                      onChange={(e) => changeStatus(item.id, e.target.value as "have" | "buy" | "clothing" | "india")}
                    >
                      <option value="have">I Have</option>
                      <option value="buy">Need to Buy</option>
                      <option value="clothing">Clothing Items</option>
                      <option value="india">India Items</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart size={40} className="mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground">Your list is empty.</p>
                <Button className="mt-4" onClick={() => handleOpenModal()}>Add First Item</Button>
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
              <h3 className="text-xl font-semibold">{editingId ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="Item Name" 
                placeholder="E.g. Chicken Breast" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select 
                    className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Produce</option>
                    <option>Meat</option>
                    <option>Dairy</option>
                    <option>Pantry</option>
                    <option>Spices</option>
                    <option>Other</option>
                  </select>
                </div>
                <Input 
                  label="Quantity" 
                  placeholder="E.g. 1 kg" 
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as "have" | "buy" | "clothing" | "india"})}
                >
                  <option value="have">I Have This</option>
                  <option value="buy">Need to Buy</option>
                  <option value="clothing">Clothing Items</option>
                  <option value="india">India Items</option>
                </select>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Item'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
