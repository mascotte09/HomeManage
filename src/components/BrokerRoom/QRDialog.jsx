import { useState } from "react";
import { FiX, FiShare2, FiDownload } from "react-icons/fi";

// ─── QR Dialog ───────────────────────────────────────────────────────────────
export default function QRDialog({ url, onClose }) {
    const [sharing, setSharing] = useState(false);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;

    // Vẽ QR + url lên canvas rồi trả về file ảnh (PNG)
    const buildImageFile = () =>
        new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const padding = 24;
                const qrSize = 240;
                const canvas = document.createElement("canvas");
                canvas.width = qrSize + padding * 2;
                canvas.height = qrSize + padding * 2 + 60;

                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(img, padding, padding, qrSize, qrSize);

                ctx.fillStyle = "#44403c"; // stone-700
                ctx.font = "14px sans-serif";
                ctx.textAlign = "center";

                // Wrap url nếu quá dài
                const maxWidth = canvas.width - padding * 2;
                const words = url.split(/([/:?&=])/);
                let line = "";
                let y = qrSize + padding * 2 + 20;
                const lines = [];
                for (const word of words) {
                    const testLine = line + word;
                    if (ctx.measureText(testLine).width > maxWidth && line) {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                }
                if (line) lines.push(line);
                lines.slice(0, 2).forEach((l, i) => {
                    ctx.fillText(l, canvas.width / 2, y + i * 18);
                });

                canvas.toBlob((blob) => {
                    if (!blob) return reject(new Error("Không tạo được ảnh"));
                    resolve(
                        new File([blob], "phong-trong-qr.png", { type: "image/png" })
                    );
                }, "image/png");
            };
            img.onerror = () => reject(new Error("Không tải được ảnh QR"));
            img.src = qrImageUrl;
        });

    const handleShare = async () => {
        try {
            setSharing(true);
            const file = await buildImageFile();

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Danh sách phòng trống",
                    text: "Quét QR để xem danh sách phòng trống",
                });
            } else {
                // Fallback: tải ảnh về máy nếu trình duyệt không hỗ trợ share file
                const link = document.createElement("a");
                link.href = URL.createObjectURL(file);
                link.download = file.name;
                link.click();
                URL.revokeObjectURL(link.href);
            }
        } catch (err) {
            if (err?.name !== "AbortError") {
                console.error(err);
                alert("Không thể chia sẻ ảnh, vui lòng thử lại.");
            }
        } finally {
            setSharing(false);
        }
    };

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

                <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-4 py-2.5 rounded-full transition"
                >
                    {navigator.canShare ? <FiShare2 size={16} /> : <FiDownload size={16} />}
                    {sharing
                        ? "Đang xử lý..."
                        : navigator.canShare
                            ? "Chia sẻ ảnh QR"
                            : "Tải ảnh QR"}
                </button>
            </div>
        </div>
    );
}