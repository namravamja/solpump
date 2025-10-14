"use client";


interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}: ConfirmationModalProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "⚠️",
          confirmBg: "bg-red-600 hover:bg-red-500",
          confirmShadow: "hover:shadow-red-500/25",
          border: "border-red-500/30",
        };
      case "warning":
        return {
          icon: "⚠️",
          confirmBg: "bg-yellow-600 hover:bg-yellow-500",
          confirmShadow: "hover:shadow-yellow-500/25",
          border: "border-yellow-500/30",
        };
      default:
        return {
          icon: "ℹ️",
          confirmBg: "bg-blue-600 hover:bg-blue-500",
          confirmShadow: "hover:shadow-blue-500/25",
          border: "border-blue-500/30",
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className={`relative w-full max-w-md bg-gradient-to-br from-gray-900 via-gray-800 to-black border ${styles.border} rounded-2xl shadow-2xl backdrop-blur-sm`}
        >
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">{styles.icon}</div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 ${styles.confirmBg} text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${styles.confirmShadow} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
