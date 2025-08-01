"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, ChevronDown } from 'lucide-react';
import { AddToolDialog } from '@/components/dashboard/add-tool-dialog';
import { UpdateToolDialog } from '@/components/dashboard/update-tool-dialog';
import { useAuth } from '@/hooks/use-auth';
import type { Tool } from '@/lib/data';

interface RentalTransaction {
    id: number;
    tool: {
        id: number;
        name: string;
        description: string;
        price_per_day: string;
        image: string;
        available: boolean;
        owner: {
            id: number;
            username: string;
        };
    };
    owner: {
        id: number;
        username: string;
    };
    borrower: {
        id: number;
        username: string;
    };
    start_date: string;
    end_date: string;
    total_price: string;
    payment_status: string;
    status: string;
    created_at: string;
}

function RentalRow({ rental, currentUserId, onMarkReturned }: { 
    rental: RentalTransaction; 
    currentUserId: number;
    onMarkReturned: (rentalId: number) => void;
}) {
    const isOwner = rental.owner.id === currentUserId;
    const isBorrower = rental.borrower.id === currentUserId;
    
    const userRole = isOwner ? 'Owner' : isBorrower ? 'Borrower' : 'Unknown';
    const otherParty = isOwner ? rental.borrower.username : rental.owner.username;
    
    return (
        <TableRow>
            <TableCell className="font-medium">{rental.tool.name}</TableCell>
            <TableCell>
                <Badge variant={isOwner ? 'default' : 'secondary'}>
                    {userRole}
                </Badge>
            </TableCell>
            <TableCell>{otherParty}</TableCell>
            <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
            <TableCell>
                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}
                 style={rental.status === 'active' ? { backgroundColor: 'hsl(var(--primary))' } : {}}
                >
                    {rental.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                {rental.status === 'active' && isOwner && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onMarkReturned(rental.id)}
                    >
                        Mark as Returned
                    </Button>
                )}
            </TableCell>
        </TableRow>
    )
}

