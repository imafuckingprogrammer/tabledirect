import { useState, useEffect } from 'react';
import { Plus, Trash2, User, UserCheck, UserX, Shield, ChefHat } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ActiveSession, UserRole } from '../../types';

interface StaffMember {
  id: string;
  email: string;
  role: UserRole;
  restaurant_id?: string;
  last_active?: string;
  session_status?: 'active' | 'inactive';
}

export function StaffManagement() {
  const { restaurantId, userRole } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);

  
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'server' as 'chef' | 'server',
  });

  useEffect(() => {
    if (restaurantId) {
      loadStaffData();
    }
  }, [restaurantId]);

  const loadStaffData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      // Load users with restaurant role
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .neq('role', 'customer');

      if (usersError) throw usersError;

      // Load active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId);

      if (sessionsError) throw sessionsError;

      setActiveSessions(sessionsData || []);

             // Merge user data with session status
       const staffWithSessions = (usersData || []).map(user => {
         const session = sessionsData?.find(s => s.user_id === user.id && s.status === 'active');
         return {
           ...user,
           last_active: session?.last_seen,
           session_status: session ? 'active' as const : 'inactive' as const,
         };
       });

      setStaff(staffWithSessions);
    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      // In a real app, you'd send an invitation email
      // For now, we'll create a placeholder user that needs to complete signup
      const { error } = await supabase
        .from('users')
        .insert({
          email: inviteForm.email,
          role: inviteForm.role,
          restaurant_id: restaurantId,
          // In real implementation, you'd set is_verified: false and send invite email
        })
        .select()
        .single();

      if (error) throw error;

      await loadStaffData();
      resetInviteForm();
      
      // In real app: Send invitation email here
      alert(`Invitation sent to ${inviteForm.email}`);
    } catch (error) {
      console.error('Error inviting staff:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'chef' | 'server' | 'owner') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await loadStaffData();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const removeStaff = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      // Remove active sessions first
      await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

      // Update user to remove restaurant association
      const { error } = await supabase
        .from('users')
        .update({ 
          restaurant_id: null,
          role: 'customer' 
        })
        .eq('id', userId);

      if (error) throw error;
      await loadStaffData();
    } catch (error) {
      console.error('Error removing staff:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ status: 'inactive' })
        .eq('id', sessionId);

      if (error) throw error;
      await loadStaffData();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      role: 'server',
    });
    setShowInviteForm(false);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4" />;
      case 'chef': return <ChefHat className="w-4 h-4" />;
      case 'server': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-700 bg-purple-100';
      case 'chef': return 'text-orange-700 bg-orange-100';
      case 'server': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatLastActive = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const canManageStaff = userRole === 'owner';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage your restaurant team and permissions</p>
          </div>

          {canManageStaff && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Invite Staff
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
            <p className="text-sm text-gray-600">Total Staff</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-success-600">
              {staff.filter(s => s.session_status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active Now</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-orange-600">
              {staff.filter(s => s.role === 'chef').length}
            </p>
            <p className="text-sm text-gray-600">Chefs</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-600">
              {staff.filter(s => s.role === 'server').length}
            </p>
            <p className="text-sm text-gray-600">Servers</p>
          </div>
        </div>

        {/* Staff List */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          </div>

          <div className="space-y-4">
            {staff.map(member => {
              const activeSession = activeSessions.find(s => s.user_id === member.id && s.status === 'active');
              
              return (
                <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {getRoleIcon(member.role)}
                      </div>
                      {member.session_status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{member.email}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className={`flex items-center gap-1 ${
                          member.session_status === 'active' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {member.session_status === 'active' ? (
                            <UserCheck className="w-4 h-4" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                          {member.session_status === 'active' ? 'Online' : 'Offline'}
                        </span>
                        <span>Last active: {formatLastActive(member.last_active)}</span>
                        {activeSession?.station_id && (
                          <span>Station: {activeSession.station_id}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageStaff && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      {member.session_status === 'active' && activeSession && (
                        <button
                          onClick={() => terminateSession(activeSession.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                          End Session
                        </button>
                      )}

                      <select
                        value={member.role}
                        onChange={(e) => updateUserRole(member.id, e.target.value as any)}
                        className="text-sm border border-gray-200 rounded-md px-2 py-1"
                      >
                        <option value="server">Server</option>
                        <option value="chef">Chef</option>
                        {userRole === 'owner' && <option value="owner">Owner</option>}
                      </select>

                      <button
                        onClick={() => removeStaff(member.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {staff.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No staff members yet</p>
                {canManageStaff && (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    className="btn-primary"
                  >
                    Invite your first team member
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="card mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Sessions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.filter(s => s.status === 'active').map(session => {
                const user = staff.find(s => s.id === session.user_id);
                return (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user?.role || 'server')}
                        <span className="font-medium text-gray-900">{user?.email}</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {session.station_id && <p>Station: {session.station_id}</p>}
                      <p>Started: {formatLastActive(session.created_at)}</p>
                      <p>Last seen: {formatLastActive(session.last_seen)}</p>
                    </div>

                    {canManageStaff && (
                      <button
                        onClick={() => terminateSession(session.id)}
                        className="mt-3 w-full text-sm text-red-600 hover:bg-red-50 py-1 rounded-md"
                      >
                        End Session
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Invite Staff Member</h2>
                <button
                  onClick={resetInviteForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleInviteStaff} className="space-y-4">
                <div>
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="colleague@example.com"
                  />
                </div>

                <div>
                  <label className="form-label">Role *</label>
                  <select
                    required
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                    className="input"
                  >
                    <option value="server">Server</option>
                    <option value="chef">Chef</option>
                  </select>
                  <p className="text-sm text-gray-600 mt-1">
                    {inviteForm.role === 'chef' 
                      ? 'Can access kitchen interface and manage orders'
                      : 'Can view orders and update status'
                    }
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetInviteForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 