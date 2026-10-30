export default async function handler(req, res) {
  try {
    const { bankId, account, amount, addInfo = "" } = req.query;

    if (
      !bankId ||
      !account ||
      !/^[a-zA-Z0-9]+$/.test(bankId) ||
      !/^[a-zA-Z0-9]+$/.test(account) ||
      !/^\d+$/.test(String(amount))
    ) {
      return res.status(400).json({ error: "Thông tin QR không hợp lệ" });
    }

    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: String(addInfo),
    });

    const url =
      `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?` +
      params.toString();

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "Không tải được mã QR" });
    }

    const image = Buffer.from(await response.arrayBuffer());

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(image);
  } catch (error) {
    console.error("VietQR error:", error);
    return res.status(500).json({ error: "Lỗi tải mã QR" });
  }
}