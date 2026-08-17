import { useEffect, useState } from "react";
import { db } from "../../db/db.js";

export default function StatisticsDialog({ onClose }) {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);

    const cellStyle = {
        textAlign: "center",
        padding: "10px",
        border: "1px solid #e7e5e4",
    };

    const headerStyle = {
        ...cellStyle,
        background: "#f5f5f4",
        fontWeight: 600,
    };

  useEffect(() => {

    async function loadLocal() {

        const data =
            await db.statistics
                .orderBy("id")
                .toArray();

        setRows(data);
        setLoading(false);
    }

    loadLocal();

}, []);

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.45)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 100,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "95%",
                    maxWidth: 700,
                    background: "#fff",
                    borderRadius: 16,
                    padding: 20,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                    }}
                >
                    <h2 style={{ margin: 0 }}>
                        Thống kê 5 ngày gần nhất
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 34,
                            height: 34,
                            border: "none",
                            borderRadius: 8,
                            background: "#f5f5f4",
                            cursor: "pointer",
                            fontSize: 18,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {loading ? (
                    <p>Đang tải...</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={headerStyle}>Ngày</th>
                                    <th style={headerStyle}>Usr</th>
                                    <th style={headerStyle}>Ho</th>
                                    <th style={headerStyle}>Ro</th>
                                    <th style={headerStyle}>Inv</th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.date}>
                                        <td style={cellStyle}>{r.date}</td>
                                        <td style={cellStyle}>{r.users}</td>
                                        <td style={cellStyle}>{r.homes}</td>
                                        <td style={cellStyle}>{r.rooms}</td>
                                        <td style={cellStyle}>{r.invoices}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}