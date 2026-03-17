import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from "../api/menu";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { MenuCategory } from "../types";
import toast from "react-hot-toast";

const categoryTabs: { label: string; value: MenuCategory | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Food", value: "food" },
  { label: "Drink", value: "drink" },
];

export default function Menu() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<MenuCategory | undefined>();
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = useQuery({
    queryKey: ["menu", filter],
    queryFn: () => getMenuItems(filter),
  });

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", category: "food" as MenuCategory, price: "", is_available: true });

  const createMut = useMutation({
    mutationFn: (d: { name: string; category: MenuCategory; price: number; is_available: boolean }) =>
      createMenuItem(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item updated");
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      toast.success("Menu item deleted");
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) =>
      updateMenuItem(id, { is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", category: "food", price: "", is_available: true });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: form.name, category: form.category, price: parseFloat(form.price), is_available: form.is_available };
    if (editId) {
      updateMut.mutate({ id: editId, data });
    } else {
      createMut.mutate(data);
    }
  };

  const filteredItems = items?.filter((item) =>
    !search || item.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Menu</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Manage your food and drink items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-600 text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={18} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
          />
        </div>
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
          {categoryTabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setFilter(tab.value)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === tab.value
                  ? "border-primary-500 text-primary-500"
                  : "border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-6 shadow-sm">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 w-52 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
              >
                <option value="food">Food</option>
                <option value="drink">Drink</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Price (Rp)</label>
              <input
                type="number"
                step="500"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 w-36 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
                required
              />
            </div>
            <button type="submit" className="bg-emerald-500 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-600 text-sm font-medium">
              {editId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-4 py-2.5 text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredItems?.map((item) => (
          <div
            key={item.id}
            className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm transition-opacity ${!item.is_available ? "opacity-50" : ""}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{item.category}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditId(item.id);
                    setForm({
                      name: item.name,
                      category: item.category,
                      price: String(item.price),
                      is_available: item.is_available,
                    });
                    setShowForm(true);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary-500"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => { if (confirm("Delete?")) deleteMut.mutate(item.id); }}
                  className="w-8 h-8 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-xl font-bold text-primary-500 mb-3">Rp {Number(item.price).toLocaleString()}</p>
            <button
              onClick={() => toggleAvailability.mutate({ id: item.id, is_available: !item.is_available })}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                item.is_available
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                  : "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
              }`}
            >
              {item.is_available ? "Available" : "Unavailable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
