
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";


export default function ElectricMeterOCR({
    onDetected,
}) {
    const [imageUrl, setImageUrl] = useState("");
    const fileInputRef = useRef(null);
    const imageContainerRef = useRef(null);
    const selectionRef = useRef(null);
    const selectionBoxRef = useRef(null);
    const [showModal, setShowModal] =
        useState(false);

    const [selectedImage, setSelectedImage] =
        useState(null);

    const [ocrLoading, setOcrLoading] =
        useState(false);

    const [selection, setSelection] =
        useState(null);

   
    const [ocrResult, setOcrResult] =
        useState("");
    const draggingRef = useRef(false);
    const startPointRef = useRef(null);
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
    
    function getPointerPosition(e) {
        const container = imageContainerRef.current;

        const rect = container.getBoundingClientRect();

        return {
            x:
                e.clientX -
                rect.left +
                container.scrollLeft,

            y:
                e.clientY -
                rect.top +
                container.scrollTop,
        };
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
    function updateSelection(x, y) {
        const start = startPointRef.current;
        if (!start) return;

        const box = {
            x: Math.min(start.x, x),
            y: Math.min(start.y, y),
            width: Math.abs(x - start.x),
            height: Math.abs(y - start.y),
        };

        selectionRef.current = box;

        if (selectionBoxRef.current) {
            selectionBoxRef.current.style.left =
                `${box.x}px`;

            selectionBoxRef.current.style.top =
                `${box.y}px`;

            selectionBoxRef.current.style.width =
                `${box.width}px`;

            selectionBoxRef.current.style.height =
                `${box.height}px`;
        }
    }
    function handlePointerDown(e) {
        const { x, y } =
            getPointerPosition(e);

        startPointRef.current = { x, y };
        draggingRef.current = true;

        if (selectionBoxRef.current) {
            selectionBoxRef.current.style.display =
                "block";

            selectionBoxRef.current.style.left =
                `${x}px`;

            selectionBoxRef.current.style.top =
                `${y}px`;

            selectionBoxRef.current.style.width =
                "0px";

            selectionBoxRef.current.style.height =
                "0px";
        }
    }
    function handlePointerMove(e) {
        if (!draggingRef.current) return;

        const { x, y } =
            getPointerPosition(e);

        updateSelection(x, y);
    }
    function handlePointerUp() {
        draggingRef.current = false;

        setSelection(selectionRef.current);
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

            const rect =
                img.getBoundingClientRect();

            const scaleX =
                img.naturalWidth / rect.width;

            const scaleY =
                img.naturalHeight / rect.height;

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
                    tessedit_pageseg_mode: "8",
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
                                Chọn lại
                            </button>
                            <button
                                onClick={handleUseResult}
                                disabled={!ocrResult}
                                className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50"
                            >
                                Chấp nhận
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
                            className="
                                flex-1
                                overflow-auto
                                relative
                                border
                            "
                            style={{
                                touchAction: "none",
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                        >
                            <div
                                className="relative inline-block"
                            >
                                <img
                                    id="meter-image"
                                    src={imageUrl}
                                    alt=""
                                    className="
                                        block
                                        max-w-full
                                        h-auto
                                        select-none
                                    "
                                    draggable={false}
                                />
                                <div
                                    ref={selectionBoxRef}
                                    className="
                                        absolute
                                        border-2
                                        border-red-500
                                        bg-red-500/20
                                        pointer-events-none
                                        hidden
                                    "
                                />

                            </div>
                        </div>
                        <div className="mt-3 p-3 border rounded bg-green-50">
                            <label className="block font-semibold mb-2">
                                Kết quả OCR (có thể sửa)
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                value={ocrResult}
                                onChange={(e) =>
                                    setOcrResult(
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                className="w-full border rounded
                                        px-3
                                        py-2
                                        text-3xl
                                        font-bold
                                        text-green-700
                                    "
                            />
                        </div>

                    </div>

                </div>

            )}

        </>
    );
}