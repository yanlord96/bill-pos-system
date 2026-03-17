import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getClients, createClient } from "../../api/clients";
import { createSession } from "../../api/sessions";
import { BilliardTable, Client } from "../../types";
import { X, Search, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  table: BilliardTable;
  onClose: () => void;
}

export default function StartSessionModal({ table, onClose }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({ name: "", phone: "" });
  const [showNewClient, setShowNewClient] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ["clients", search],
    queryFn: () => getClients(search || undefined),
  });

  const createClientMut = useMutation({
    mutationFn: createClient,
    onSuccess: (client) => {
      setSelectedClient(client);
      setShowNewClient(false);
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created");
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const startSessionMut = useMutation({
    mutationFn: createSession,
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Session started");
      onClose();
      navigate(`/sessions/${session.id}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || "Error"),
  });

  const handleStart = () => {
    if (!selectedClient) {
      toast.error("Select a client first");
      return;
    }
    startSessionMut.mutate({
      table_id: table.id,
      client_id: selectedClient.id,
      session_type: "active",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-transparent dark:border-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Start Session</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Table {table.number} &middot; Rp {Number(table.hourly_rate).toLocaleString()}/hr</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Client Selection */}
        {selectedClient ? (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 p-4 rounded-xl mb-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                {selectedClient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedClient.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.phone}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Change
            </button>
          </div>
        ) : showNewClient ? (
          <div className="mb-5 space-y-3">
            <input
              type="text"
              placeholder="Name"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newClient.phone}
              onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
            />
            <div className="flex gap-2">
              <button
                onClick={() => createClientMut.mutate(newClient)}
                className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600"
              >
                Create Client
              </button>
              <button
                onClick={() => setShowNewClient(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" size={16} />
              <input
                type="text"
                placeholder="Search client by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-900/30"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {clients?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500 text-xs font-semibold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{c.phone}</p>
                  </div>
                </button>
              ))}
              {clients?.length === 0 && (
                <p className="px-4 py-6 text-sm text-gray-400 dark:text-gray-500 text-center">No clients found</p>
              )}
            </div>
            <button
              onClick={() => setShowNewClient(true)}
              className="mt-3 flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              <UserPlus size={14} /> New Client
            </button>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedClient || startSessionMut.isPending}
          className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 shadow-sm"
        >
          {startSessionMut.isPending ? "Starting..." : "Start Session"}
        </button>
      </div>
    </div>
  );
}
