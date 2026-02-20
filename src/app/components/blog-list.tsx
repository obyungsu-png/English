import { useNavigate, useSearchParams } from "react-router";
import { useBlog, formatDate, AP_SUBCATEGORIES, Post } from "./blog-context";
import { MessageCircle, ArrowRight, Clock } from "lucide-react";

/** Strip HTML tags for preview text */
function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/* ── Unsplash fallback images per category ── */
const CATEGORY_FALLBACK: Record<string, string> = {
  "공지사항":
    "https://images.unsplash.com/photo-1638517304679-4fbf9341c33c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "AP Physics 1":
    "https://images.unsplash.com/photo-1664077631806-03ba46cf3256?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "AP Physics C":
    "https://images.unsplash.com/photo-1664077631806-03ba46cf3256?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "AP Chemistry":
    "https://images.unsplash.com/photo-1571763613035-cb45f652a118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "AP Biology":
    "https://images.unsplash.com/photo-1571455230472-034c3a71a699?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  "AP Economics":
    "https://images.unsplash.com/photo-1618044733300-9472054094ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  TOEFL:
    "https://images.unsplash.com/photo-1611696430200-68655e605723?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
  SAT:
    "https://images.unsplash.com/photo-1745545251862-2f45c6be286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
};
const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1758685734343-491353d96a81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

function getFallbackImage(category: string) {
  return CATEGORY_FALLBACK[category] || DEFAULT_FALLBACK;
}

/** Category badge color */
const BADGE: Record<string, string> = {
  "공지사항": "bg-amber-500",
  "AP Physics 1": "bg-violet-500",
  "AP Physics C": "bg-indigo-500",
  "AP Chemistry": "bg-emerald-500",
  "AP Biology": "bg-green-500",
  "AP Economics": "bg-blue-500",
  TOEFL: "bg-rose-500",
  SAT: "bg-sky-500",
};

function getBadge(cat: string) {
  return BADGE[cat] || "bg-gray-500";
}

export default function BlogList() {
  const { posts, loading } = useBlog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "전체";
  const searchQuery = searchParams.get("q") || "";

  const filteredPosts = posts.filter((p) => {
    const matchCat =
      selectedCategory === "전체" ||
      p.category === selectedCategory ||
      (selectedCategory === "AP" && AP_SUBCATEGORIES.includes(p.category));
    const matchSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400" style={{ fontSize: "0.85rem" }}>
            불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-gray-400 mb-5" style={{ fontSize: "0.95rem" }}>
          {searchQuery || selectedCategory !== "전체"
            ? "검색 결과가 없습니다."
            : "아직 작성된 글이 없습니다."}
        </p>
        {!searchQuery && selectedCategory === "전체" && (
          <button
            onClick={() => navigate("/write")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full transition-colors"
            style={{ fontSize: "0.85rem", fontWeight: 600 }}
          >
            첫 글 작성하기
          </button>
        )}
      </div>
    );
  }

  const heroPost = filteredPosts[0];
  const restPosts = filteredPosts.slice(1);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">
      {searchQuery && (
        <p className="text-gray-500 mb-6" style={{ fontSize: "0.85rem" }}>
          &ldquo;
          <span className="text-gray-800 font-medium">{searchQuery}</span>
          &rdquo; 검색 결과 ({filteredPosts.length}건)
        </p>
      )}

      {/* ── Hero Post ── */}
      <HeroCard
        post={heroPost}
        onClick={() => navigate(`/post/${heroPost.id}`)}
      />

      {/* ── Grid ── */}
      {restPosts.length > 0 && (
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => navigate(`/post/${post.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Hero Card ──────────────────── */
function HeroCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const preview = stripHtml(post.content);
  const commentCount =
    post.comments.length +
    post.comments.reduce((s, c) => s + c.replies.length, 0);

  // Use uploaded media or category-specific fallback
  const imgSrc =
    post.mediaUrl && post.mediaType === "image"
      ? post.mediaUrl
      : getFallbackImage(post.category);
  const isVideo = post.mediaUrl && post.mediaType === "video";

  return (
    <article
      onClick={onClick}
      className="cursor-pointer group rounded-2xl overflow-hidden relative"
      style={{ minHeight: 340 }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {isVideo ? (
          <video
            src={post.mediaUrl!}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={imgSrc}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
      </div>

      {/* Content overlaid */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8">
        {/* Badge */}
        <span
          className={`self-start px-3 py-1 rounded-full text-white mb-3 ${getBadge(post.category)}`}
          style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em" }}
        >
          {post.category}
        </span>

        <h2
          className="text-white mb-2 line-clamp-2 drop-shadow-sm"
          style={{ fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.35 }}
        >
          {post.title}
        </h2>

        <p
          className="text-white/70 line-clamp-2 mb-4 max-w-2xl"
          style={{ fontSize: "0.88rem", lineHeight: 1.7 }}
        >
          {preview}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/60">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span style={{ fontSize: "0.78rem" }}>
                {formatDate(post.createdAt)}
              </span>
            </div>
            {commentCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                <span style={{ fontSize: "0.78rem" }}>{commentCount}</span>
              </div>
            )}
          </div>
          <span
            className="flex items-center gap-1 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ fontSize: "0.78rem", fontWeight: 600 }}
          >
            읽기 <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────── Post Card ──────────────────── */
function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const preview = stripHtml(post.content);
  const commentCount =
    post.comments.length +
    post.comments.reduce((s, c) => s + c.replies.length, 0);

  const imgSrc =
    post.mediaUrl && post.mediaType === "image"
      ? post.mediaUrl
      : getFallbackImage(post.category);
  const isVideo = post.mediaUrl && post.mediaType === "video";

  return (
    <article
      onClick={onClick}
      className="cursor-pointer group rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col bg-white"
    >
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {isVideo ? (
          <video
            src={post.mediaUrl!}
            className="w-full h-full object-cover"
            muted
          />
        ) : (
          <img
            src={imgSrc}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
          />
        )}
        {/* Subtle bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-white shadow-sm ${getBadge(post.category)}`}
          style={{ fontSize: "0.68rem", fontWeight: 600 }}
        >
          {post.category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3
          className="text-gray-900 mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors"
          style={{ fontSize: "0.95rem", fontWeight: 650, lineHeight: 1.4 }}
        >
          {post.title}
        </h3>
        <p
          className="text-gray-500 line-clamp-2 mb-3 flex-1"
          style={{ fontSize: "0.82rem", lineHeight: 1.65 }}
        >
          {preview}
        </p>
        <div className="flex items-center gap-3 text-gray-400 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span style={{ fontSize: "0.72rem" }}>
              {formatDate(post.createdAt)}
            </span>
          </div>
          {commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span style={{ fontSize: "0.72rem" }}>{commentCount}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
