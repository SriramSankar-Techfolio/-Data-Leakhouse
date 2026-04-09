import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './FirebaseProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Database, Table as TableIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DatasetBrowser() {
  const { user, isAdmin } = useAuth();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'datasets'), (snapshot) => {
      setDatasets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      const unsub = onSnapshot(collection(db, `datasets/${selectedDataset.id}/tables`), (snapshot) => {
        setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsub();
    } else {
      setTables([]);
    }
  }, [selectedDataset]);

  const createSampleDataset = async () => {
    if (!isAdmin) return;
    try {
      const dsRef = await addDoc(collection(db, 'datasets'), {
        name: 'Sales Analytics',
        description: 'Global sales and customer data',
        owner: user?.uid,
        createdAt: serverTimestamp()
      });
      
      await addDoc(collection(db, `datasets/${dsRef.id}/tables`), {
        datasetId: dsRef.id,
        name: 'sales_data',
        format: 'iceberg',
        location: 's3://lakehouse/sales/',
        schema: {
          columns: [
            { name: 'id', type: 'int' },
            { name: 'region', type: 'string' },
            { name: 'amount', type: 'double' },
            { name: 'customer_email', type: 'string' },
            { name: 'ssn', type: 'string' }
          ]
        }
      });
      toast.success('Sample dataset created');
    } catch (error) {
      toast.error('Failed to create dataset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Data Catalog</h3>
        {isAdmin && (
          <Button onClick={createSampleDataset} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Sample Dataset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Datasets</h4>
          {datasets.map(ds => (
            <Card 
              key={ds.id} 
              className={`cursor-pointer transition-all ${selectedDataset?.id === ds.id ? 'ring-2 ring-zinc-900' : 'hover:bg-zinc-50'}`}
              onClick={() => setSelectedDataset(ds)}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-zinc-500" />
                  <div>
                    <CardTitle className="text-base">{ds.name}</CardTitle>
                    <CardDescription className="text-xs">{ds.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="md:col-span-2 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Tables</h4>
          {selectedDataset ? (
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Columns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map(table => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <TableIcon className="w-4 h-4 text-zinc-400" />
                        {table.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{table.format}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">{table.location}</TableCell>
                      <TableCell>{table.schema?.columns?.length || 0} columns</TableCell>
                    </TableRow>
                  ))}
                  {tables.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                        No tables found in this dataset.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400">
              <Database className="w-12 h-12 mb-2 opacity-20" />
              <p>Select a dataset to view tables</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
