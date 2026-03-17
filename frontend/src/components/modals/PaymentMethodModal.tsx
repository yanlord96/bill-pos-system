import { Banknote, QrCode, Building2, Smartphone } from "lucide-react";

const methods = [
  { value: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" },
  { value: "qris", label: "QRIS", icon: QrCode, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30" },
  { value: "bank_transfer", label: "Bank Transfer", icon: Building2, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
  { value: "e_wallet", label: "E-Wallet", icon: Smartphone, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30" },
];

interface Props {
  title?: string;
  onSelect: (method: string) => void;
  onClose: () => void;
}

export default function PaymentMethodModal({ title = "Select Payment Method", onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-transparent dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => onSelect(m.value)}
              className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all ${m.color}`}
            >
              <m.icon size={28} />
              <span className="text-sm font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  qris: "QRIS",
  bank_transfer: "Bank Transfer",
  e_wallet: "E-Wallet",
};
