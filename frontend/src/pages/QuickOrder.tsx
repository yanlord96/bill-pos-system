import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getMenuItems } from "../api/menu";
import { createOrder } from "../api/orders";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, ArrowLeft, Search } from "lucide-react";
import PaymentMethodModal from "../components/modals/PaymentMethodModal";
import toast from "react-hot-toast";
import { MenuCategory } from "../types";

const categoryTabs: { label: string; value: MenuCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Food", value: "food" },
  { label: "Drink", value: "drink" },
];

export default function QuickOrder() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<MenuCategory | undefined>();
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: menuItems } = useQuery({
    queryKey: ["menu"],
    queryFn: () => getMenuItems(),
  });

  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully");
      navigate("/orders");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const setQty = (itemId: number, qty: number) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemId];
      } else {
        next[itemId] = qty;
      }
      return next;
    });
  };

  const items = Object.entries(quantities)
    .filter(([, qty]) => qty > 0)
    .map(([menuItemId, quantity]) => ({
      menu_item_id: Number(menuItemId),
      quantity,
    }));

  const total = items.reduce((sum, item) => {
    const menuItem = menuItems?.find((m) => m.id === item.menu_item_id);
    return sum + (menuItem ? Number(menuItem.price) * item.quantity : 0);
  }, 0);

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSelect = (method: string) => {
    mutation.mutate({
      customer_name: customerName.trim() || null,
      payment_method: method,
      items,
    });
    setShowPaymentModal(false);
  };

  const availableItems = (menuItems?.filter((m) => m.is_available) ?? []).filter((m) => {
    const matchCategory = !categoryFilter || m.category === categoryFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/orders")}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Order</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Walk-in order without table session</p>
        </div>
      </div>

      {/* Customer Name (optional) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm mb-6">
        <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
          Customer Name (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. John"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 w-full max-w-sm text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
        />
      </div>

      {/* Search + Category Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={18} />
          <input
            type="text"
            placeholder="Search menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
          />
        </div>
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          {categoryTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setCategoryFilter(tab.value)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                categoryFilter === tab.value
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-4">
        {availableItems.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{item.category}</span>
              </div>
            </div>
            <p className="text-lg font-bold text-primary-500 mb-4">
              Rp {Number(item.price).toLocaleString()}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(item.id, (quantities[item.id] || 0) - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <Minus size={14} />
                </button>
                <span className="font-semibold w-8 text-center text-gray-900 dark:text-white">{quantities[item.id] || 0}</span>
                <button
                  onClick={() => setQty(item.id, (quantities[item.id] || 0) + 1)}
                  className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600"
                >
                  <Plus size={14} />
                </button>
              </div>
              {(quantities[item.id] || 0) > 0 && (
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Rp {(Number(item.price) * (quantities[item.id] || 0)).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-[280px] right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div>
          <span className="text-sm text-gray-400 dark:text-gray-500">Total</span>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            Rp {total.toLocaleString()}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">({items.length} items)</span>
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || mutation.isPending}
          className="bg-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-600 disabled:opacity-50 font-medium shadow-sm"
        >
          <ShoppingCart size={18} />
          {mutation.isPending ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {showPaymentModal && (
        <PaymentMethodModal
          title="Select Payment Method"
          onSelect={handlePaymentSelect}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
