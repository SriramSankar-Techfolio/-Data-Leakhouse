import { useState } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { loginWithGoogle, logout } from './firebase';
import { 
  Database, 
  ShieldCheck, 
  Terminal, 
  History, 
  Users, 
  LogOut, 
  LayoutDashboard,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from 'sonner';
import DatasetBrowser from './components/DatasetBrowser';
import PolicyManager from './components/PolicyManager';
import QueryEditor from './components/QueryEditor';
import AuditLogViewer from './components/AuditLogViewer';
import UserManagement from './components/UserManagement';

function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('datasets');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cloud Lakehouse</h1>
          </div>
          <p className="text-zinc-500 mb-8">
            Secure, policy-based access control for your modern data stack.
          </p>
          <Button onClick={loginWithGoogle} className="w-full py-6 text-lg">
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'query', label: 'Query Editor', icon: Terminal },
    { id: 'policies', label: 'Access Policies', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Logs', icon: History },
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-zinc-200 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-zinc-900" />
              <span className="font-bold tracking-tight">Lakehouse</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white' 
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.photoURL || ''} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.displayName}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="w-4 h-4" />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-bottom border-zinc-200 flex items-center px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold">
            {navItems.find(i => i.id === activeTab)?.label}
          </h2>
        </header>

        <div className="p-8">
          {activeTab === 'datasets' && <DatasetBrowser />}
          {activeTab === 'query' && <QueryEditor />}
          {activeTab === 'policies' && <PolicyManager />}
          {activeTab === 'audit' && <AuditLogViewer />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Dashboard />
      <Toaster position="top-right" />
    </FirebaseProvider>
  );
}
