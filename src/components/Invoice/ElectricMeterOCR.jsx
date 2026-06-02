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
    const viewportRef = useRef(null);
    const fileInputRef = useRef(null);



    const [showModal, setShowModal] =
        useState(false);

    const [selectedImage, setSelectedImage] =
        useState(null);

    const [imageUrl, setImageUrl] =
        useState("");

    const [ocrLoading, setOcrLoading] =
        useState(false);

    const [ocrResult, setOcrResult] =
        useState("");

    const FRAME_WIDTH = 200;
    const FRAME_HEIGHT = 50;

    function handleSelectImage(e) {
        const file = e.target.files?.[0];

        if (!file) return;

        setSelectedImage(file);

        const url =
            URL.createObjectURL(file);

        setImageUrl(url);

        setOcrResult("");

        setShowModal(true);
    }

    async function handleReadOCR() {
        try {
            if (!selectedImage) {
                alert("Chưa chọn ảnh");
                return;
            }

            const img =
                imageRef.current;

            const viewport =
                viewportRef.current;

            if (!img || !viewport) {
                alert(
                    "Không tìm thấy ảnh"
                );
                return;
            }

            setOcrLoading(true);

            const imgRect =
                img.getBoundingClientRect();

            const viewportRect =
                viewport.getBoundingClientRect();

            const frameLeft =
                viewportRect.left +
                viewportRect.width / 2 -
                FRAME_WIDTH / 2;

            const frameTop =
                viewportRect.top +
                viewportRect.height / 2 -
                FRAME_HEIGHT / 2;

            let cropX =
                ((frameLeft - imgRect.left) *
                    img.naturalWidth) /
                imgRect.width;

            let cropY =
                ((frameTop - imgRect.top) *
                    img.naturalHeight) /
                imgRect.height;

            let cropW =
                (FRAME_WIDTH *
                    img.naturalWidth) /
                imgRect.width;

            let cropH =
                (FRAME_HEIGHT *
                    img.naturalHeight) /
                imgRect.height;

            cropX = Math.max(0, cropX);
            cropY = Math.max(0, cropY);

            cropW = Math.min(
                cropW,
                img.naturalWidth - cropX
            );

            cropH = Math.min(
                cropH,
                img.naturalHeight - cropY
            );

            const canvas =
                document.createElement(
                    "canvas"
                );

            canvas.width =
                Math.round(cropW);

            canvas.height =
                Math.round(cropH);

            const ctx =
                canvas.getContext("2d");

            ctx.drawImage(
                img,
                cropX,
                cropY,
                cropW,
                cropH,
                0,
                0,
                cropW,
                cropH
            );

            const {
                data: { text },
            } =
                await Tesseract.recognize(
                    canvas,
                    "eng",
                    {
                        tessedit_char_whitelist:
                            "0123456789",
                    }
                );

            const numbers =
                text.match(/\d+/g) ||
                [];

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
                        b.length -
                        a.length
                )[0];

            setOcrResult(
                meterNumber
            );
        } catch (err) {
            console.error(err);

            alert(
                "OCR Error: " +
                err.message
            );
        } finally {
            setOcrLoading(false);
        }
    }

    function handleUseResult() {
        if (!ocrResult) return;

        onDetected?.(ocrResult);

        closeModal();
    }

    function closeModal() {
        if (imageUrl) {
            URL.revokeObjectURL(
                imageUrl
            );
        }

        setShowModal(false);
        setSelectedImage(null);
        setImageUrl("");
        setOcrResult("");

        if (fileInputRef.current) {
            fileInputRef.current.value =
                "";
        }
    }

    return (
        <>
            <input
                hidden
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={
                    handleSelectImage
                }
            />

            <button
                type="button"
                onClick={() =>
                    fileInputRef.current?.click()
                }
                className="
                    mt-2
                    bg-green-600
                    text-white
                    px-3
                    py-2
                    rounded
                "
            >
                Đọc đồng hồ điện
            </button>

            {showModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-50
                        bg-black/70
                        flex
                        items-center
                        justify-center
                    "
                >
                    <div
                        className="
                            bg-white
                            w-[95vw]
                            h-[95vh]
                            rounded-lg
                            p-4
                            flex
                            flex-col
                        "
                    >
                        <div
                            className="
                                flex
                                justify-end
                                gap-2
                                mb-3
                            "
                        >
                            <button
                                onClick={
                                    handleReadOCR
                                }
                                disabled={
                                    ocrLoading
                                }
                                className="
                                    bg-green-600
                                    text-white
                                    px-3
                                    py-2
                                    rounded
                                "
                            >
                                {ocrLoading
                                    ? "Đang đọc..."
                                    : "Đọc số"}
                            </button>

                            <button
                                onClick={
                                    handleUseResult
                                }
                                disabled={
                                    !ocrResult
                                }
                                className="
                                    bg-blue-600
                                    text-white
                                    px-3
                                    py-2
                                    rounded
                                    disabled:opacity-50
                                "
                            >
                                Chấp nhận
                            </button>

                            <button
                                onClick={
                                    closeModal
                                }
                                className="
                                    bg-gray-500
                                    text-white
                                    px-3
                                    py-2
                                    rounded
                                "
                            >
                                Đóng
                            </button>
                        </div>

                        <div
                            ref={
                                viewportRef
                            }
                            className="
                                relative
                                flex-1
                                overflow-hidden
                            "
                        >
                            <TransformWrapper
                                minScale={
                                    1
                                }
                                maxScale={
                                    10
                                }

                            >
                                <TransformComponent
                                    wrapperClass="w-full h-full"
                                >
                                    <img
                                        ref={
                                            imageRef
                                        }
                                        src={
                                            imageUrl
                                        }
                                        alt=""
                                        draggable={
                                            false
                                        }
                                        className="
                                            block
                                            max-w-full
                                            h-auto
                                            select-none
                                        "
                                    />
                                </TransformComponent>
                            </TransformWrapper>

                            <div
                                className="
                                    absolute
                                    border-2
                                    border-red-500
                                    bg-red-500/10
                                    pointer-events-none
                                    z-50
                                "
                                style={{
                                    width: FRAME_WIDTH,
                                    height: FRAME_HEIGHT,
                                    left: "50%",
                                    top: "50%",
                                    transform:
                                        "translate(-50%, -50%)",
                                }}
                            />
                        </div>

                        <div
                            className="
                                mt-3
                                p-3
                                border
                                rounded
                                bg-green-50
                            "
                        >
                            <label
                                className="
                                    block
                                    font-semibold
                                    mb-2
                                "
                            >
                                Kết quả OCR
                            </label>

                            <input
                                type="text"
                                value={
                                    ocrResult
                                }
                                onChange={(
                                    e
                                ) =>
                                    setOcrResult(
                                        e.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                className="
                                    w-full
                                    border
                                    rounded
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