import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Trash2, Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PolicyManager() {
  const { isAdmin } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    targetType: 'table',
    targetId: 'sales_data',
    role: 'user',
    action: 'read',
    condition: '',
    columns: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'policies'), (snapshot) => {
      setPolicies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddPolicy = async () => {
    if (!isAdmin) return;
    if (!newPolicy.name) {
      toast.error('Policy name is required');
      return;
    }
    try {
      await addDoc(collection(db, 'policies'), {
        ...newPolicy,
        columns: newPolicy.columns ? newPolicy.columns.split(',').map(c => c.trim()) : []
      });
      setNewPolicy({
        name: '',
        targetType: 'table',
        targetId: 'sales_data',
        role: 'user',
        action: 'read',
        condition: '',
        columns: ''
      });
      toast.success('Policy created');
    } catch (error) {
      toast.error('Failed to create policy');
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'policies', id));
      toast.success('Policy deleted');
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Policy
            </CardTitle>
            <CardDescription>Define fine-grained access rules for tables, columns, or rows.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Policy Name</Label>
              <Input 
                placeholder="e.g., Mask SSN for Analysts" 
                value={newPolicy.name}
                onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Type</Label>
              <Select value={newPolicy.targetType} onValueChange={v => setNewPolicy({...newPolicy, targetType: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                  <SelectItem value="row">Row</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Table ID</Label>
              <Input 
                placeholder="e.g., sales_data" 
                value={newPolicy.targetId}
                onChange={e => setNewPolicy({...newPolicy, targetId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={newPolicy.action} onValueChange={v => setNewPolicy({...newPolicy, action: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Allow Read</SelectItem>
                  <SelectItem value="deny">Deny Access</SelectItem>
                  <SelectItem value="mask">Mask Columns</SelectItem>
                  <SelectItem value="filter">Filter Rows (RLS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newPolicy.action === 'mask' && (
              <div className="space-y-2">
                <Label>Columns to Mask (comma separated)</Label>
                <Input 
                  placeholder="e.g., ssn, customer_email" 
                  value={newPolicy.columns}
                  onChange={e => setNewPolicy({...newPolicy, columns: e.target.value})}
                />
              </div>
            )}
            {newPolicy.action === 'filter' && (
              <div className="space-y-2">
                <Label>Filter Condition (SQL-like)</Label>
                <Input 
                  placeholder="e.g., region == 'North'" 
                  value={newPolicy.condition}
                  onChange={e => setNewPolicy({...newPolicy, condition: e.target.value})}
                />
              </div>
            )}
            <div className="col-span-full pt-4">
              <Button onClick={handleAddPolicy} className="w-full">Create Policy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map(policy => (
          <Card key={policy.id} className="relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              policy.action === 'deny' ? 'bg-red-500' : 
              policy.action === 'mask' ? 'bg-amber-500' : 
              policy.action === 'filter' ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <CardDescription>Target: {policy.targetId} ({policy.targetType})</CardDescription>
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => handleDeletePolicy(policy.id)}>
                    <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-500" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={policy.action === 'deny' ? 'destructive' : 'secondary'}>
                  {policy.action.toUpperCase()}
                </Badge>
                <Badge variant="outline">Role: {policy.role}</Badge>
              </div>
              {policy.columns?.length > 0 && (
                <div className="text-sm text-zinc-500 mb-2">
                  <strong>Masked Columns:</strong> {policy.columns.join(', ')}
                </div>
              )}
              {policy.condition && (
                <div className="text-sm text-zinc-500">
                  <strong>Condition:</strong> <code className="bg-zinc-100 px-1 rounded">{policy.condition}</code>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && (
          <div className="col-span-full h-48 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400">
            <Shield className="w-12 h-12 mb-2 opacity-20" />
            <p>No policies defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
