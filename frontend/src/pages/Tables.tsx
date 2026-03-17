import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTables, createTable, updateTable, deleteTable } from "../api/tables";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const statusStyles: Record<string, string> = {
  available: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  occupied: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
  reserved: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
};

export default function Tables() {
  const queryClient = useQueryClient();
  const { data: tables, isLoading } = useQuery({ queryKey: ["tables"], queryFn: getTables });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ number: "", hourly_rate: "" });

  const createMut = useMutation({
    mutationFn: (d: { number: number; hourly_rate: number }) => createTable(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table created");
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table updated");
      resetForm();
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Table deleted");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ number: "", hourly_rate: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { number: parseInt(form.number), hourly_rate: parseFloat(form.hourly_rate) };
    if (editId) {
      updateMut.mutate({ id: editId, data });
    } else {
      createMut.mutate(data);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Tables</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Manage your billiard tables</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-600 text-sm font-medium shadow-sm"
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-6 shadow-sm">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Table Number</label>
              <input
                type="number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 w-32 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Hourly Rate (Rp)</label>
              <input
                type="number"
                step="1000"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 w-44 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
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

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Number</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hourly Rate</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables?.map((t) => (
              <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Table {t.number}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[t.status]}`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">Rp {Number(t.hourly_rate).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditId(t.id);
                        setForm({ number: String(t.number), hourly_rate: String(t.hourly_rate) });
                        setShowForm(true);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-primary-500"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this table?")) deleteMut.mutate(t.id);
                      }}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
