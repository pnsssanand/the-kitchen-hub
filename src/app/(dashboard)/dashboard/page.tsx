"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, doc, getDoc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { 
  Plus, Coffee, Sun, Moon, CheckCircle2, Circle, Droplet, Edit2, Trash, X, Settings2, Loader2, BookOpen
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { useWaterTracker } from "@/hooks/useWaterTracker";

interface MenuItem {
  id: string;
  time: string;
  name: string;
  desc: string;
  type: "Morning" | "Afternoon" | "Dinner" | "Snack";
  completed: boolean;
  date: string;
}

interface BuyItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  status: "have" | "buy";
}

interface Recipe {
  id: string;
  name: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState("Chef");
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [buyItems, setBuyItems] = useState<BuyItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [loadingBuy, setLoadingBuy] = useState(true);

  // Water Tracker
  const { water, waterGoal, addWater, updateGoal, loading: waterLoading } = useWaterTracker();
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [tempWaterGoal, setTempWaterGoal] = useState(2.5);

  // Modals state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuFormData, setMenuFormData] = useState<Omit<MenuItem, "id" | "completed" | "date">>({ type: "Morning", time: "", name: "", desc: "" });

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [editingBuyId, setEditingBuyId] = useState<string | null>(null);
  const [buyFormData, setBuyFormData] = useState<Omit<BuyItem, "id" | "status">>({ name: "", category: "Pantry", quantity: "1" });

  useEffect(() => {
    if (!user) return;
    
    // Fetch Profile
    const fetchProfile = async () => {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserName(docSnap.data().profile?.fullName?.split(" ")[0] || "Chef");
      }
    };
    fetchProfile();

    // Fetch Today's Menu
    const today = format(new Date(), "yyyy-MM-dd");
    const qMenu = query(collection(db, `users/${user.uid}/schedule`));
    const unsubMenu = onSnapshot(qMenu, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MenuItem[];
      const todays = fetched.filter(m => m.date === today).sort((a, b) => {
        const order = { "Morning": 1, "Afternoon": 2, "Snack": 3, "Dinner": 4 };
        return (order[a.type] || 5) - (order[b.type] || 5);
      });
      setMenuItems(todays);
      setLoadingMenu(false);
    });

    // Fetch Buy Items
    const qBuy = query(collection(db, `users/${user.uid}/kitchen`));
    const unsubBuy = onSnapshot(qBuy, (snapshot) => {
      const fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BuyItem[];
      setBuyItems(fetched.filter(i => i.status === "buy"));
      setLoadingBuy(false);
    });

