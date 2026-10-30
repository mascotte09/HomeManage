export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { bankId, account, amount, addInfo = "" } = req.query;

  if (
    typeof bankId !== "string" ||
    typeof account !== "string" ||
    typeof amount !== "string" ||
    !/^[a-zA-Z0-9]+$/.test(bankId) ||
    !/^[a-zA-Z0-9]+$/.test(account) ||
    !/^\d+$/.test(amount) ||
    typeof addInfo !== "string"
  ) {
    return res.status(400).json({ error: "Thông tin QR không hợp lệ" });
  }

  try {
    const params = new URLSearchParams({ amount, addInfo });
    const url =
      `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?` +
      params.toString();
    const response = await fetch(url);

    if (!response.ok) {
      console.error("VietQR image request failed:", response.status);
      return res.status(502).json({ error: "Không tải được mã QR" });
    }

    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (
      !["image/png", "image/jpeg", "image/svg+xml"].includes(contentType)
    ) {
      console.error("VietQR returned unsupported content type:", contentType);
      return res.status(502).json({ error: "VietQR trả về định dạng ảnh không hợp lệ" });
    }

    const image = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(image);
  } catch (error) {
    console.error("VietQR proxy error:", error);
    return res.status(502).json({ error: "Không tải được mã QR" });
  }
}
