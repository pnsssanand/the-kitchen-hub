"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Bell, BellOff, Droplet, Plus, Edit2, Trash, X, Settings2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { useWaterTracker } from "@/hooks/useWaterTracker";

interface DietItem {
  id: string;
  time: string;
  name: string;
  hasNotification: boolean;
}

export default function DietPage() {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Water Tracker Hook
  const { water, waterGoal, addWater, updateGoal, resetWater, loading: waterLoading } = useWaterTracker();
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState(2.5);

  const [dietSchedule, setDietSchedule] = useState<DietItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<DietItem, "id">>({ time: "", name: "", hasNotification: true });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, `users/${user.uid}/diet`));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DietItem[];
      fetched.sort((a, b) => a.time.localeCompare(b.time));
      setDietSchedule(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenModal = (item?: DietItem) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ time: item.time, name: item.name, hasNotification: item.hasNotification });
    } else {
      setEditingId(null);
      setFormData({ time: "", name: "", hasNotification: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.name || !formData.time) {
      toast.error("Time and name are required");
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, `users/${user.uid}/diet`, editingId), formData);
        toast.success("Diet item updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/diet`), formData);
        toast.success("Diet item added");
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to save diet item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/diet`, id));
        toast.success("Diet item deleted");
      } catch (error) {
        toast.error("Failed to delete diet item");
      }
    }
  };

  const toggleNotification = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/diet`, id), { hasNotification: !currentStatus });
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const handleAddWater = async (amountLiters: number) => {
    await addWater(amountLiters);
    toast.success(`Added ${amountLiters * 1000}ml of water`);
  };

  const handleSaveWaterGoal = async () => {
    if (tempWaterGoal <= 0) {
      toast.error("Goal must be greater than 0");
      return;
    }
    await updateGoal(tempWaterGoal);
    setIsWaterModalOpen(false);
    toast.success("Water goal updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gym & Diet Routine</h2>
        
        <div className="flex items-center gap-4">
          <Button 
            variant={notificationsEnabled ? "outline" : "secondary"} 
            className={notificationsEnabled ? "border-primary text-primary hover:bg-primary/5" : ""}
            onClick={() => {
              setNotificationsEnabled(!notificationsEnabled);
              toast.success(notificationsEnabled ? "Global notifications disabled" : "Global notifications enabled");
            }}
          >
            {notificationsEnabled ? <Bell size={18} className="mr-2" /> : <BellOff size={18} className="mr-2" />}
            {notificationsEnabled ? "Notifications ON" : "Notifications OFF"}
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={18} className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diet Schedule */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <h3 className="font-semibold text-xl mb-6">Today's Schedule</h3>
            
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-3">
                {dietSchedule.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-border transition-all-smooth group">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-primary w-20 shrink-0">{item.time}</span>
                      <span className="font-medium text-lg">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 justify-end">
                      <button 
                        onClick={() => toggleNotification(item.id, item.hasNotification)}
                        className={`p-2 rounded-lg ${item.hasNotification ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground hover:bg-muted'} transition-colors`}
                      >
                        {item.hasNotification ? <Bell size={18} /> : <BellOff size={18} />}
                      </button>
                      <button onClick={() => handleOpenModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100">
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {dietSchedule.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Your diet schedule is empty.</p>
                    <Button className="mt-4" onClick={() => handleOpenModal()}>Add Schedule Item</Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Water Tracker */}
        <div className="space-y-6">
          <Card className="bg-blue-50/50 border-blue-100 text-center py-8 relative">
            <button 
              onClick={() => { setTempWaterGoal(waterGoal); setIsWaterModalOpen(true); }}
              className="absolute top-4 right-4 text-blue-500 hover:bg-blue-100 p-2 rounded-lg transition-colors"
            >
              <Settings2 size={18} />
            </button>
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Droplet size={32} />
            </div>
            <h3 className="font-semibold text-xl text-blue-900 mb-1">Water Tracker</h3>
            
            {waterLoading ? (
              <div className="h-20 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              <>
                <p className="text-blue-700 font-medium mb-6">{water.toFixed(2)} L / {waterGoal.toFixed(1)} L</p>
                
                <div className="w-full h-4 bg-blue-100 rounded-full overflow-hidden mb-8">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((water / waterGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => handleAddWater(0.1)}>+100ml</Button>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => handleAddWater(0.25)}>+250ml</Button>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => handleAddWater(0.5)}>+500ml</Button>
                </div>
                
                <Button 
                   variant="ghost" 
                   className="mt-4 text-blue-500 text-sm hover:bg-blue-100"
                   onClick={async () => { await resetWater(); toast.success("Water tracker reset"); }}
                >
                  Reset for today
                </Button>
              </>
            )}
          </Card>
        </div>
      </div>

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
                label="Food/Drink Name" 
                placeholder="E.g. Banana" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <Input 
                label="Time" 
                placeholder="E.g. 07:30 AM" 
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
              
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  checked={formData.hasNotification}
                  onChange={(e) => setFormData({...formData, hasNotification: e.target.checked})}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Enable reminder notification</span>
              </label>
              
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Item'}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Water Goal Modal */}
      {isWaterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Water Goal</h3>
              <button onClick={() => setIsWaterModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input 
                label="Daily Goal (Liters)" 
                type="number"
                step="0.1"
                min="0.1"
                value={tempWaterGoal} 
                onChange={e => setTempWaterGoal(parseFloat(e.target.value))} 
              />
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsWaterModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveWaterGoal}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
