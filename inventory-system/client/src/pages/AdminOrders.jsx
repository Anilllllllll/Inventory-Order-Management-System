import React, { useState, useEffect } from 'react';
import API from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  ShoppingCart, 
  Eye, 
  Calendar, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Users,
  Info,
  ChevronDown
} from 'lucide-react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // '', Pending, Approved, Rejected
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders', {
        params: { 
          page, 
          limit: 10,
          status: statusFilter
        }
      });
      // Filter locally since DB fetches all for admin, but we can filter or let the backend do it.
      // Wait, let's filter locally if backend doesn't support status query, or add it to backend orders query.
      // Ah! In backend getOrders, we did:
      // const where = {};
      // if (req.user.role !== 'ADMIN') { where.userId = req.user.id; }
      // We can easily filter the orders array locally or modify backend to support status. Filtering locally is very easy and fast.
      let fetchedOrders = res.data.orders;
      if (statusFilter) {
        fetchedOrders = fetchedOrders.filter(o => o.status === statusFilter);
      }
      setOrders(fetchedOrders);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const viewOrderDetails = async (orderId) => {
    setModalLoading(true);
    try {
      const res = await API.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const actionText = newStatus === 'Approved' ? 'Approving order...' : 'Rejecting order...';
    const toastId = toast.loading(actionText);
    
    try {
      await API.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order is now ${newStatus}`, { id: toastId });
      
      // Update local state if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      fetchOrders(); // Refresh table list
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to update order status';
      toast.error(errMsg, { id: toastId });
    }
  };

  // Helper for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="flex items-center gap-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
            <CheckCircle className="h-3.5 w-3.5" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full font-bold">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Order Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Approve, reject, or inspect orders placed by sales agents</p>
        </div>

        {/* Status Filter tabs */}
        <div className="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          {[
            { label: 'All Orders', value: '' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <ShoppingCart className="h-12 w-12 text-slate-600" />
          <div>
            <p className="text-slate-300 font-bold">No orders found</p>
            <p className="text-slate-500 text-xs mt-1">There are no orders matching your status filter</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Placed By</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items count</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/10 transition-all">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-300">
                      #{order.id.slice(0, 8)}...
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded bg-slate-800 flex items-center justify-center text-violet-400 text-xs font-bold">
                          {order.user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{order.user.name}</p>
                          <p className="text-[10px] text-slate-500">{order.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-xs flex items-center gap-1.5 mt-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-slate-300 font-semibold">{order.items?.length || 0}</td>
                    <td className="p-4 text-emerald-400 font-bold">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => viewOrderDetails(order.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-violet-600 hover:border-violet-500 hover:text-white transition-all text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Manage
                      </button>
                      
                      {order.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Approved')}
                            className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                            title="Approve Order"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Rejected')}
                            className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                            title="Reject Order"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl glass-card relative p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Inspect Order Desk</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Order ID: #{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-4 mt-2 md:mt-0">
                <div className="mr-8">{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              {/* Placement metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Placed By Agent</h4>
                  <p className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-violet-400" />
                    {selectedOrder.user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium ml-5">{selectedOrder.user.email}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Order Date & Time</h4>
                  <p className="text-xs font-bold text-slate-300 mt-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {new Date(selectedOrder.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800/60 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="p-3 pl-4">Product</th>
                      <th className="p-3">Ordered Qty</th>
                      <th className="p-3">Converted Qty</th>
                      <th className="p-3">Rate (Base Unit)</th>
                      <th className="p-3 pr-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-sm">
                    {selectedOrder.items.map((item) => {
                      const displayBasePrice = Number(item.unitPrice);
                      const conversionRateText = item.orderedUnit === 'kg' || item.orderedUnit === 'L'
                        ? `₹${(displayBasePrice * 1000).toFixed(2)} / ${item.orderedUnit} (₹${displayBasePrice.toFixed(4)}/${item.product.baseUnit})`
                        : `₹${displayBasePrice.toFixed(2)} / ${item.orderedUnit}`;

                      return (
                        <tr key={item.id} className="hover:bg-slate-900/10">
                          <td className="p-3 pl-4">
                            <p className="font-bold text-white text-xs">{item.product.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">SKU: {item.product.sku}</p>
                            {item.formulaBreakdown && (
                              <p className="text-[9px] text-violet-400 font-mono mt-1.5 bg-violet-950/20 p-1 px-2 border border-violet-950 rounded max-w-fit">
                                {item.formulaBreakdown}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-slate-300 font-medium">
                            {item.orderedQuantity} {item.orderedUnit}
                          </td>
                          <td className="p-3 text-violet-300 font-semibold text-xs">
                            {item.friendlyConverted}
                          </td>
                          <td className="p-3 text-slate-400 text-xs">
                            {conversionRateText}
                          </td>
                          <td className="p-3 pr-4 text-right text-emerald-400 font-bold">
                            ₹{Number(item.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation breakdown */}
              <div className="flex justify-end">
                <div className="w-full md:w-80 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Products count:</span>
                    <span className="font-bold text-slate-200">{selectedOrder.items.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping:</span>
                    <span className="text-emerald-400 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-t border-slate-800/40 pt-2 mt-1">
                    <span className="text-sm font-bold text-white">Grand Total:</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      ₹{Number(selectedOrder.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Controls */}
            <div className="flex gap-4 mt-8 pt-4 border-t border-slate-800/80">
              {selectedOrder.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Rejected')}
                    className="w-1/2 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all flex items-center justify-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    Reject Order
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Approved')}
                    className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Approve Order
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-800 font-bold text-xs hover:bg-slate-900 hover:text-white transition-all"
                >
                  Close inspector
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
