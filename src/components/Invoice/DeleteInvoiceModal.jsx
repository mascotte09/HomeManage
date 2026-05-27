export default function DeleteInvoiceModal({
  open,
  onClose,
  onConfirm,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

      <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">

        <h2 className="text-black font-bold text-lg mb-3">
          Delete Invoice
        </h2>

        <p className="text-gray-600 mb-6">
          Are you sure?
        </p>

        <div className="flex justify-end gap-2">

          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}