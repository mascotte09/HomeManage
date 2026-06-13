export default function FooterHouse() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-stone-100 to-stone-50 border-t border-stone-200 px-4 py-4 flex-shrink-0 text-center">
      <div className="space-y-2">
        {/* Brand + Copyright */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-stone-700">
            🏠 Room Management System
          </span>
        </div>

        {/* Made with love */}
        <div className="flex items-center justify-center gap-1 text-xs text-stone-600">
          <span>📧</span>
          <a 
            href="mailto:ngdz0912@gmail.com"
            className="hover:text-blue-600 transition"
          >
            ngdang09@yahoo.com
          </a>
          <span>•</span>
          <span>📱</span>
          <a 
            href="tel:0777107877"
            className="hover:text-blue-600 transition"
          >
            0777107877
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-stone-400">
          © {currentYear} Room Management. All rights reserved.
        </div>        
      </div>
    </footer>
  );
}
