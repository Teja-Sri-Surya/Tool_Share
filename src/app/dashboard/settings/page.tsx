"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Shield, Globe, User, Palette } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    rentalUpdates: true,
    newRequests: true,
    depositUpdates: true
  });
  
  const [privacy, setPrivacy] = useState({
    profileVisibility: "public",
    showLocation: true,
    showContactInfo: false
  });
  
  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "en"
  });

  const handleSaveSettings = async (section: string) => {
    try {
      // In a real app, you would save these to the backend
      console.log(`Saving ${section} settings:`, { notifications, privacy, appearance });
      
      toast({
        title: "Settings Saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications about your rentals and requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, email: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications in the browser
                </p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => 
                  setNotifications(prev => ({ ...prev, push: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Notification Types</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Rental Updates</Label>
                  <Switch
                    checked={notifications.rentalUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, rentalUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">New Borrow Requests</Label>
                  <Switch
                    checked={notifications.newRequests}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, newRequests: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Deposit Updates</Label>
                  <Switch
                    checked={notifications.depositUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, depositUpdates: checked }))
                    }
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={() => handleSaveSettings("notifications")}>
              Save Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control your privacy settings and data visibility.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Visibility</Label>
              <Select
                value={privacy.profileVisibility}
                onValueChange={(value) => 
                  setPrivacy(prev => ({ ...prev, profileVisibility: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Location</Label>
                <p className="text-sm text-muted-foreground">
                  Display your location to other users
                </p>
              </div>
              <Switch
                checked={privacy.showLocation}
                onCheckedChange={(checked) => 
                  setPrivacy(prev => ({ ...prev, showLocation: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Contact Information</Label>
                <p className="text-sm text-muted-foreground">
                  Display your contact details to other users
                </p>
              </div>
              <Switch
                checked={privacy.showContactInfo}
                onCheckedChange={(checked) => 
                  setPrivacy(prev => ({ ...prev, showContactInfo: checked }))
                }
              />
            </div>
            
            <Button onClick={() => handleSaveSettings("privacy")}>
              Save Privacy Settings
            </Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={appearance.theme}
                onValueChange={(value) => 
                  setAppearance(prev => ({ ...prev, theme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={appearance.language}
                onValueChange={(value) => 
                  setAppearance(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={() => handleSaveSettings("appearance")}>
              Save Appearance Settings
            </Button>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and membership status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Username</Label>
                <p className="text-sm text-muted-foreground">{user?.username || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">July 2024</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Account Status</Label>
                <Badge variant="default" className="mt-1">Active</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/dashboard/profile">Edit Profile</a>
              </Button>
              <Button variant="outline">Change Password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
