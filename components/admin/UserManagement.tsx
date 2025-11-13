'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'verified_author' | 'user';
  party: 'democratic' | 'republican' | 'independent' | null;
  verified: boolean;
  created_at: string;
  email?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch user profiles
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) {
        throw profileError;
      }

      // Fetch corresponding auth users to get emails
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Could not fetch auth users:', authError);
      }

      // Merge email data with profiles
      const usersWithEmails = profiles.map(profile => ({
        ...profile,
        email: authUsers?.find(u => u.id === profile.id)?.email,
      }));

      setUsers(usersWithEmails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'verified_author':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartyBadge = (party: string | null) => {
    if (!party) return '';
    switch (party) {
      case 'democratic':
        return 'bg-blue-100 text-blue-800';
      case 'republican':
        return 'bg-red-100 text-red-800';
      case 'independent':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dem-blue mx-auto mb-4"></div>
          <p className="text-text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button onClick={fetchUsers} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  const adminCount = users.filter(u => u.role === 'admin').length;
  const authorCount = users.filter(u => u.role === 'verified_author').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-sm text-text-muted">{users.length} total users</p>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-purple-600">{adminCount}</div>
          <div className="text-sm text-text-muted mt-1">Administrators</div>
        </div>

        <div className="card">
          <div className="text-3xl font-bold text-blue-600">{authorCount}</div>
          <div className="text-sm text-text-muted mt-1">Verified Authors</div>
        </div>

        <div className="card">
          <div className="text-3xl font-bold text-gray-600">{userCount}</div>
          <div className="text-sm text-text-muted mt-1">Regular Users</div>
        </div>
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">No users yet</h3>
          <p className="text-text-muted">
            Users will appear here when they sign up
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Party
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-bg-secondary">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-text-primary">{user.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadge(user.role)} capitalize`}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.party ? (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPartyBadge(user.party)} capitalize`}>
                          {user.party}
                        </span>
                      ) : (
                        <span className="text-text-muted text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.verified ? (
                        <span className="text-green-600 text-sm">✓ Verified</span>
                      ) : (
                        <span className="text-text-muted text-sm">Unverified</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-dem-blue hover:text-blue-700 mr-3">
                        Edit
                      </button>
                      {!user.verified && user.role === 'verified_author' && (
                        <button className="text-green-600 hover:text-green-800 mr-3">
                          Verify
                        </button>
                      )}
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