    // Fetch Recipes for cross-referencing
    const qRecipes = query(collection(db, `users/${user.uid}/recipes`));
    const unsubRecipes = onSnapshot(qRecipes, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Recipe[];
      setRecipes(fetched);
    });

    return () => { unsubMenu(); unsubBuy(); unsubRecipes(); };
  }, [user]);

  // Menu Handlers
  const handleOpenMenuModal = (item?: MenuItem) => {
    if (item) {
      setEditingMenuId(item.id);
      setMenuFormData({ type: item.type, time: item.time, name: item.name, desc: item.desc });
    } else {
      setEditingMenuId(null);
      setMenuFormData({ type: "Morning", time: "", name: "", desc: "" });
    }
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async () => {
    if (!user) return;
    if (!menuFormData.name) {
      toast.error("Name is required");
      return;
    }
    try {
      if (editingMenuId) {
        await updateDoc(doc(db, `users/${user.uid}/schedule`, editingMenuId), menuFormData);
        toast.success("Menu updated");
      } else {
        await addDoc(collection(db, `users/${user.uid}/schedule`), {
          ...menuFormData,
          completed: false,
          date: format(new Date(), "yyyy-MM-dd")
        });
        toast.success("Menu added");
      }
      setIsMenuModalOpen(false);
    } catch (error) {
      toast.error("Failed to save menu");
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!user) return;
    if (confirm("Delete this menu item?")) {
      await deleteDoc(doc(db, `users/${user.uid}/schedule`, id));
      toast.success("Deleted");
    }
  };

  const toggleMenuComplete = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, `users/${user.uid}/schedule`, id), { completed: !currentStatus });
  };

  // Buy Item Handlers
  const handleOpenBuyModal = (item?: BuyItem) => {
    if (item) {
      setEditingBuyId(item.id);
      setBuyFormData({ name: item.name, category: item.category, quantity: item.quantity });
    } else {
      setEditingBuyId(null);
      setBuyFormData({ name: "", category: "Pantry", quantity: "1" });
    }
    setIsBuyModalOpen(true);
  };

  const handleSaveBuy = async () => {
    if (!user) return;
    if (!buyFormData.name) {
      toast.error("Item name required");
      return;
    }
    try {
      if (editingBuyId) {
        await updateDoc(doc(db, `users/${user.uid}/kitchen`, editingBuyId), buyFormData);
      } else {
        await addDoc(collection(db, `users/${user.uid}/kitchen`), {
          ...buyFormData,
          status: "buy"
        });
      }
      setIsBuyModalOpen(false);
      toast.success("Item saved");
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleDeleteBuy = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/kitchen`, id));
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

  const getIconForType = (type: string) => {
    if (type === "Morning") return <Coffee size={24} className="text-orange-600" />;
    if (type === "Afternoon") return <Sun size={24} className="text-yellow-600" />;
    return <Moon size={24} className="text-indigo-600" />;
  };

  const getBgForType = (type: string) => {
    if (type === "Morning") return "bg-orange-100";
    if (type === "Afternoon") return "bg-yellow-100";
    return "bg-indigo-100";
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary/10 p-6 rounded-3xl border border-primary/20">
        <div>
          <h2 className="text-2xl font-bold text-primary">Good Morning, {userName}! 🍳</h2>
          <p className="text-primary-hover mt-1">"Cooking is like love. It should be entered into with abandon or not at all."</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Today's Menu</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleOpenMenuModal()}>Add</Button>
                <Link href="/schedule" className="inline-flex items-center justify-center font-medium transition-all-smooth rounded-2xl h-9 px-4 text-sm bg-secondary text-secondary-foreground hover:bg-[#E3DCB] shadow-sm">
                  View Schedule
                </Link>
              </div>
            </div>
            
            {loadingMenu ? (
              <div className="flex-1 flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-4 flex-1">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-muted/50 border border-border transition-all-smooth hover:border-primary/50 group">
                    <div className={`${getBgForType(item.type)} p-3 rounded-xl h-fit`}>
                      {getIconForType(item.type)}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => toggleMenuComplete(item.id, item.completed)}>
                      <p className="text-sm text-muted-foreground font-medium mb-1">{item.type} • {item.time}</p>
                      <h4 className={`font-semibold text-lg ${item.completed ? 'line-through text-muted-foreground' : ''}`}>{item.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.desc}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 justify-center sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleMenuComplete(item.id, item.completed)} className={`${item.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'} transition-transform`}>
                        {item.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      <div className="flex gap-1 shrink-0">
                        {recipes.find(r => r.name.toLowerCase().trim() === item.name.toLowerCase().trim()) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const recipeId = recipes.find(r => r.name.toLowerCase().trim() === item.name.toLowerCase().trim())?.id;
                              if (recipeId) {
                                sessionStorage.setItem('viewRecipe', recipeId);
                                router.push('/recipes');
                              }
                            }} 
                            className="p-1 text-purple-500 hover:bg-purple-50 rounded-md"
                            title="View Recipe"
                          >
                            <BookOpen size={16} />
                          </button>
                        )}
                        <button onClick={() => handleOpenMenuModal(item)} className="p-1 text-blue-500 hover:bg-blue-50 rounded-md">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteMenu(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded-md">
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {menuItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No menu items for today.</div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4 text-lg">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Add Meal", href: "/schedule", icon: Plus },
                { label: "Add Recipe", href: "/recipes", icon: Plus },
                { label: "Add Essential", href: "/kitchen", icon: Plus },
                { label: "Add Diet Item", href: "/diet", icon: Plus },
              ].map((action, i) => (
                <Button key={i} variant="secondary" className="w-full justify-start text-sm h-12" size="sm" onClick={() => router.push(action.href)}>
                  <action.icon size={16} className="mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="bg-blue-50/50 border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold flex items-center gap-2 text-blue-900">
                <Droplet size={18} className="text-blue-500" /> Water Goal
              </h3>
              <div className="flex items-center gap-2">
                {!waterLoading && (
                  <span className="text-sm font-medium text-blue-700">{water.toFixed(2)} / {waterGoal.toFixed(1)} L</span>
                )}
                <button 
                  onClick={() => { setTempWaterGoal(waterGoal); setIsWaterModalOpen(true); }}
                  className="text-blue-500 hover:bg-blue-100 p-1 rounded-md transition-colors"
                >
                  <Settings2 size={16} />
                </button>
              </div>
            </div>
            
            {waterLoading ? (
               <div className="h-16 flex justify-center items-center"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              <>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((water / waterGoal) * 100, 100)}%` }}></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => addWater(0.1)}>+100ml</Button>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => addWater(0.25)}>+250ml</Button>
                  <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-100 px-1 text-xs" onClick={() => addWater(0.5)}>+500ml</Button>
                </div>
              </>
            )}
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Need to Buy</h3>
              <div className="flex gap-2">
                <button onClick={() => handleOpenBuyModal()} className="text-primary hover:bg-primary/10 p-1 rounded-md"><Plus size={18} /></button>
                <Link href="/kitchen" className="text-sm text-primary hover:underline self-center">All</Link>
              </div>
            </div>
            {loadingBuy ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <ul className="space-y-3">
                {buyItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm group">
                    <span className="flex items-center gap-2">
                      <Circle size={14} className="text-muted-foreground" />
                      {item.name}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button onClick={() => handleOpenBuyModal(item)} className="text-blue-500 hover:text-blue-600 p-1"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteBuy(item.id)} className="text-red-500 hover:text-red-600 p-1"><Trash size={14} /></button>
                    </div>
                  </li>
                ))}
                {buyItems.length === 0 && (
                  <li className="text-sm text-muted-foreground text-center">Nothing to buy!</li>
                )}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Menu Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingMenuId ? 'Edit Menu' : 'Add Menu'}</h3>
              <button onClick={() => setIsMenuModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Name" value={menuFormData.name} onChange={e => setMenuFormData({...menuFormData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Type</label>
                  <select className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" value={menuFormData.type} onChange={e => setMenuFormData({...menuFormData, type: e.target.value as any})}>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Snack</option>
                    <option>Dinner</option>
                  </select>
                </div>
                <Input label="Time" placeholder="08:00 AM" value={menuFormData.time} onChange={e => setMenuFormData({...menuFormData, time: e.target.value})} />
              </div>
              <Input label="Description" value={menuFormData.desc} onChange={e => setMenuFormData({...menuFormData, desc: e.target.value})} />
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsMenuModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveMenu}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Buy Item Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">{editingBuyId ? 'Edit Item' : 'Add Item'}</h3>
              <button onClick={() => setIsBuyModalOpen(false)} className="text-muted-foreground hover:bg-muted p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Item Name" value={buyFormData.name} onChange={e => setBuyFormData({...buyFormData, name: e.target.value})} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select 
                  className="flex h-12 w-full rounded-2xl border border-border bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={buyFormData.category}
                  onChange={(e) => setBuyFormData({...buyFormData, category: e.target.value})}
                >
                  <option>Produce</option>
                  <option>Meat</option>
                  <option>Dairy</option>
                  <option>Pantry</option>
                  <option>Spices</option>
                  <option>Other</option>
                </select>
              </div>
              <Input label="Quantity" value={buyFormData.quantity} onChange={e => setBuyFormData({...buyFormData, quantity: e.target.value})} />
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsBuyModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveBuy}>Save</Button>
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
