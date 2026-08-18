export async function registerPush() {
    if (!("serviceWorker" in navigator)) {
        console.log("❌ Browser không hỗ trợ Service Worker");
        return null;
    }

    if (!("PushManager" in window)) {
        console.log("❌ Browser không hỗ trợ Web Push");
        return null;
    }

    const permission =
        await Notification.requestPermission();

    if (permission !== "granted") {
        console.log("❌ Người dùng không cho phép notification");
        return null;
    }

    const registration =
        await navigator.serviceWorker.register("/sw.js");

    const subscription =
        await registration.pushManager.getSubscription();

    console.log("✅ Push subscription:", subscription);

    return subscription;
}