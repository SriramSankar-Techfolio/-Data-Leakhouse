import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ userId: '', email: '', role: 'user' });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'user_roles'), (snapshot) => {
      setUserRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAssignRole = async () => {
    if (!isAdmin) return;
    if (!newUser.userId) {
      toast.error('User ID is required');
      return;
    }
    try {
      await setDoc(doc(db, 'user_roles', newUser.userId), {
        userId: newUser.userId,
        email: newUser.email,
        roles: [newUser.role]
      });
      setNewUser({ userId: '', email: '', role: 'user' });
      toast.success('Role assigned successfully');
    } catch (error) {
      toast.error('Failed to assign role');
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign User Role
          </CardTitle>
          <CardDescription>Map Firebase UIDs to application roles (admin, user, analyst).</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Firebase UID</Label>
            <Input 
              placeholder="Enter User UID" 
              value={newUser.userId}
              onChange={e => setNewUser({...newUser, userId: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input 
              placeholder="user@example.com" 
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              <select 
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newUser.role}
                onChange={e => setNewUser({...newUser, role: e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="analyst">Analyst</option>
              </select>
              <Button onClick={handleAssignRole}>Assign</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Active Role Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map(ur => (
                <TableRow key={ur.id}>
                  <TableCell className="font-mono text-xs">{ur.userId}</TableCell>
                  <TableCell>{ur.email || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ur.roles?.map((role: string) => (
                        <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {userRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-zinc-500">
                    No role assignments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
