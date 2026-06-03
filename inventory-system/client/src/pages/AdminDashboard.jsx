import React, { useState, useEffect } from 'react';
import API from '../services/api.js';
import toast from 'react-hot-toast';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Clock, 
  Calendar,
  ShieldCheck,
  ShoppingCart,
  Users,
  Eye,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Sales Revenue',
      value: `₹${Number(stats?.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Sum of approved order invoices'
    },
    {
      title: 'Total Products SKU',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      description: 'Active items in database'
    },
    {
      title: 'Pending Approvals',
      value: stats?.orderStats?.Pending || 0,
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Orders awaiting admin confirmation'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 
        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse' 
        : 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      description: 'Items below warning thresholds'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-violet-400" />
          Admin Command Center
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time overview of shop transactions, stock alerts, and orders</p>
      </div>

      {/* KPI Stats Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-6 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <div className={`p-2 rounded-xl border ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{card.value}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1.5">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Low Stock Indicators Table */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="glass-card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Low Stock Warning Desk</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Thresholds: Weight &lt; 10kg, Volume &lt; 10L, Count &lt; 10</p>
              </div>
              <Link 
                to="/admin/products" 
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
              >
                Refill Stock
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-1">
              {stats?.lowStockProducts?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <Package className="h-10 w-10 text-emerald-500/20 mb-2" />
                  <p className="text-xs font-bold text-emerald-400">All items fully stocked</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">No products fall below low stock limits</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-800 pb-2">
                      <th className="py-2">Product</th>
                      <th className="py-2">Category</th>
                      <th className="py-2 text-right">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    {stats?.lowStockProducts?.map(prod => (
                      <tr key={prod.id} className="hover:bg-slate-900/10">
                        <td className="py-3">
                          <p className="font-bold text-white">{prod.name}</p>
                          <p className="font-mono text-[9px] text-slate-500 mt-0.5">SKU: {prod.sku}</p>
                        </td>
                        <td className="py-3 text-slate-400">{prod.category}</td>
                        <td className="py-3 text-right text-rose-400 font-extrabold">{prod.friendlyStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders log */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="glass-card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Recent Shop activity</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Latest 5 orders placed across the system</p>
              </div>
              <Link 
                to="/admin/orders" 
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-0.5"
              >
                All Orders
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[300px]">
              {stats?.recentOrders?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <ShoppingCart className="h-10 w-10 text-slate-700 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No orders logged</p>
                </div>
              ) : (
                stats?.recentOrders?.map(order => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  const statusColor = order.status === 'Approved' 
                    ? 'text-emerald-400 bg-emerald-500/10' 
                    : order.status === 'Rejected' 
                    ? 'text-rose-400 bg-rose-500/10' 
                    : 'text-amber-400 bg-amber-500/10';

                  return (
                    <div key={order.id} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-xs text-white">#{order.id.slice(0, 8)}...</p>
                          <span className={`text-[9px] font-bold px-1.5 rounded ${statusColor}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">By: {order.user.name} ({order.user.email})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xs text-emerald-400">₹{Number(order.totalAmount).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dateStr}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
