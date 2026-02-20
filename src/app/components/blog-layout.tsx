import { Outlet, useNavigate, useLocation } from "react-router";
import { PenSquare, Search, GraduationCap, Upload, X, ChevronDown, Loader2, Lock, LogOut, Shield } from "lucide-react";
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
  const { qrImageUrl, setQrImage, isAdmin, adminLogin, adminLogout } = useBlog();
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [apDropdownOpen, setApDropdownOpen] = useState(false);
  const apDropdownRef = useRef<HTMLDivElement>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

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

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) return;
    setAdminLoading(true);
    setAdminError("");
    const ok = await adminLogin(adminPassword);
    setAdminLoading(false);
    if (ok) {
      setShowAdminModal(false);
      setAdminPassword("");
    } else {
      setAdminError("비밀번호가 올바르지 않습니다.");
    }
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

              {/* Admin: Write button */}
              {isAdmin && (
                <button
                  onClick={() => navigate("/write")}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-full transition-colors"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">글쓰기</span>
                </button>
              )}

              {/* Admin toggle */}
              {isAdmin ? (
                <button
                  onClick={adminLogout}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="관리자 로그아웃"
                >
                  <Shield className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="p-2 text-gray-300 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
                  title="관리자 로그인"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}
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

            {/* QR Code Management - Admin Only for upload/delete, visible to all if QR exists */}
            <div className="flex flex-col items-center gap-2">
              {qrImageUrl ? (
                <div className="relative">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-24 h-24 rounded-lg border border-gray-200 object-contain bg-white p-1"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => setQrImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : isAdmin ? (
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
              ) : null}
              <input
                ref={qrInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrUpload}
              />
              {qrImageUrl && (
                <p
                  className="text-gray-400 text-center"
                  style={{ fontSize: "0.7rem" }}
                >
                  QR코드로 상담 문의
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>
              © 2026 세계로 아카데미. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2 className="text-gray-900" style={{ fontSize: "1.1rem", fontWeight: 700 }}>관리자 로그인</h2>
            </div>
            <input
              type="password"
              autoFocus
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value);
                setAdminError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminLogin();
              }}
              placeholder="비밀번호를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 mb-3"
              style={{ fontSize: "0.9rem" }}
            />
            {adminError && (
              <p className="text-red-500 mb-3" style={{ fontSize: "0.82rem" }}>{adminError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminPassword("");
                  setAdminError("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ fontSize: "0.85rem", fontWeight: 500 }}
              >
                취소
              </button>
              <button
                onClick={handleAdminLogin}
                disabled={adminLoading || !adminPassword.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white transition-colors"
                style={{ fontSize: "0.85rem", fontWeight: 600 }}
              >
                {adminLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {adminLoading ? "확인 중..." : "로그인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
