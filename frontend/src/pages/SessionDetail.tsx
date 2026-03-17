import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { getSession, endSession, cancelSession, activateSession } from "../api/sessions";
import SessionTimer from "../components/SessionTimer";
import PaymentMethodModal, { paymentMethodLabels } from "../components/modals/PaymentMethodModal";
import { ShoppingCart, StopCircle, Play, X, Clock, DollarSign, Receipt, ArrowLeft, Printer, CreditCard } from "lucide-react";
import { printSessionReceipt } from "../utils/receipt";
import toast from "react-hot-toast";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
  reserved: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  completed: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  cancelled: "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400",
};

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => getSession(Number(id)),
    refetchInterval: 3000,
  });

  const endMut = useMutation({
    mutationFn: (paymentMethod: string) => endSession(Number(id), paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Session ended");
      setShowPaymentModal(false);
    },
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelSession(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Reservation cancelled");
      navigate("/sessions");
    },
  });

  const activateMut = useMutation({
    mutationFn: () => activateSession(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", id] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast.success("Session started");
    },
  });

  if (isLoading || !session) return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;

  const orderTotal = session.orders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.subtotal), 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/sessions")}
          className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Table {session.table.number}
            </h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[session.status]}`}>
              {session.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-400 dark:text-gray-500">{session.client.name}</p>
            {session.payment_method && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center gap-1">
                <CreditCard size={12} />
                {paymentMethodLabels[session.payment_method] || session.payment_method}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {session.status === "completed" && (
            <button
              onClick={() => printSessionReceipt(session)}
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium"
            >
              <Printer size={16} /> Print Receipt
            </button>
          )}
          {session.status === "active" && (
            <>
              <button
                onClick={() => navigate(`/sessions/${id}/order`)}
                className="bg-primary-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-600 text-sm font-medium shadow-sm"
              >
                <ShoppingCart size={16} /> Add Order
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-red-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-600 text-sm font-medium shadow-sm"
              >
                <StopCircle size={16} /> End Session
              </button>
            </>
          )}
          {session.status === "reserved" && (
            <>
              <button
                onClick={() => activateMut.mutate()}
                className="bg-emerald-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-600 text-sm font-medium shadow-sm"
              >
                <Play size={16} /> Start Now
              </button>
              <button
                onClick={() => {
                  if (confirm("Cancel this reservation?")) cancelMut.mutate();
                }}
                className="bg-red-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-600 text-sm font-medium shadow-sm"
              >
                <X size={16} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
              <Clock size={18} className="text-primary-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Duration</p>
          </div>
          {session.status === "active" && session.start_time ? (
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <SessionTimer startTime={session.start_time} />
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {session.start_time && session.end_time
                ? formatDuration(session.start_time, session.end_time)
                : "-"}
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <DollarSign size={18} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Table Cost</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            Rp {Number(session.table_cost).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Rate: Rp {Number(session.table.hourly_rate).toLocaleString()}/hr
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Receipt size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500">Total</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Rp {Number(session.total_cost || orderTotal).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Orders: Rp {orderTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Orders */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders ({session.orders.length})</h3>
      {session.orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
          <p className="text-gray-400 dark:text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {session.orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-3">
                Order #{order.id} &middot; {new Date(order.created_at).toLocaleTimeString()}
              </p>
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <th className="text-left pb-3">Item</th>
                    <th className="text-center pb-3">Qty</th>
                    <th className="text-right pb-3">Price</th>
                    <th className="text-right pb-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-50 dark:border-gray-800">
                      <td className="py-3 text-gray-700 dark:text-gray-300">{item.menu_item.name}</td>
                      <td className="text-center py-3 text-gray-500 dark:text-gray-400">{item.quantity}</td>
                      <td className="text-right py-3 text-gray-500 dark:text-gray-400">Rp {Number(item.unit_price).toLocaleString()}</td>
                      <td className="text-right py-3 font-semibold text-gray-900 dark:text-white">
                        Rp {Number(item.subtotal).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showPaymentModal && (
        <PaymentMethodModal
          title="End Session — Select Payment"
          onSelect={(method) => endMut.mutate(method)}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${mins}m`;
}
