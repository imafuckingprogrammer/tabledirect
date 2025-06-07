import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, DollarSign, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import type { MenuItem, MenuCategory } from '../../types';

interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_available: boolean;
  allergens: string[];
  preparation_time_minutes: number;
}

export function MenuManagement() {
  const { restaurantId } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'item' | 'category'; id: string } | null>(null);
  
  const [itemForm, setItemForm] = useState<MenuItemFormData>({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    image_url: '',
    is_available: true,
    allergens: [],
    preparation_time_minutes: 10,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    sort_order: 0,
  });

  useEffect(() => {
    if (restaurantId) {
      loadMenuData();
    }
  }, [restaurantId]);

  const loadMenuData = async () => {
    if (!restaurantId) return;

    try {
      setLoading(true);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:menu_categories(*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

    } catch (error) {
      console.error('Error loading menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const itemData = {
        ...itemForm,
        restaurant_id: restaurantId,
        allergens: itemForm.allergens.length > 0 ? itemForm.allergens : null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(itemData);

        if (error) throw error;
      }

      await loadMenuData();
      resetItemForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    try {
      const categoryData = {
        ...categoryForm,
        restaurant_id: restaurantId,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert(categoryData);

        if (error) throw error;
      }

      await loadMenuData();
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMenuData();
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMenuData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: 0,
      category_id: '',
      image_url: '',
      is_available: true,
      allergens: [],
      preparation_time_minutes: 10,
    });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      sort_order: 0,
    });
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const startEditingItem = (item: MenuItem) => {
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || '',
      is_available: item.is_available,
      allergens: item.allergens || [],
      preparation_time_minutes: item.preparation_time_minutes || 10,
    });
    setEditingItem(item);
    setShowItemForm(true);
  };

  const startEditingCategory = (category: MenuCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order,
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleAllergen = (allergen: string) => {
    setItemForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const commonAllergens = ['Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 'Soy', 'Wheat', 'Fish', 'Shellfish'];

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
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600">Manage your restaurant's menu items and categories</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
            <button
              onClick={() => setShowItemForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input min-w-[180px]"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600">{categories.length} categories</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditingCategory(category)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'category', id: category.id })}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {menuItems.filter(item => item.category_id === category.id).length} items
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
            <p className="text-sm text-gray-600">{filteredItems.length} items</p>
          </div>

          <div className="space-y-4">
            {filteredItems.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {!item.is_available && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${item.price.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {item.category?.name}
                        </div>
                        {item.preparation_time_minutes && (
                          <span>{item.preparation_time_minutes} min prep</span>
                        )}
                      </div>
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Allergens: {item.allergens.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditingItem(item)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ type: 'item', id: item.id })}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No menu items found</p>
                <button
                  onClick={() => setShowItemForm(true)}
                  className="mt-4 btn-primary"
                >
                  Add your first item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <button
                  onClick={resetItemForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      required
                      value={itemForm.name}
                      onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      required
                      value={itemForm.category_id}
                      onChange={(e) => setItemForm(prev => ({ ...prev, category_id: e.target.value }))}
                      className="input"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input h-20"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Price *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={itemForm.price}
                        onChange={(e) => setItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="input pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Prep Time (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={itemForm.preparation_time_minutes}
                      onChange={(e) => setItemForm(prev => ({ ...prev, preparation_time_minutes: parseInt(e.target.value) || 10 }))}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="form-label">Allergens</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {commonAllergens.map(allergen => (
                      <label key={allergen} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={itemForm.allergens.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          className="mr-2"
                        />
                        <span className="text-sm">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm(prev => ({ ...prev, is_available: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_available" className="text-sm text-gray-700">
                    Available for ordering
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingItem ? 'Update' : 'Add'} Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={resetCategoryForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input h-20"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCategory ? 'Update' : 'Add'} Category
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === 'item') {
              handleDeleteItem(deleteConfirm.id);
            } else {
              handleDeleteCategory(deleteConfirm.id);
            }
            setDeleteConfirm(null);
          }
        }}
        title={`Delete ${deleteConfirm?.type === 'item' ? 'Menu Item' : 'Category'}`}
        message={`Are you sure you want to delete this ${deleteConfirm?.type}? This action cannot be undone.`}
      />
    </div>
  );
} 