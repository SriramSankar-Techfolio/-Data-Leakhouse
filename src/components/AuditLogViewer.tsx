import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.query?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search logs by user or query..." 
            className="pl-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Filter className="w-4 h-4" />
          Showing last 50 events
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-zinc-500 whitespace-nowrap">
                    {log.timestamp?.toDate().toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{log.userEmail}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{log.userId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <code className="text-xs bg-zinc-100 px-1 rounded">{log.query}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                    No audit logs found.
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
