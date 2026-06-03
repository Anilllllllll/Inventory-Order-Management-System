import React, { useState, useEffect } from 'react';
import API from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  History, 
  Eye, 
  Calendar, 
  DollarSign, 
  Info,
  Clock,
  CheckCircle,
  XCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/orders', {
        params: { page, limit: 10 }
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white">Your Order Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track your quotations and placed inventory orders</p>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <History className="h-12 w-12 text-slate-600" />
          <div>
            <p className="text-slate-300 font-bold">No orders placed yet</p>
            <p className="text-slate-500 text-xs mt-1">Navigate to Products & Shop to build and submit your first order</p>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Placed Date</th>
                  <th className="p-4">Items Count</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="p-4 pl-6 font-mono text-xs text-slate-300">
                      #{order.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      {order.items?.length || 0}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold">
                      ₹{Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => viewOrderDetails(order.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-violet-600 hover:border-violet-500 hover:text-white transition-all text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
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

            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div>
                <h3 className="font-extrabold text-lg text-white">Order Details</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Order ID: #{selectedOrder.id}</p>
              </div>
              <div className="mr-8">{getStatusBadge(selectedOrder.status)}</div>
            </div>

            <div className="flex-1 space-y-6">
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

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-2.5 rounded-xl border border-slate-800 font-bold text-xs hover:bg-slate-900 hover:text-white transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
