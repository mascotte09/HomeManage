export default function FooterHouse() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-stone-100 to-stone-50 border-t border-stone-200 px-4 py-4 flex-shrink-0 text-center">
      <div className="space-y-2">
        {/* Brand + Copyright */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-stone-700">
            🏠 Hệ thống Quản Trọ
          </span>
        </div>

        {/* Made with love */}
        <div className="flex items-center justify-center gap-1 text-xs text-stone-600">
          
          <span>📱 Hỗ trợ: </span>
          <a 
            href="tel:0777107877"
            className="hover:text-blue-600 transition"
          >
            0777 107 877
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-stone-400">
          © {currentYear} Hệ thống Quản Trọ. All rights reserved.
        </div>        
      </div>
    </footer>
  );
}
