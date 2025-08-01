"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tool } from '@/lib/data';
import { Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateToolDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tool: Tool | null;
  onUpdateTool: (updatedTool: Tool) => void;
  onDeleteTool: (toolId: string) => void;
}

export function UpdateToolDialog({ isOpen, onOpenChange, tool, onUpdateTool, onDeleteTool }: UpdateToolDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dailyRate: 0,
    imageUrl: '',
    isAvailable: true
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  // Update form data when tool changes
  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        dailyRate: tool.dailyRate,
        imageUrl: tool.imageUrl,
        isAvailable: tool.isAvailable
      });
    }
  }, [tool]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdate = async () => {
    if (!tool) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/tools/${tool.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price_per_day: formData.dailyRate,
          image: formData.imageUrl,
          available: formData.isAvailable,
        }),
      });

      if (response.ok) {
        const updatedToolData = await response.json();
        const updatedTool: Tool = {
          id: updatedToolData.id.toString(),
          name: updatedToolData.name,
          description: updatedToolData.description,
          imageUrl: updatedToolData.image || formData.imageUrl,
          pricing_type: updatedToolData.pricing_type || 'daily',
          dailyRate: parseFloat(updatedToolData.price_per_day),
          isAvailable: updatedToolData.available,
          owner: updatedToolData.owner?.username || tool.owner,
          owner_id: updatedToolData.owner?.id || tool.owner_id,
          aiHint: updatedToolData.name.toLowerCase()
        };
        
        onUpdateTool(updatedTool);
        onOpenChange(false);
        toast({
          title: "Tool Updated",
          description: "Tool details have been successfully updated.",
        });
      } else {
        throw new Error('Failed to update tool');
      }
    } catch (error) {
      console.error('Error updating tool:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tool) return;
    
    if (!confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      return;
    }
    
    setDeleteLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/tools/${tool.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDeleteTool(tool.id);
        onOpenChange(false);
        toast({
          title: "Tool Deleted",
          description: "Tool has been successfully deleted.",
        });
      } else {
        throw new Error('Failed to delete tool');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Tool</DialogTitle>
          <DialogDescription>
            Update the details for "{tool.name}". Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dailyRate" className="text-right">
              Daily Rate ($)
            </Label>
            <Input
              id="dailyRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.dailyRate}
              onChange={(e) => handleInputChange('dailyRate', parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="imageUrl" className="text-right">
              Image URL
            </Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange('imageUrl', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isAvailable" className="text-right">
              Available
            </Label>
            <Select 
              value={formData.isAvailable ? 'true' : 'false'} 
              onValueChange={(value) => handleInputChange('isAvailable', value === 'true')}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Available</SelectItem>
                <SelectItem value="false">Not Available</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleteLoading ? 'Deleting...' : 'Delete Tool'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
