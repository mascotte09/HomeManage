
import { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import {
    TransformWrapper,
    TransformComponent,
} from "react-zoom-pan-pinch";

export default function ElectricMeterOCR({
    onDetected,
}) {
    const imageRef = useRef(null);
    const imageWrapperRef = useRef(null);

    const startRef = useRef(null);
    const [drawMode, setDrawMode] = useState(false);

    const [imageUrl, setImageUrl] = useState("");
    const fileInputRef = useRef(null);
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
    // const draggingRef = useRef(false);
    // const startPointRef = useRef(null);

    function getImagePoint(e) {
        const img = imageRef.current;

        if (!img) return null;

        const rect =
            img.getBoundingClientRect();

        return {
            x:
                ((e.clientX - rect.left) *
                    img.naturalWidth) /
                rect.width,

            y:
                ((e.clientY - rect.top) *
                    img.naturalHeight) /
                rect.height,
        };
    }
    function handlePointerDown(e) {
        if (!drawMode) return;

        e.stopPropagation();

        const point =
            getImagePoint(e);

        startRef.current = point;

        const box =
            selectionBoxRef.current;

        box.style.display = "block";
    }
    function handlePointerMove(e) {
        if (
            !drawMode ||
            !startRef.current
        )
            return;

        const point =
            getImagePoint(e);

        const start =
            startRef.current;

        const rect = {
            x: Math.min(
                start.x,
                point.x
            ),
            y: Math.min(
                start.y,
                point.y
            ),
            width: Math.abs(
                point.x - start.x
            ),
            height: Math.abs(
                point.y - start.y
            ),
        };

        selectionRef.current = rect;

        const img =
            imageRef.current;

        const box =
            selectionBoxRef.current;

        box.style.left =
            `${(rect.x /
                img.naturalWidth) *
            img.width}px`;

        box.style.top =
            `${(rect.y /
                img.naturalHeight) *
            img.height}px`;

        box.style.width =
            `${(rect.width /
                img.naturalWidth) *
            img.width}px`;

        box.style.height =
            `${(rect.height /
                img.naturalHeight) *
            img.height}px`;
    }
    function handlePointerUp() {
        if (selectionRef.current) {
            setSelection({
                ...selectionRef.current,
            });
        }

        startRef.current = null;
    }
    async function handleReadOCR() {
        if (!selectedImage || !selection) {
            alert("Hãy khoanh vùng số điện");
            return;
        }

        try {
            setOcrLoading(true);

            const img =
                imageRef.current;

            if (!img) {
                alert("Không tìm thấy ảnh");
                return;
            }

            const canvas =
                document.createElement(
                    "canvas"
                );

            const ctx =
                canvas.getContext("2d");

            const sx = Math.round(
                selection.x
            );

            const sy = Math.round(
                selection.y
            );

            const sw = Math.round(
                selection.width
            );

            const sh = Math.round(
                selection.height
            );

            canvas.width = sw;
            canvas.height = sh;

            ctx.drawImage(
                img,
                sx,
                sy,
                sw,
                sh,
                0,
                0,
                sw,
                sh
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

            if (
                numbers.length === 0
            ) {
                alert(
                    "Không đọc được số điện"
                );
                return;
            }

            const meterNumber =
                numbers.sort(
                    (a, b) =>
                        b.length - a.length
                )[0];

            setOcrResult(
                meterNumber
            );
        } catch (err) {
            console.error(err);

            alert(
                "Lỗi OCR: " +
                err.message
            );
        } finally {
            setOcrLoading(false);
        }
    }
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
    function handleUseResult() {
        if (!ocrResult) return;

        onDetected?.(ocrResult);

        closeModal();
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
                                    setDrawMode(
                                        (prev) => !prev
                                    )
                                }
                                className="
                                    bg-purple-600
                                    text-white
                                    px-3
                                    py-2
                                    rounded
                                "
                            >
                                {drawMode
                                    ? "Đang chọn vùng"
                                    : "Bật chọn vùng"}
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

                        <TransformWrapper
                            minScale={1}
                            maxScale={8}
                            wheel={{
                                smoothStep: 0.1,
                            }}
                            pinch={{
                                step: 5,
                            }}
                            panning={{
                                disabled: drawMode,
                            }}
                            doubleClick={{
                                disabled: true,
                            }}
                        >
                            <TransformComponent
                                wrapperClass="w-full h-full"
                            >
                                <div
                                    ref={imageWrapperRef}
                                    className="relative inline-block"
                                    onPointerDown={
                                        drawMode
                                            ? handlePointerDown
                                            : undefined
                                    }
                                    onPointerMove={
                                        drawMode
                                            ? handlePointerMove
                                            : undefined
                                    }
                                    onPointerUp={
                                        drawMode
                                            ? handlePointerUp
                                            : undefined
                                    }
                                >
                                    <img
                                        ref={imageRef}
                                        id="meter-image"
                                        src={imageUrl}
                                        alt=""
                                        draggable={false}
                                        className="
        block
        select-none
        max-w-full
        h-auto
    "
                                    />

                                    <div
                                        ref={selectionBoxRef}
                                        className="
            absolute
            hidden
            border-2
            border-red-500
            bg-red-500/20
            pointer-events-none
        "
                                    />
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
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