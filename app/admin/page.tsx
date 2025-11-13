'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ApiStatus from '@/components/admin/ApiStatus';
import BillManagement from '@/components/admin/BillManagement';
import UserManagement from '@/components/admin/UserManagement';

type Tab = 'api-status' | 'bills' | 'users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('api-status');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    setUserEmail(user.email || '');

    // Check if user has admin role
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
  }

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dem-blue mx-auto mb-4"></div>
          <p className="text-text-muted">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card max-w-md text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-text-secondary mb-4">
            You don't have permission to access the admin dashboard.
          </p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'api-status' as Tab, label: 'API Status', icon: '📊' },
    { id: 'bills' as Tab, label: 'Bills', icon: '📜' },
    { id: 'users' as Tab, label: 'Users', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-text-muted">{userEmail}</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="btn-secondary"
            >
              ← Back to Site
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors
                  ${activeTab === tab.id
                    ? 'text-dem-blue border-b-2 border-dem-blue'
                    : 'text-text-muted hover:text-text-primary'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'api-status' && <ApiStatus />}
        {activeTab === 'bills' && <BillManagement />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
}
