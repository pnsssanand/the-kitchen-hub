import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";

export function useWaterTracker() {
  const { user } = useAuth();
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2.5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, `users/${user.uid}/water/current`);

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.date === today) {
          setWater(data.amount || 0);
          setWaterGoal(data.goal || 2.5);
        } else {
          // Reset for new day
          setWater(0);
          setWaterGoal(data.goal || 2.5);
          // Async update firebase
          setDoc(docRef, { amount: 0, goal: data.goal || 2.5, date: today }, { merge: true });
        }
      } else {
        // Initialize
        setDoc(docRef, { amount: 0, goal: 2.5, date: today });
        setWater(0);
        setWaterGoal(2.5);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addWater = async (amount: number) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, `users/${user.uid}/water/current`);
    await setDoc(docRef, { amount: water + amount, date: today, goal: waterGoal }, { merge: true });
  };

  const updateGoal = async (goal: number) => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, `users/${user.uid}/water/current`);
    await setDoc(docRef, { goal, date: today, amount: water }, { merge: true });
  };

  const resetWater = async () => {
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const docRef = doc(db, `users/${user.uid}/water/current`);
    await setDoc(docRef, { amount: 0, date: today, goal: waterGoal }, { merge: true });
  };

  return { water, waterGoal, addWater, updateGoal, resetWater, loading };
}
