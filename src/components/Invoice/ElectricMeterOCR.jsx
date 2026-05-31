
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";

export default function ElectricMeterOCR({
    onDetected,
}) {
    const [imageUrl, setImageUrl] = useState("");
    const fileInputRef = useRef(null);

    const imageContainerRef = useRef(null);

    const [showModal, setShowModal] =
        useState(false);

    const [selectedImage, setSelectedImage] =
        useState(null);

    const [ocrLoading, setOcrLoading] =
        useState(false);

    const [selection, setSelection] =
        useState(null);

    const [startPoint, setStartPoint] =
        useState(null);

    const [isDragging, setIsDragging] =
        useState(false);
    const [ocrResult, setOcrResult] =
        useState("");
    function handleSelectImage(e) {
        const file = e.target.files?.[0];
        // console.log("SELECT FILE", file);
        if (!file) return;

        setSelectedImage(file);

        setImageUrl(URL.createObjectURL(file));

        setSelection(null);
        setOcrResult("");

        setShowModal(true);
    }

    function handleMouseDown(e) {
        const rect =
            imageContainerRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setStartPoint({ x, y });

        setSelection({
            x,
            y,
            width: 0,
            height: 0,
        });

        setIsDragging(true);
    }

    function handleMouseMove(e) {
        if (!isDragging || !startPoint) return;

        const rect =
            imageContainerRef.current.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setSelection({
            x: Math.min(startPoint.x, x),
            y: Math.min(startPoint.y, y),
            width: Math.abs(x - startPoint.x),
            height: Math.abs(y - startPoint.y),
        });
    }

    function handleMouseUp() {
        setIsDragging(false);
    }
    function handleResetSelection() {
        setSelection(null);
        setOcrResult("");
    }
    function handleUseResult() {
        if (!ocrResult) return;

        onDetected?.(ocrResult);

        closeModal();
    }
    async function handleReadOCR() {
        if (!selectedImage || !selection) {
            alert("Hãy khoanh vùng số điện");
            return;
        }

        try {
            setOcrLoading(true);

            const img =
                document.getElementById(
                    "meter-image"
                );

            const canvas =
                document.createElement("canvas");

            const ctx =
                canvas.getContext("2d");

            const scaleX =
                img.naturalWidth / img.clientWidth;

            const scaleY =
                img.naturalHeight / img.clientHeight;

            canvas.width =
                selection.width * scaleX;

            canvas.height =
                selection.height * scaleY;

            ctx.drawImage(
                img,
                selection.x * scaleX,
                selection.y * scaleY,
                selection.width * scaleX,
                selection.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const {
                data: { text },
            } = await Tesseract.recognize(
                canvas,
                "eng",
                {
                    tessedit_char_whitelist:
                        "0123456789",
                }
            );

            const numbers =
                text.match(/\d+/g) || [];

            if (numbers.length === 0) {
                alert("Không đọc được số.");
                return;
            }

            const meterNumber =
                numbers.sort(
                    (a, b) => b.length - a.length
                )[0];

            setOcrResult(meterNumber);
        } catch (err) {
            console.error(err);
            alert("Lỗi OCR");
        } finally {
            setOcrLoading(false);
        }
    }
    function closeModal() {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }

        setShowModal(false);

        setSelection(null);
        setOcrResult("");

        setSelectedImage(null);
        setImageUrl("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    return (
        <>
            <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleSelectImage}
            />

            <button
                type="button"
                onClick={() =>
                    fileInputRef.current?.click()
                }
                className="mt-2 bg-green-600 text-white px-3 py-2 rounded"
            >
                Đọc đồng hồ điện
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">

                    <div className="bg-white w-[90vw] h-[90vh] p-4 rounded-lg flex flex-col">

                        <div className="flex justify-end gap-2 mb-3">

                            <button
                                onClick={() =>
                                    setShowModal(false)
                                }
                                className="bg-gray-500 text-white px-3 py-2 rounded"
                            >
                                Đóng
                            </button>

                            <button
                                onClick={handleReadOCR}
                                disabled={ocrLoading}
                                className="bg-green-600 text-white px-3 py-2 rounded"
                            >
                                {ocrLoading
                                    ? "Đang đọc..."
                                    : "Đọc số"}
                            </button>
                            <button
                                onClick={handleResetSelection}
                                className="bg-yellow-500 text-white px-3 py-2 rounded"
                            >
                                Chọn lại vùng
                            </button>
                            <button
                                onClick={handleUseResult}
                                disabled={!ocrResult}
                                className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                            >
                                Dùng kết quả
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-gray-500 text-white px-3 py-2 rounded"
                            >
                                Đóng
                            </button>
                        </div>

                        <div
                            ref={imageContainerRef}
                            className="flex-1 overflow-auto relative border"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            <img
                                id="meter-image"
                                src={imageUrl}
                                alt=""
                            />

                            {selection && (
                                <div
                                    className="absolute border-2 border-red-500 bg-red-500/20"
                                    style={{
                                        left: selection.x,
                                        top: selection.y,
                                        width: selection.width,
                                        height: selection.height,
                                    }}
                                />
                            )}
                        </div>
                        {ocrResult && (
                            <div className="mt-3 p-3 border rounded bg-green-50">
                                <div className="font-semibold">
                                    Kết quả OCR
                                </div>

                                <div className="text-3xl font-bold text-green-700">
                                    {ocrResult}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

            )}

        </>
    );
}