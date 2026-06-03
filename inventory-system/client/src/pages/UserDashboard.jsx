import React, { useState, useEffect } from 'react';
import API from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Trash2, 
  ChevronRight, 
  FileText, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Package
} from 'lucide-react';

const UserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Quotation Cart State
  // Array of { product, orderedUnit, orderedQuantity, convertedQuantity, subtotal }
  const [cart, setCart] = useState([]);

  // Fetch products and categories
  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await API.get('/products', {
        params: {
          page,
          limit: 8,
          search: searchQuery,
          category: selectedCategory
        }
      });
      setProducts(prodRes.data.products);
      setTotalPages(prodRes.data.pagination.totalPages);

      const catRes = await API.get('/products/categories');
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, selectedCategory, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to page 1 on new search
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setPage(1); // Reset to page 1 on new category
  };

  // Helper to get allowed units for a base unit
  const getAllowedUnits = (baseUnit) => {
    if (baseUnit === 'g') return ['kg', 'g'];
    if (baseUnit === 'mL') return ['L', 'mL'];
    return ['item'];
  };

  // Add a product to the quotation
  const addToQuotation = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      toast.error(`'${product.name}' is already in your quotation. Adjust its quantity on the right.`);
      return;
    }

    // Default values
    const defaultUnit = product.baseUnit === 'g' ? 'kg' : (product.baseUnit === 'mL' ? 'L' : 'item');
    const defaultQty = 1;
    
    // Convert to base quantity
    const factor = (defaultUnit === 'kg' || defaultUnit === 'L') ? 1000 : 1;
    const convertedQty = defaultQty * factor;
    const basePrice = Number(product.basePrice);
    const subtotal = convertedQty * basePrice;

    setCart([
      ...cart,
      {
        product,
        orderedUnit: defaultUnit,
        orderedQuantity: defaultQty,
        convertedQuantity: convertedQty,
        subtotal
      }
    ]);
    toast.success(`Added '${product.name}' to quotation`);
  };

  // Update unit or quantity in cart
  const updateCartItem = (productId, field, value) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;

      let updated = { ...item };
      if (field === 'orderedUnit') {
        updated.orderedUnit = value;
      } else if (field === 'orderedQuantity') {
        // Prevent negative values
        const val = Number(value);
        updated.orderedQuantity = val < 0 ? 0 : val;
      }

      // Re-calculate conversion
      const factor = (updated.orderedUnit === 'kg' || updated.orderedUnit === 'L') ? 1000 : 1;
      updated.convertedQuantity = updated.orderedQuantity * factor;
      updated.subtotal = updated.convertedQuantity * Number(updated.product.basePrice);

      return updated;
    }));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.success('Removed product from quotation');
  };

  // Clear quotation
  const clearQuotation = () => {
    setCart([]);
    toast.success('Quotation cleared');
  };

  // Calculate cart Grand Total
  const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Place order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your quotation is empty');
      return;
    }

    // Check for 0 quantities
    if (cart.some(item => item.orderedQuantity <= 0)) {
      toast.error('Please enter a valid quantity for all products');
      return;
    }

    const toastId = toast.loading('Placing order...');
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        orderedUnit: item.orderedUnit,
        orderedQuantity: item.orderedQuantity
      }));

      await API.post('/orders', { items });
      toast.success('Order placed successfully! Pending Approval.', { id: toastId });
      setCart([]); // Clear cart
      fetchData(); // Refresh product inventory stock numbers
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to place order';
      const detailErrors = error.response?.data?.errors;
      
      if (detailErrors && detailErrors.length > 0) {
        toast.error(detailErrors[0], { id: toastId }); // Show specific stock error
      } else {
        toast.error(errMsg, { id: toastId });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Product Search & Grid Panel */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Header Search and Filters */}
        <div className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search products by name, SKU..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 glass-input text-sm"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleCategoryChange('')}
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
                onClick={() => handleCategoryChange(cat)}
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

        {/* Product Cards Grid */}
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-slate-600" />
            <div>
              <p className="text-slate-300 font-bold">No products found</p>
              <p className="text-slate-500 text-xs mt-1">Try resetting the filters or modifying your query</p>
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
              className="mt-2 text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Reset Filters
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(product => {
              const basePriceNum = Number(product.basePrice);
              const friendlyRate = product.baseUnit === 'g' 
                ? `₹${(basePriceNum * 1000).toFixed(2)} per kg (₹${basePriceNum.toFixed(4)}/g)`
                : product.baseUnit === 'mL'
                ? `₹${(basePriceNum * 1000).toFixed(2)} per L (₹${basePriceNum.toFixed(4)}/mL)`
                : `₹${basePriceNum.toFixed(2)} per item`;

              const isOutOfStock = Number(product.stockQuantity) <= 0;

              return (
                <div 
                  key={product.id} 
                  className="glass-card glass-panel-hover p-5 flex flex-col relative group overflow-hidden"
                >
                  {/* Decorative glowing card accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-600/5 rounded-full blur-xl group-hover:bg-violet-600/10 transition-all"></div>

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-md text-white mt-1.5 group-hover:text-violet-200 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">SKU: {product.sku}</p>
                    </div>
                  </div>

                  <div className="my-3 border-t border-b border-slate-800/40 py-2.5 flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Rate:</span>
                      <span className="font-semibold text-slate-200">{friendlyRate}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Inventory Stock:</span>
                      <span className={`font-semibold ${isOutOfStock ? 'text-rose-400' : 'text-slate-200'}`}>
                        {isOutOfStock ? 'Out of Stock' : product.friendlyStock}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => addToQuotation(product)}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-2 mt-auto p-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-violet-600 hover:border-violet-500 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Quotation
                  </button>
                </div>
              );
            })}
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
      </div>

      {/* Quotation & Calculation Preview Desk */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="glass-card p-6 border-violet-500/20 shadow-xl relative overflow-hidden flex flex-col h-[calc(100vh-140px)] sticky top-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" />
              <h2 className="font-extrabold text-md text-white">Quotation Workspace</h2>
            </div>
            {cart.length > 0 && (
              <span className="text-[10px] bg-violet-600/20 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold">
                {cart.length} product{cart.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Quotation Items List */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <ShoppingCart className="h-10 w-10 text-slate-700 mb-2 animate-pulse" />
                <p className="text-slate-400 text-xs font-semibold">Your Quotation Desk is empty</p>
                <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Add products from the left to build a quotation, convert units, and place orders.</p>
              </div>
            ) : (
              cart.map(item => {
                const basePriceNum = Number(item.product.basePrice);
                const allowedUnits = getAllowedUnits(item.product.baseUnit);
                
                // Friendly rates for displays
                const displayRate = item.orderedUnit === 'kg' || item.orderedUnit === 'L'
                  ? basePriceNum * 1000
                  : basePriceNum;

                return (
                  <div key={item.product.id} className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl relative group">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <h4 className="font-bold text-xs text-white truncate max-w-[85%]">{item.product.name}</h4>
                    <p className="text-[9px] text-slate-500 font-mono">SKU: {item.product.sku}</p>

                    {/* Inputs & Conversions */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          value={item.orderedQuantity}
                          onChange={(e) => updateCartItem(item.product.id, 'orderedQuantity', e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500 mt-0.5"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Unit</label>
                        <select
                          value={item.orderedUnit}
                          onChange={(e) => updateCartItem(item.product.id, 'orderedUnit', e.target.value)}
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-violet-500 mt-0.5"
                        >
                          {allowedUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Math Preview (converted) */}
                    <div className="mt-3 bg-slate-950 border border-slate-900 p-3 rounded-xl flex flex-col gap-1.5 text-[10px] text-slate-400 font-medium font-mono relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-violet-600/5 rounded-full blur-sm"></div>
                      <div className="flex justify-between border-b border-slate-800/30 pb-1 text-slate-500 font-bold">
                        <span>CONVERSION RECEIPT</span>
                        <span className="text-violet-400">MATH LOG</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Input Quantity:</span>
                        <span className="text-slate-300 font-bold">{item.orderedQuantity} {item.orderedUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Multiplier:</span>
                        <span>1 {item.orderedUnit} = {item.orderedUnit === 'kg' || item.orderedUnit === 'L' ? '1,000' : '1'} {item.product.baseUnit}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/30 pb-1">
                        <span>Converted Stock:</span>
                        <span className="text-violet-300 font-bold">{item.orderedQuantity} × {item.orderedUnit === 'kg' || item.orderedUnit === 'L' ? '1,000' : '1'} = {item.convertedQuantity} {item.product.baseUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Rate:</span>
                        <span>₹{basePriceNum.toFixed(4)} / {item.product.baseUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unit Rate:</span>
                        <span>₹{displayRate.toFixed(2)} / {item.orderedUnit}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-800/60 pt-2 mt-1 text-xs">
                        <span className="text-slate-300 font-bold font-sans">Subtotal:</span>
                        <span className="text-emerald-400 font-extrabold font-sans">
                          {item.convertedQuantity} × ₹{basePriceNum.toFixed(4)} = ₹{item.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Grand Total */}
          {cart.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 shrink-0 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-300">
                <span>Grand Total:</span>
                <span className="text-lg text-emerald-400 font-extrabold bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-xl">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={clearQuotation}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear Desk
                </button>
                <button
                  onClick={handlePlaceOrder}
                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-500/15 hover:shadow-violet-500/25 transition-all duration-200"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Place Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
