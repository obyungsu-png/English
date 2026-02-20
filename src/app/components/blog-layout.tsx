import { Outlet, useNavigate, useLocation } from "react-router";
import { PenSquare, Search, GraduationCap, Upload, X, ChevronDown, Loader2 } from "lucide-react";
import { NAV_TABS, AP_SUBCATEGORIES, BlogProvider, useBlog } from "./blog-context";
import { useState, useRef, useEffect } from "react";

/**
 * BlogLayout wraps everything in BlogProvider itself,
 * so there's no context boundary issue across route layers.
 */
export default function BlogLayout() {
  return (
    <BlogProvider>
      <BlogLayoutInner />
    </BlogProvider>
  );
}

function BlogLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentCategory = params.get("category") || "전체";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { qrImageUrl, setQrImage } = useBlog();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [apDropdownOpen, setApDropdownOpen] = useState(false);
  const apDropdownRef = useRef<HTMLDivElement>(null);

  // Close AP dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (apDropdownRef.current && !apDropdownRef.current.contains(e.target as Node)) {
        setApDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isApActive = AP_SUBCATEGORIES.includes(currentCategory) || currentCategory === "AP";

  const handleCategoryClick = (cat: string) => {
    if (cat === "전체") {
      navigate("/");
    } else {
      navigate(`/?category=${encodeURIComponent(cat)}`);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/");
    }
    setSearchOpen(false);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span
                className="text-gray-800 whitespace-nowrap"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
                세계로 아카데미
              </span>
              <span
                className="text-gray-400 hidden sm:inline"
                style={{ fontSize: "0.85rem", fontWeight: 400 }}
              >
                블로그
              </span>
            </div>

            {/* Category Tabs (desktop) */}
            {isHome && (
              <nav className="hidden md:flex items-center gap-1 ml-8">
                {NAV_TABS.map((tab) =>
                  tab === "AP" ? (
                    <div key={tab} className="relative" ref={apDropdownRef}>
                      <button
                        onClick={() => setApDropdownOpen((v) => !v)}
                        className={`flex items-center gap-0.5 px-3 py-1 rounded-full transition-colors ${
                          isApActive
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: isApActive ? 600 : 400,
                        }}
                      >
                        AP
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${apDropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {apDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 min-w-[160px] z-50">
                          {AP_SUBCATEGORIES.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => {
                                handleCategoryClick(sub);
                                setApDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-1.5 transition-colors ${
                                currentCategory === sub
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: currentCategory === sub ? 600 : 400,
                              }}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      key={tab}
                      onClick={() => handleCategoryClick(tab)}
                      className={`px-3 py-1 rounded-full transition-colors ${
                        currentCategory === tab
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: currentCategory === tab ? 600 : 400,
                      }}
                    >
                      {tab}
                    </button>
                  )
                )}
              </nav>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색..."
                    className="border border-gray-300 rounded-full px-3 py-1 text-gray-700 focus:outline-none focus:border-blue-400 w-40 sm:w-56"
                    style={{ fontSize: "0.82rem" }}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                  />
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              )}
              <button
                onClick={() => navigate("/write")}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full transition-colors"
                style={{ fontSize: "0.8rem", fontWeight: 600 }}
              >
                <PenSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">글쓰기</span>
              </button>
            </div>
          </div>

          {/* Mobile category scroll */}
          {isHome && (
            <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2.5 -mx-1 px-1 scrollbar-hide">
              {NAV_TABS.map((tab) =>
                tab === "AP" ? (
                  <div key={tab} className="relative flex-shrink-0" ref={apDropdownRef}>
                    <button
                      onClick={() => setApDropdownOpen((v) => !v)}
                      className={`flex items-center gap-0.5 px-3 py-1 rounded-full border transition-colors ${
                        isApActive
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: isApActive ? 600 : 400,
                      }}
                    >
                      AP
                      <ChevronDown className={`w-3 h-3 transition-transform ${apDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {apDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1.5 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 min-w-[150px] z-50">
                        {AP_SUBCATEGORIES.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              handleCategoryClick(sub);
                              setApDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${
                              currentCategory === sub
                                ? "text-blue-600 bg-blue-50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: currentCategory === sub ? 600 : 400,
                            }}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={tab}
                    onClick={() => handleCategoryClick(tab)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full border transition-colors ${
                      currentCategory === tab
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                    }`}
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: currentCategory === tab ? 600 : 400,
                    }}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Academy Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span
                  style={{ fontSize: "0.95rem", fontWeight: 700 }}
                  className="text-gray-800"
                >
                  세계로 아카데미
                </span>
              </div>
              <p
                className="text-gray-400"
                style={{ fontSize: "0.8rem", lineHeight: 1.6 }}
              >
                AP · TOEFL · SAT
              </p>
            </div>

            {/* QR Code Management */}
            <div className="flex flex-col items-center gap-2">
              {qrImageUrl ? (
                <div className="relative">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-24 h-24 rounded-lg border border-gray-200 object-contain bg-white p-1"
                  />
                  <button
                    onClick={() => setQrImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span
                    className="text-gray-400"
                    style={{ fontSize: "0.7rem" }}
                  >
                    QR 등록
                  </span>
                </button>
              )}
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
              <p
                className="text-gray-400 text-center"
                style={{ fontSize: "0.7rem" }}
              >
                QR코드로 상담 문의
              </p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
              © 2026 세계로 아카데미. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}