import { MdArrowBack, MdInstallMobile, MdReceiptLong, MdCampaign, MdChevronRight } from 'react-icons/md'
import FooterHouse from './House/FooterHouse.jsx'

export default function Help({ user, onBack }) {
    const openUrl = (url) => {
        window.open(url, "_blank", "noopener,noreferrer")
    }

    const setUpMobile = () => {
        openUrl("https://vt.tiktok.com/ZSXhd3Pkx/")
    }

    const createInvoice = () => {
        openUrl("https://vt.tiktok.com/ZSXhdEyjG/")
    }

    const saleRoom = () => {
        openUrl("https://vt.tiktok.com/ZSXhRjYFR/")
    }
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header className="bg-white border-b border-stone-200 px-4 h-20 flex items-center gap-3 flex-shrink-0">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200 transition active:scale-95"
                    title="Quay lại"
                >
                    <MdArrowBack size={20} />
                </button>
                <h1 className="text-left text-2xl font-bold uppercase text-stone-500">
                    Trợ giúp
                </h1>
            </header>

            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: '40px',
                }}
            >
                <div style={{ width: '100%', maxWidth: '500px', padding: '0 20px' }}>

                    {/* MENU CHỨC NĂNG */}
                    <div
                        style={{
                            border: '1px solid #e7e5e4',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setUpMobile(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <MdInstallMobile size={18} />
                            </div>
                            <span style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#44403c' }}>
                                Cài trên điện thoại
                            </span>
                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>

                        <button
                            type="button"
                            onClick={() => createInvoice(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                borderTop: '1px solid #e7e5e4',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MdReceiptLong size={18} />
                            </div>

                            <span
                                style={{
                                    flex: 1,
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: '#44403c',
                                }}
                            >
                                Tạo hóa đơn
                            </span>

                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>
                        <button
                            type="button"
                            onClick={() => saleRoom(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                background: 'white',
                                border: 'none',
                                borderTop: '1px solid #e7e5e4',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                            className="hover:bg-stone-50 transition"
                        >
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#f5f5f4',
                                    color: '#78716c',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <MdCampaign size={18} />
                            </div>

                            <span
                                style={{
                                    flex: 1,
                                    fontSize: '15px',
                                    fontWeight: 500,
                                    color: '#44403c',
                                }}
                            >
                                Rao tin phòng
                            </span>

                            <MdChevronRight size={20} color="#a8a29e" />
                        </button>

                    </div>

                    
                </div>
            </div>

            <FooterHouse />


        </div>
    )
}

