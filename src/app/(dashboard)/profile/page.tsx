"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Mail, Camera, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: user?.email || "",
    photoUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data().profile;
          setProfileData(prev => ({
            ...prev,
            fullName: data.fullName || "",
            photoUrl: data.photoUrl || "",
          }));
        }
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        "profile.fullName": profileData.fullName,
        "profile.photoUrl": profileData.photoUrl,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Thekitchenhub"); // Cloudinary preset
    formData.append("cloud_name", "dlvjvskje");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dlvjvskje/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setProfileData(prev => ({ ...prev, photoUrl: data.secure_url }));
        toast.success("Image uploaded successfully! Remember to save.");
      } else {
        throw new Error("Failed to upload");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-6">Your Profile</h2>

      <Card>
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full bg-muted border-4 border-background shadow-soft overflow-hidden">
              {profileData.photoUrl ? (
                <img src={profileData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <User size={48} />
                </div>
              )}
              
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            {isUploading && <p className="text-sm text-primary animate-pulse">Uploading...</p>}
            <p className="text-xs text-muted-foreground text-center">Click image to update<br/>(Max 2MB)</p>
          </div>

          <div className="flex-1 space-y-4 w-full">
            <Input 
              label="Full Name" 
              value={profileData.fullName}
              onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
              icon={<User size={18} />}
            />
            <Input 
              label="Email Address" 
              value={profileData.email}
              disabled
              icon={<Mail size={18} />}
            />
            
            <div className="pt-4 flex gap-4">
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
              <Button variant="danger" onClick={signOut}>
                <LogOut size={18} className="mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="mt-12 pt-8 border-t border-border text-center">
        <p className="text-muted-foreground font-semibold">TheKitchenHub</p>
        <p className="text-sm text-muted-foreground mt-1">Cook better. Plan smarter. Live healthier.</p>
        <p className="text-xs text-muted-foreground/60 mt-4">Developed by Anand Pinisetty &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