export default function RentalsPage() {
    const { user, loading: authLoading } = useAuth();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [tools, setTools] = useState<Tool[]>([]);
    const [rentalTransactions, setRentalTransactions] = useState<RentalTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    
    // State for "Show More" functionality
    const [showAllActiveRentals, setShowAllActiveRentals] = useState(false);
    const [showAllTools, setShowAllTools] = useState(false);
    const [showAllRentalHistory, setShowAllRentalHistory] = useState(false);

    // Fetch tools and rental transactions from Django backend
    useEffect(() => {
        if (!user?.id || authLoading) return; // Don't fetch if user is not loaded or auth is loading
        
        const fetchData = async () => {
            try {
                console.log('Fetching data for user:', user.id);
                
                // Fetch all tools and filter for current user
                const toolsResponse = await fetch('http://localhost:8000/api/tools/');
                console.log('Tools response status:', toolsResponse.status);
                
                if (toolsResponse.ok) {
                    const allTools = await toolsResponse.json();
                    console.log('All tools fetched:', allTools.length);
                    
                    // Filter tools owned by current user
                    const userTools = allTools.filter((tool: any) => tool.owner?.id === user.id);
                    console.log('User tools filtered:', userTools.length);
                    
                    if (Array.isArray(userTools)) {
                        const transformedTools = userTools.map((tool: any) => ({
                            id: tool.id.toString(),
                            name: tool.name,
                            category: tool.category?.name || 'Uncategorized',
                            description: tool.description,
                            imageUrl: tool.image || 'https://placehold.co/300x300.png',
                            pricing_type: tool.pricing_type || 'daily',
                            price_per_hour: tool.price_per_hour ? parseFloat(tool.price_per_hour) : undefined,
                            dailyRate: parseFloat(tool.price_per_day),
                            price_per_week: tool.price_per_week ? parseFloat(tool.price_per_week) : undefined,
                            price_per_month: tool.price_per_month ? parseFloat(tool.price_per_month) : undefined,
                            isAvailable: tool.available,
                            owner: tool.owner?.username || 'Unknown',
                            owner_id: tool.owner?.id || 1,
                            replacement_value: tool.replacement_value ? parseFloat(tool.replacement_value) : undefined,
                            aiHint: tool.name.toLowerCase()
                        }));
                        setTools(transformedTools);
                        console.log('Tools transformed and set:', transformedTools.length);
                    } else {
                        console.log('User tools is not an array:', userTools);
                        setTools([]);
                    }
                } else {
                    console.error('Tools response not ok:', toolsResponse.status, toolsResponse.statusText);
                    setTools([]);
                }

                // Fetch rental transactions
                const rentalsResponse = await fetch('http://localhost:8000/api/rentaltransactions/');
                console.log('Rentals response status:', rentalsResponse.status);
                
                if (rentalsResponse.ok) {
                    const transactions = await rentalsResponse.json();
                    console.log('Rentals fetched:', transactions.length);
                    setRentalTransactions(transactions);
                } else {
                    console.error('Rentals response not ok:', rentalsResponse.status, rentalsResponse.statusText);
                    setRentalTransactions([]);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setTools([]);
                setRentalTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id]); // Only depend on user ID, not authLoading

    // Filter rentals based on current user
    const userRentals = rentalTransactions.filter(rental => {
        if (!user || authLoading) return false;
        // Show rentals where the user is either the owner or the borrower
        return rental.owner.id === user.id || rental.borrower.id === user.id;
    });

    const activeRentals = userRentals.filter(r => r.status === 'active');
    
    // Limit displayed items to 5 unless "Show More" is clicked
    const displayedActiveRentals = showAllActiveRentals ? activeRentals : activeRentals.slice(0, 5);
    const displayedTools = showAllTools ? tools : tools.slice(0, 5);
    const displayedRentalHistory = showAllRentalHistory ? rentalTransactions : rentalTransactions.slice(0, 5);

    const handleAddTool = async (toolData: Omit<Tool, 'id' | 'isAvailable' | 'owner' | 'aiHint'>) => {
        try {
            // Check if user is authenticated
            if (!user || !user.id) {
                console.error('User not authenticated');
                throw new Error('User not authenticated. Please log in again.');
            }

            console.log('Creating tool with user ID:', user.id);
            console.log('Tool data:', toolData);

            // Send tool data to the Django backend API with current user as owner
            const response = await fetch('http://localhost:8000/api/tools/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: toolData.name,
                    description: toolData.description,
                    pricing_type: toolData.pricing_type,
                    price_per_hour: toolData.price_per_hour,
                    price_per_day: toolData.dailyRate,
                    price_per_week: toolData.price_per_week,
                    price_per_month: toolData.price_per_month,
                    replacement_value: toolData.replacement_value,
                    available: true,
                    owner: user.id, // Include current user as owner
                }),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    errorData = { message: errorText };
                }
                throw new Error(`Failed to create tool: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            console.log('Tool created successfully:', result);
            
            // Refresh the tools list from the API (user-specific)
            const toolsResponse = await fetch('http://localhost:8000/api/tools/');
            if (toolsResponse.ok) {
                const allTools = await toolsResponse.json();
                // Filter tools owned by current user
                const userTools = allTools.filter((tool: any) => tool.owner?.id === user?.id);
                
                if (Array.isArray(userTools)) {
                    const transformedTools = userTools.map((tool: any) => ({
                        id: tool.id.toString(),
                        name: tool.name,
                        // category removed
                        description: tool.description,
                        imageUrl: tool.image || 'https://placehold.co/300x300.png',
                        pricing_type: tool.pricing_type || 'daily',
                        price_per_hour: tool.price_per_hour ? parseFloat(tool.price_per_hour) : undefined,
                        dailyRate: parseFloat(tool.price_per_day),
                        price_per_week: tool.price_per_week ? parseFloat(tool.price_per_week) : undefined,
                        price_per_month: tool.price_per_month ? parseFloat(tool.price_per_month) : undefined,
                        isAvailable: tool.available,
                        owner: tool.owner?.username || 'Unknown',
                        owner_id: tool.owner?.id || 1,
                        replacement_value: tool.replacement_value ? parseFloat(tool.replacement_value) : undefined,
                        aiHint: tool.name.toLowerCase()
                    }));
                    setTools(transformedTools);
                }
            }
            
            // Close the dialog
            setIsDialogOpen(false);
            
        } catch (error) {
            console.error('Error creating tool:', error);
            // You can add error handling here, like showing a toast notification
        }
    };

    const handleUpdateClick = (tool: Tool) => {
        setSelectedTool(tool);
        setUpdateDialogOpen(true);
    };

    const handleUpdateTool = (updatedTool: Tool) => {
        setTools(prevTools => 
            prevTools.map(tool => 
                tool.id === updatedTool.id ? updatedTool : tool
            )
        );
    };

    const handleDeleteTool = async (toolId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/tools/${toolId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Remove the tool from the local state
                setTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
                console.log('Tool deleted successfully');
            } else {
                console.error('Failed to delete tool');
            }
        } catch (error) {
            console.error('Error deleting tool:', error);
        }
    };

    const handleMarkReturned = async (rentalId: number) => {
        try {
            console.log(`Marking rental ${rentalId} as returned...`);
            
            // First, get the rental details to find the tool ID
            const rentalResponse = await fetch(`http://localhost:8000/api/rentaltransactions/${rentalId}/`);
            if (!rentalResponse.ok) {
                const errorText = await rentalResponse.text();
                console.error('Failed to get rental details:', errorText);
                throw new Error(`Failed to get rental details: ${rentalResponse.status} ${rentalResponse.statusText}`);
            }
            
            const rentalData = await rentalResponse.json();
            console.log('Rental data:', rentalData);
            const toolId = rentalData.tool?.id || rentalData.tool;
            
            if (!toolId) {
                throw new Error('Tool ID not found in rental data');
            }

            // Update rental status to completed
            const response = await fetch(`http://localhost:8000/api/rentaltransactions/${rentalId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'completed'
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to update rental status:', errorText);
                throw new Error(`Failed to update rental status: ${response.status} ${response.statusText}`);
            }

            const updatedRental = await response.json();
            console.log('Rental updated successfully:', updatedRental);

            // Update the rental status in local state
            setRentalTransactions(prevRentals => 
                prevRentals.map(rental => 
                    rental.id === rentalId 
                        ? { ...rental, status: 'completed' }
                        : rental
                )
            );

            // Update tool availability back to "Available"
            const toolUpdateResponse = await fetch(`http://localhost:8000/api/tools/${toolId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    available: true
                }),
            });

            if (!toolUpdateResponse.ok) {
                const errorText = await toolUpdateResponse.text();
                console.error('Failed to update tool availability:', errorText);
                // Don't throw error here, just log it
            } else {
                console.log('Tool availability updated successfully');
            }

            // Update tools in local state
            setTools(prevTools => 
                prevTools.map(tool => 
                    tool.id === toolId.toString()
                        ? { ...tool, isAvailable: true }
                        : tool
                )
            );

            console.log('Rental marked as returned successfully');
        } catch (error) {
            console.error('Error marking rental as returned:', error);
            // You could add a toast notification here to show the error to the user
        }
    };

  if (authLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold">Loading your rental data...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">My Rental Management</h1>
                <p className="text-muted-foreground">View and manage your equipment rentals.</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => setIsDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Tool
                </Button>
                <Button variant="outline" onClick={() => setUpdateDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Tool
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>My Active Rentals</CardTitle>
                <CardDescription>Your tools and equipment currently checked out or rented to others.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4">Loading rentals...</div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Your Role</TableHead>
                                <TableHead>Other Party</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedActiveRentals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-4">
                                            No active rentals found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedActiveRentals.map(rental => <RentalRow key={rental.id} rental={rental} currentUserId={user?.id || 0} onMarkReturned={handleMarkReturned} />)
                                )}
                            </TableBody>
                        </Table>
                        
                        {activeRentals.length > 5 && (
                            <div className="flex justify-center mt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowAllActiveRentals(!showAllActiveRentals)}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllActiveRentals ? 'rotate-180' : ''}`} />
                                    {showAllActiveRentals ? 'Show Less' : `Show More (${activeRentals.length - 5} more)`}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>

        {/* My Uploaded Tools Section */}
        <Card>
            <CardHeader>
                <CardTitle>My Uploaded Tools</CardTitle>
                <CardDescription>Tools you have uploaded for others to rent.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4">Loading your tools...</div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tool Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price/Day</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedTools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            No tools uploaded yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayedTools.map(tool => (
                                        <TableRow key={tool.id}>
                                            <TableCell className="font-medium">{tool.name}</TableCell>
                                            <TableCell>Tool</TableCell>
                                            <TableCell>${tool.dailyRate.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={tool.isAvailable ? 'default' : 'secondary'}>
                                                    {tool.isAvailable ? 'Available' : 'Rented Out'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{new Date().toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleUpdateClick(tool)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        size="sm"
                                                        onClick={() => handleDeleteTool(tool.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        
                        {tools.length > 5 && (
                            <div className="flex justify-center mt-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowAllTools(!showAllTools)}
                                    className="flex items-center gap-2"
                                >
                                    <ChevronDown className={`h-4 w-4 transition-transform ${showAllTools ? 'rotate-180' : ''}`} />
                                    {showAllTools ? 'Show Less' : `Show More (${tools.length - 5} more)`}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>

        {/* Rental History Section */}
        <Card>
            <CardHeader>
                <CardTitle>Rental History</CardTitle>
                <CardDescription>Complete history of all your rental transactions (both as owner and borrower).</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4">Loading rental history...</div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Tool</TableHead>
                                <TableHead>Your Role</TableHead>
                                <TableHead>Other Party</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Total Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                                                 {displayedRentalHistory.length === 0 ? (
                                     <TableRow>
                                         <TableCell colSpan={8} className="text-center py-4">
                                             No rental history found
                                         </TableCell>
                                     </TableRow>
                                 ) : (
                                     displayedRentalHistory.map(rental => (
                                        <TableRow key={rental.id}>
                                            <TableCell className="font-medium">{rental.tool.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={rental.owner.id === user?.id ? 'default' : 'secondary'}>
                                                    {rental.owner.id === user?.id ? 'Owner' : 'Borrower'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {rental.owner.id === user?.id ? rental.borrower.username : rental.owner.username}
                                            </TableCell>
                                            <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
                                            <TableCell>${rental.total_price}</TableCell>
                                            <TableCell>
                                                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                    {rental.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={rental.payment_status === 'paid' ? 'default' : 'secondary'}>
                                                    {rental.payment_status === 'paid' ? 'Paid' : 'Pending'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                                         </TableBody>
                         </Table>
                         
                         {rentalTransactions.length > 5 && (
                             <div className="flex justify-center mt-4">
                                 <Button 
                                     variant="outline" 
                                     onClick={() => setShowAllRentalHistory(!showAllRentalHistory)}
                                     className="flex items-center gap-2"
                                 >
                                     <ChevronDown className={`h-4 w-4 transition-transform ${showAllRentalHistory ? 'rotate-180' : ''}`} />
                                     {showAllRentalHistory ? 'Show Less' : `Show More (${rentalTransactions.length - 5} more)`}
                                 </Button>
                             </div>
                         )}
                     </>
                 )}
             </CardContent>
         </Card>

        <AddToolDialog 
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onAddTool={handleAddTool}
        />
        <UpdateToolDialog
            isOpen={updateDialogOpen}
            onOpenChange={setUpdateDialogOpen}
            tool={selectedTool}
            onUpdateTool={handleUpdateTool}
            onDeleteTool={handleDeleteTool}
        />
    </div>
  );
}
