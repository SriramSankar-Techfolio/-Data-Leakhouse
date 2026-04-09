import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Play, Terminal, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QueryEditor() {
  const { user } = useAuth();
  const [query, setQuery] = useState('SELECT * FROM sales_data');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'policies'), (snapshot) => {
      setPolicies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const executeQuery = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          user: { id: user.uid, email: user.email },
          policies
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Query failed');
      }

      setResults(result.data);
      
      // Log success
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        query,
        status: 'success',
        action: 'query_execution'
      });

      toast.success('Query executed successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);

      // Log denial/failure
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        userEmail: user.email,
        timestamp: serverTimestamp(),
        query,
        status: 'denied',
        action: 'query_execution'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2 text-sm font-mono">
            <Terminal className="w-4 h-4" />
            SQL Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-32 bg-zinc-950 text-zinc-300 font-mono p-4 rounded-lg border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
            value={query}
            onChange={e => setQuery(e.target.value)}
            spellCheck={false}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-zinc-500">
              Only <code className="bg-zinc-800 px-1 rounded text-zinc-400">SELECT * FROM table</code> is supported in this demo.
            </p>
            <Button onClick={executeQuery} disabled={loading} className="gap-2">
              <Play className="w-4 h-4" />
              {loading ? 'Executing...' : 'Run Query'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700">
          <ShieldAlert className="w-5 h-5" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Query returned {results.length} rows</span>
          </div>
          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="uppercase text-xs font-bold tracking-wider">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map(col => (
                      <TableCell key={col} className={row[col] === '****-****-****' ? 'text-zinc-400 italic' : ''}>
                        {row[col]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
