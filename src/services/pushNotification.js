export async function registerPush() {
    try {
        // ==========================================
        // KIỂM TRA HỖ TRỢ
        // ==========================================

        if (!("serviceWorker" in navigator)) {
            console.log("❌ Browser không hỗ trợ Service Worker");
            return null;
        }

        if (!("PushManager" in window)) {
            console.log("❌ Browser không hỗ trợ Web Push");
            return null;
        }

        if (!("Notification" in window)) {
            console.log("❌ Browser không hỗ trợ Notification");
            return null;
        }


        // ==========================================
        // KIỂM TRA / XIN QUYỀN NOTIFICATION
        // ==========================================

        let permission = Notification.permission;

        if (permission === "default") {
            permission =
                await Notification.requestPermission();
        }

        if (permission !== "granted") {
            console.log(
                "❌ Notification permission:",
                permission
            );

            return null;
        }


        // ==========================================
        // ĐĂNG KÝ SERVICE WORKER
        // ==========================================

        const registration =
            await navigator.serviceWorker.register(
                "/sw.js"
            );

        console.log(
            "✅ Service Worker registered"
        );


        // ==========================================
        // CHỜ SERVICE WORKER READY
        // ==========================================

        await navigator.serviceWorker.ready;


        // ==========================================
        // LẤY SUBSCRIPTION HIỆN TẠI
        // ==========================================

        let subscription =
            await registration.pushManager
                .getSubscription();


        // ==========================================
        // CHƯA CÓ → TẠO SUBSCRIPTION
        // ==========================================

        if (!subscription) {

            const vapidPublicKey =
                import.meta.env
                    .VITE_VAPID_PUBLIC_KEY;


            if (!vapidPublicKey) {

                console.error(
                    "❌ Chưa cấu hình VITE_VAPID_PUBLIC_KEY"
                );

                return null;
            }


            subscription =
                await registration.pushManager
                    .subscribe({

                        userVisibleOnly: true,

                        applicationServerKey:
                            urlBase64ToUint8Array(
                                vapidPublicKey
                            ),
                    });
        }


        // ==========================================
        // KẾT QUẢ
        // ==========================================

        console.log(
            "✅ Push subscription:",
            subscription
        );


        return subscription;

    } catch (error) {

        console.error(
            "❌ registerPush lỗi:",
            error
        );

        return null;
    }
}


// ==================================================
// BASE64 → UINT8ARRAY
// ==================================================

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (4 -
                (base64String.length % 4)) %
                4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");


    const rawData =
        window.atob(base64);


    return Uint8Array.from(
        [...rawData],
        char =>
            char.charCodeAt(0)
    );
}