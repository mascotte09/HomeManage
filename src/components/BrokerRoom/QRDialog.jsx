import { FiX } from "react-icons/fi";

// ─── QR Dialog ───────────────────────────────────────────────────────────────
export default function QRDialog({ url, onClose }) {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-5 w-full max-w-sm relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                >
                    <FiX size={18} />
                </button>

                <h3 className="text-base font-semibold text-stone-800 mb-4 text-center">
                    Chia sẻ danh sách phòng trống
                </h3>

                <div className="flex justify-center mb-4">
                    <img
                        src={qrImageUrl}
                        alt="QR code"
                        className="w-60 h-60 rounded-lg border border-stone-200"
                    />
                </div>

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 underline break-all"
                >
                    {url}
                </a>
            </div>
        </div>
    );
}