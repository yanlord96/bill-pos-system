import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllOrders } from "../api/orders";
import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { printOrderReceipt } from "../utils/receipt";

type FilterType = "all" | "standalone" | "session";

const tabs: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Walk-in", value: "standalone" },
  { label: "Session", value: "session" },
];

export default function Orders() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const standaloneParam = filter === "standalone" ? true : filter === "session" ? false : undefined;

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", filter],
    queryFn: () => getAllOrders(standaloneParam),
    refetchInterval: 5000,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Orders</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">All orders including walk-in and session orders</p>
        </div>
        <button
          onClick={() => navigate("/orders/new")}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-600 text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              filter === tab.value
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders?.map((order) => {
          const total = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
          const isExpanded = expandedId === order.id;

          return (
            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Order Header Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-gray-900 dark:text-white">#{order.id}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {order.customer_name || (order.session_id ? `Session #${order.session_id}` : "Walk-in")}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    order.session_id ? "bg-primary-50 dark:bg-primary-900/20 text-primary-500" : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  }`}>
                    {order.session_id ? "Session" : "Walk-in"}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Rp {total.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t border-gray-50 dark:border-gray-800">
                  <table className="w-full mt-3">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Price</th>
                        <th className="text-right pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-50 dark:border-gray-800">
                          <td className="py-2.5 text-gray-700 dark:text-gray-300">{item.menu_item.name}</td>
                          <td className="text-center py-2.5 text-gray-500 dark:text-gray-400">{item.quantity}</td>
                          <td className="text-right py-2.5 text-gray-500 dark:text-gray-400">Rp {Number(item.unit_price).toLocaleString()}</td>
                          <td className="text-right py-2.5 font-semibold text-gray-900 dark:text-white">Rp {Number(item.subtotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-100 dark:border-gray-800">
                        <td colSpan={3} className="py-3 text-right font-semibold text-gray-500 dark:text-gray-400">Total</td>
                        <td className="py-3 text-right font-bold text-gray-900 dark:text-white">Rp {total.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); printOrderReceipt(order); }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Printer size={14} /> Print Receipt
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {orders?.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
            <p className="text-gray-400 dark:text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
