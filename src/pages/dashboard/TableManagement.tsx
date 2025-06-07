import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Download, Copy } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { RestaurantTable } from '../../types';

export function TableManagement() {
  const { restaurantId } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [showQRModal, setShowQRModal] = useState<{ table: RestaurantTable; qrCode: string } | null>(null);
  
  const [tableForm, setTableForm] = useState({
    table_number: '',
    seats: 4,
    location: '',
    is_active: true,
  });

  useEffect(() => {
    if (restaurantId) {
      loadTables();
    }
  }, [restaurantId]);

  const loadTables = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number');

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      // Generate token for new table
      const token = self.crypto?.randomUUID() || `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const tableData = {
        ...tableForm,
        restaurant_id: restaurantId,
        qr_token: editingTable ? (editingTable.qr_token || editingTable.token) : token,
        token: editingTable ? (editingTable.qr_token || editingTable.token) : token, // Keep both for compatibility
      };

      if (editingTable) {
        const { error } = await supabase
          .from('restaurant_tables')
          .update(tableData)
          .eq('id', editingTable.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_tables')
          .insert(tableData);

        if (error) throw error;
      }

      await loadTables();
      resetForm();
    } catch (error) {
      console.error('Error saving table:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  const resetForm = () => {
    setTableForm({
      table_number: '',
      seats: 4,
      location: '',
      is_active: true,
    });
    setEditingTable(null);
    setShowForm(false);
  };

  const startEditing = (table: RestaurantTable) => {
    setTableForm({
      table_number: table.table_number.toString(),
      seats: table.seats,
      location: table.location || '',
      is_active: table.is_active,
    });
    setEditingTable(table);
    setShowForm(true);
  };

  const generateQRCode = async (table: RestaurantTable) => {
    try {
      // Use qr_token if available, otherwise fall back to token
      const token = table.qr_token || table.token;
      const orderUrl = `${window.location.origin}/order/${token}`;
      const qrCode = await QRCodeLib.toDataURL(orderUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setShowQRModal({ table, qrCode });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = (table: RestaurantTable, qrCode: string) => {
    const link = document.createElement('a');
    link.download = `table-${table.table_number}-qr.png`;
    link.href = qrCode;
    link.click();
  };

  const copyOrderUrl = (table: RestaurantTable) => {
    // Use qr_token if available, otherwise fall back to token
    const token = table.qr_token || table.token;
    const orderUrl = `${window.location.origin}/order/${token}`;
    navigator.clipboard.writeText(orderUrl);
    // You could add a toast notification here
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="text-gray-600">Manage your restaurant tables and generate QR codes</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map(table => (
            <div key={table.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Table {table.table_number}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {table.seats} seats
                  </p>
                </div>
                
                <div className="flex items-center gap-1">
                  {table.is_active ? (
                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  ) : (
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                  )}
                </div>
              </div>

              {table.location && (
                <p className="text-sm text-gray-600 mb-4">📍 {table.location}</p>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => generateQRCode(table)}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <QrCode className="w-4 h-4" />
                  View QR Code
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyOrderUrl(table)}
                    className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  
                  <button
                    onClick={() => startEditing(table)}
                    className="px-3 py-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="px-3 py-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Order URL: /order/{(table.qr_token || table.token).slice(0, 8)}...
                </p>
              </div>
            </div>
          ))}

          {tables.length === 0 && (
            <div className="col-span-full">
              <div className="text-center py-12">
                <QrCode className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No tables created yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Create your first table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingTable ? 'Edit Table' : 'Add Table'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Table Number *</label>
                  <input
                    type="text"
                    required
                    value={tableForm.table_number}
                    onChange={(e) => setTableForm(prev => ({ ...prev, table_number: e.target.value }))}
                    className="input"
                    placeholder="e.g., 1, A1, Corner Table"
                  />
                </div>

                <div>
                  <label className="form-label">Number of Seats *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={tableForm.seats}
                    onChange={(e) => setTableForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 1 }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={tableForm.location}
                    onChange={(e) => setTableForm(prev => ({ ...prev, location: e.target.value }))}
                    className="input"
                    placeholder="e.g., Near window, Patio, Main dining area"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={tableForm.is_active}
                    onChange={(e) => setTableForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Table is active for ordering
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingTable ? 'Update' : 'Create'} Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  QR Code - Table {showQRModal.table.table_number}
                </h2>
                <button
                  onClick={() => setShowQRModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block mb-4">
                  <img
                    src={showQRModal.qrCode}
                    alt={`QR Code for Table ${showQRModal.table.table_number}`}
                    className="w-64 h-64"
                  />
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Customers can scan this QR code to access the menu and place orders for Table {showQRModal.table.table_number}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => downloadQRCode(showQRModal.table, showQRModal.qrCode)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download QR Code
                  </button>

                  <button
                    onClick={() => copyOrderUrl(showQRModal.table)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Order URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 