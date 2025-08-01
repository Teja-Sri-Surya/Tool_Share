'use client';

import { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, AtSign, Calendar, Shield, Star, Trophy, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditProfileDialog } from "@/components/dashboard/edit-profile-dialog";

interface UserStats {
  toolsListed: number;
  activeRentals: number;
  completedRentals: number;
  averageRating: number;
  totalReviews: number;
  points: number;
  level: string;
  badges: string[];
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    toolsListed: 0,
    activeRentals: 0,
    completedRentals: 0,
    averageRating: 0,
    totalReviews: 0,
    points: 0,
    level: 'Beginner',
    badges: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Calculate points based on various factors
  const calculatePoints = (stats: any): number => {
    let points = 0;
    
    // Points for tools listed (10 points per tool)
    points += stats.toolsListed * 10;
    
    // Points for completed rentals (5 points per rental)
    points += stats.completedRentals * 5;
    
    // Points for average rating (20 points per star)
    points += Math.floor(stats.averageRating * 20);
    
    // Points for total reviews (2 points per review)
    points += stats.totalReviews * 2;
    
    // Bonus points for high activity
    if (stats.completedRentals >= 10) points += 50; // 10+ rentals bonus
    if (stats.toolsListed >= 5) points += 30; // 5+ tools bonus
    if (stats.averageRating >= 4.5) points += 100; // High rating bonus
    
    return points;
  };

  // Determine user level based on points
  const calculateLevel = (points: number): string => {
    if (points >= 500) return 'Master';
    if (points >= 300) return 'Expert';
    if (points >= 150) return 'Advanced';
    if (points >= 50) return 'Intermediate';
    return 'Beginner';
  };

  // Get badges based on achievements
  const getBadges = (stats: any): string[] => {
    const badges = [];
    
    if (stats.toolsListed >= 1) badges.push('Tool Lister');
    if (stats.toolsListed >= 5) badges.push('Tool Collector');
    if (stats.completedRentals >= 1) badges.push('First Rental');
    if (stats.completedRentals >= 10) badges.push('Rental Pro');
    if (stats.averageRating >= 4.0) badges.push('Highly Rated');
    if (stats.averageRating >= 4.8) badges.push('Perfect Score');
    if (stats.totalReviews >= 5) badges.push('Well Reviewed');
    if (stats.totalReviews >= 20) badges.push('Community Favorite');
    
    return badges;
  };

  // Fetch user statistics
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch all tools and filter for current user
        const toolsResponse = await fetch('http://localhost:8000/api/tools/');
        const allTools = toolsResponse.ok ? await toolsResponse.json() : [];
        const tools = allTools.filter((tool: any) => tool.owner?.id === user.id);
        
        // Fetch rental transactions
        const rentalsResponse = await fetch('http://localhost:8000/api/rentaltransactions/');
        const allRentals = rentalsResponse.ok ? await rentalsResponse.json() : [];
        
        // Filter rentals for current user
        const userRentals = allRentals.filter((rental: any) => 
          rental.owner.id === user.id || rental.borrower.id === user.id
        );
        
        const activeRentals = userRentals.filter((rental: any) => rental.status === 'active');
        const completedRentals = userRentals.filter((rental: any) => rental.status === 'completed');
        
        // Fetch reviews/feedback for user's tools
        const feedbackResponse = await fetch('http://localhost:8000/api/feedbacks/');
        const allFeedbacks = feedbackResponse.ok ? await feedbackResponse.json() : [];
        
        // Get feedback for tools owned by user
        const userToolIds = tools.map((tool: any) => tool.id);
        const userFeedbacks = allFeedbacks.filter((feedback: any) => 
          userToolIds.includes(feedback.tool)
        );
        
        // Calculate average rating
        const totalRating = userFeedbacks.reduce((sum: number, feedback: any) => sum + feedback.rating, 0);
        const averageRating = userFeedbacks.length > 0 ? totalRating / userFeedbacks.length : 0;
        
        const stats = {
          toolsListed: tools.length,
          activeRentals: activeRentals.length,
          completedRentals: completedRentals.length,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalReviews: userFeedbacks.length
        };
        
        const points = calculatePoints(stats);
        const level = calculateLevel(points);
        const badges = getBadges(stats);
        
        setUserStats({
          ...stats,
          points,
          level,
          badges
        });
        
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" /> <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" /> <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" /> <Skeleton className="h-4 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Profile</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Your Profile</h1>
        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
          Edit Profile
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Profile picture" />
                <AvatarFallback className="text-3xl">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl">{user.fullName}</CardTitle>
                <CardDescription className="text-lg">@{user.username}</CardDescription>
                <Badge variant="secondary" className="mt-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified User
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-5 w-5 text-primary" />
              <span className="text-foreground">{user.fullName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <AtSign className="h-5 w-5 text-primary" />
              <span className="text-foreground">@{user.username}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-foreground">Member since {new Date().toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>Your activity on EquiShare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : userStats.toolsListed}
                </div>
                <div className="text-sm text-muted-foreground">Tools Listed</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : userStats.activeRentals}
                </div>
                <div className="text-sm text-muted-foreground">Active Rentals</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {statsLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : userStats.completedRentals}
                </div>
                <div className="text-sm text-muted-foreground">Completed Rentals</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12 mx-auto" />
                  ) : (
                    <>
                      {userStats.averageRating}
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">Rating ({userStats.totalReviews} reviews)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points & Level System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Points & Achievements
          </CardTitle>
          <CardDescription>Your progress and achievements on the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Points Display */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{userStats.points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {userStats.level}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Level</div>
            </div>
          </div>

          {/* Badges */}
          {userStats.badges.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Badges Earned
              </h4>
              <div className="flex flex-wrap gap-2">
                {userStats.badges.map((badge, index) => (
                  <Badge key={index} variant="outline" className="px-3 py-1">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Points Breakdown */}
          <div>
            <h4 className="font-semibold mb-3">Points Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tools Listed ({userStats.toolsListed} × 10)</span>
                <span className="font-medium">{userStats.toolsListed * 10} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Rentals ({userStats.completedRentals} × 5)</span>
                <span className="font-medium">{userStats.completedRentals * 5} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Average Rating ({userStats.averageRating} × 20)</span>
                <span className="font-medium">{Math.floor(userStats.averageRating * 20)} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Total Reviews ({userStats.totalReviews} × 2)</span>
                <span className="font-medium">{userStats.totalReviews * 2} pts</span>
              </div>
              {userStats.completedRentals >= 10 && (
                <div className="flex justify-between text-green-600">
                  <span>10+ Rentals Bonus</span>
                  <span className="font-medium">+50 pts</span>
                </div>
              )}
              {userStats.toolsListed >= 5 && (
                <div className="flex justify-between text-green-600">
                  <span>5+ Tools Bonus</span>
                  <span className="font-medium">+30 pts</span>
                </div>
              )}
              {userStats.averageRating >= 4.5 && (
                <div className="flex justify-between text-green-600">
                  <span>High Rating Bonus</span>
                  <span className="font-medium">+100 pts</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start by listing a tool or renting equipment!</p>
          </div>
        </CardContent>
      </Card>

      <EditProfileDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
} 
