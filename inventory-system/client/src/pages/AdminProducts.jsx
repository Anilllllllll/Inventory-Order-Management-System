import React, { useState, useEffect } from 'react';
import API from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  Package, 
  Tag, 
  Coins, 
  Warehouse,
  AlertCircle
} from 'lucide-react';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form States
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [unitType, setUnitType] = useState('Weight'); // Weight, Volume, Count
  const [inputUnit, setInputUnit] = useState('kg');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await API.get('/products', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          category: selectedCategory
        }
      });
      setProducts(prodRes.data.products);
      setTotalPages(prodRes.data.pagination.totalPages);

      const catRes = await API.get('/products/categories');
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching admin products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, selectedCategory, searchQuery]);

  // Adjust input unit when unit type changes
  useEffect(() => {
    if (!editingProduct) {
      if (unitType === 'Weight') setInputUnit('kg');
      else if (unitType === 'Volume') setInputUnit('L');
      else setInputUnit('item');
    }
  }, [unitType, editingProduct]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setCategory('');
    setUnitType('Weight');
    setInputUnit('kg');
    setPricePerUnit('');
    setStockQuantity('');
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    
    // Reverse-engineer input unit and display prices/stocks nicely
    const baseUnit = product.baseUnit;
    let type = 'Weight';
    let unit = 'kg';
    let price = Number(product.basePrice);
    let qty = Number(product.stockQuantity);

    if (baseUnit === 'g') {
      type = 'Weight';
      unit = 'kg'; // Show in kg for convenience
      price = price * 1000;
      qty = qty / 1000;
    } else if (baseUnit === 'mL') {
      type = 'Volume';
      unit = 'L'; // Show in L for convenience
      price = price * 1000;
      qty = qty / 1000;
    } else {
      type = 'Count';
      unit = 'item';
    }

    setUnitType(type);
    setInputUnit(unit);
    setPricePerUnit(price);
    setStockQuantity(qty);
    setModalOpen(true);
  };

  // Save product (Create or Edit)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!name || !category || !inputUnit || pricePerUnit === '' || stockQuantity === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      name,
      sku: sku.trim() || undefined,
      category,
      inputUnit,
      pricePerUnit: Number(pricePerUnit),
      stockQuantity: Number(stockQuantity)
    };

    const actionText = editingProduct ? 'Updating product...' : 'Creating product...';
    const toastId = toast.loading(actionText);

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, payload);
        toast.success('Product updated successfully', { id: toastId });
      } else {
        await API.post('/products', payload);
        toast.success('Product created successfully', { id: toastId });
      }
      setModalOpen(false);
      fetchData(); // Refresh table
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Operation failed';
      toast.error(errMsg, { id: toastId });
    }
  };

  // Delete product
  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? All transaction history involving this product will remain in orders.')) {
      return;
    }

    const toastId = toast.loading('Deleting product...');
    try {
      await API.delete(`/products/${productId}`);
      toast.success('Product deleted successfully', { id: toastId });
      fetchData();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Deletion failed';
      toast.error(errMsg, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Product Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage products list, pricing metrics, and stock quantities</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-500/10 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by name, SKU..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-10 glass-input text-sm"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => { setSelectedCategory(''); setPage(1); }}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              selectedCategory === ''
                ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/10'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      {loading && products.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-slate-600" />
          <div>
            <p className="text-slate-300 font-bold">No products found</p>
            <p className="text-slate-500 text-xs mt-1">Add your first product to get started</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6">Product Details</th>
                  <th className="p-4">SKU Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Rate (Base Unit)</th>
                  <th className="p-4">Stock Quantity</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {products.map((product) => {
                  const basePriceNum = Number(product.basePrice);
                  const isOutOfStock = Number(product.stockQuantity) <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-900/10 transition-all">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400">
                            <Package className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-white text-xs">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">{product.sku}</td>
                      <td className="p-4 text-slate-300 font-medium">{product.category}</td>
                      <td className="p-4 text-emerald-400 font-semibold">
                        {product.baseUnit === 'g'
                          ? `₹${(basePriceNum * 1000).toFixed(2)}/kg (₹${basePriceNum.toFixed(4)}/g)`
                          : product.baseUnit === 'mL'
                          ? `₹${(basePriceNum * 1000).toFixed(2)}/L (₹${basePriceNum.toFixed(4)}/mL)`
                          : `₹${basePriceNum.toFixed(2)}/item`}
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-slate-300'}`}>
                          {product.friendlyStock}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-violet-500 hover:bg-violet-600/10 hover:text-violet-400 text-slate-400 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 bg-slate-900 border border-slate-800 hover:border-rose-500 hover:bg-rose-600/10 hover:text-rose-400 text-slate-400 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2 border border-slate-800 rounded-xl bg-slate-900/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all text-xs font-semibold text-slate-300"
          >
            Prev
          </button>
          <span className="text-xs text-slate-400 font-medium">
            Page <span className="text-white font-bold">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2 border border-slate-800 rounded-xl bg-slate-900/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-all text-xs font-semibold text-slate-300"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg glass-card relative p-6 max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-extrabold text-lg text-white mb-6">
              {editingProduct ? 'Edit Product Details' : 'Add New Product'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Name *</label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. White Sugar"
                    className="w-full pl-10 glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">SKU Code (Optional)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full glass-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Groceries"
                      className="w-full pl-10 glass-input text-xs"
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Unit Conversion Types configuration */}
              <div className="border-t border-slate-800/60 pt-4 mt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Unit & Price Strategy</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Unit Class *</label>
                    <select
                      value={unitType}
                      disabled={!!editingProduct} // Disable unit changing on edit to avoid schema mismatches
                      onChange={(e) => setUnitType(e.target.value)}
                      className="w-full glass-input text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="Weight">Weight (g, kg)</option>
                      <option value="Volume">Volume (mL, L)</option>
                      <option value="Count">Count (item)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Input Unit *</label>
                    <select
                      value={inputUnit}
                      disabled={!!editingProduct} // Disable unit changing on edit
                      onChange={(e) => setInputUnit(e.target.value)}
                      className="w-full glass-input text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {unitType === 'Weight' && (
                        <>
                          <option value="kg">kg (Kilograms)</option>
                          <option value="g">g (Grams)</option>
                        </>
                      )}
                      {unitType === 'Volume' && (
                        <>
                          <option value="L">L (Liters)</option>
                          <option value="mL">mL (Milliliters)</option>
                        </>
                      )}
                      {unitType === 'Count' && (
                        <option value="item">item (Items)</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Price (₹) per {inputUnit} *</label>
                  <div className="relative">
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      step="any"
                      required
                      value={pricePerUnit}
                      onChange={(e) => setPricePerUnit(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full pl-10 glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">Stock Qty ({inputUnit}) *</label>
                  <div className="relative">
                    <Warehouse className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      step="any"
                      required
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full pl-10 glass-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Conversion Preview alert */}
              {pricePerUnit !== '' && stockQuantity !== '' && (
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-[11px] text-slate-400 leading-relaxed font-medium">
                  <span className="text-violet-400 font-bold">System Conversion Summary:</span>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>This product will be saved with a base unit of <span className="text-violet-300 font-semibold">{unitType === 'Weight' ? 'g' : (unitType === 'Volume' ? 'mL' : 'item')}</span>.</li>
                    <li>Internally stored stock quantity: <span className="text-violet-300 font-bold">{unitType === 'Weight' || unitType === 'Volume' ? Number(stockQuantity) * (inputUnit === 'kg' || inputUnit === 'L' ? 1000 : 1) : stockQuantity} {unitType === 'Weight' ? 'g' : (unitType === 'Volume' ? 'mL' : 'item')}</span>.</li>
                    <li>Internally stored base price: <span className="text-violet-300 font-bold">₹{Number(pricePerUnit) / (unitType === 'Weight' || unitType === 'Volume' ? (inputUnit === 'kg' || inputUnit === 'L' ? 1000 : 1) : 1)} per {unitType === 'Weight' ? 'gram' : (unitType === 'Volume' ? 'mL' : 'item')}</span>.</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-800/60 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-xs font-bold hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-500/10 transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
