import { useParams, useNavigate } from "react-router";
import { useBlog, formatDate } from "./blog-context";
import {
  ChevronLeft,
  Trash2,
  Calendar,
  MessageCircle,
  Send,
  User,
  Share2,
  QrCode,
  CornerDownRight,
  X,
  Copy,
  Check,
  Link2,
  Download,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { QRCodeSVG } from "qrcode.react";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    getPost,
    deletePost,
    addComment,
    deleteComment,
    addReply,
    deleteReply,
    qrImageUrl,
    refreshPost,
    loading,
  } = useBlog();
  const navigate = useNavigate();

  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const post = getPost(id || "");

  // Close share panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Refresh from server
  useEffect(() => {
    if (id) refreshPost(id);
  }, [id, refreshPost]);

  const getShareUrl = useCallback(() => window.location.href, []);

  const handleCopyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("링크가 복사되었습니다!", { duration: 2000 });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleNativeShare = async () => {
    if (!post) return;
    try {
      await navigator.share({
        title: post.title,
        text: `${post.category} - ${post.title}`,
        url: getShareUrl(),
      });
    } catch {
      /* cancelled */
    }
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById("page-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qr-${id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  if (!post) {
    if (loading) {
      return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400" style={{ fontSize: "0.85rem" }}>
              불러오는 중...
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-gray-500 mb-4" style={{ fontSize: "0.95rem" }}>
          글을 찾을 수 없습니다.
        </p>
        <button
          onClick={() => navigate("/")}
          className="text-blue-600 hover:text-blue-700"
          style={{ fontSize: "0.85rem", fontWeight: 600 }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("이 글을 삭제하시겠습니까?")) return;
    await deletePost(post.id);
    navigate("/");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    await addComment(post.id, commentAuthor, commentContent);
    setCommentAuthor("");
    setCommentContent("");
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    await addReply(post.id, commentId, replyAuthor, replyContent);
    setReplyingTo(null);
    setReplyAuthor("");
    setReplyContent("");
  };

  const totalCommentCount =
    post.comments.length +
    post.comments.reduce((sum, c) => sum + c.replies.length, 0);

  const isHtml = /<[a-z][\s\S]*>/i.test(post.content);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1 text-gray-400 hover:text-gray-700 mb-6 transition-colors"
        style={{ fontSize: "0.82rem" }}
      >
        <ChevronLeft className="w-4 h-4" />
        목록으로
      </button>

      {/* Post */}
      <article>
        {/* Category */}
        <span
          className="inline-block text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full"
          style={{ fontSize: "0.75rem", fontWeight: 600 }}
        >
          {post.category}
        </span>

        {/* Title */}
        <h1
          className="text-gray-900 mt-3 mb-3"
          style={{ fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.3 }}
        >
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 text-gray-400 mb-5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span style={{ fontSize: "0.82rem" }}>
              {formatDate(post.createdAt)}
            </span>
          </div>
          {totalCommentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span style={{ fontSize: "0.82rem" }}>{totalCommentCount}</span>
            </div>
          )}
        </div>

        {/* ── Share & QR Bar ── */}
        <div
          ref={shareRef}
          className="mb-6 pb-6 border-b border-gray-100"
        >
          {/* Toggle buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShareOpen(shareOpen === false ? true : false)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm transition-all ${
                shareOpen
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
              }`}
              style={{ fontSize: "0.8rem", fontWeight: 500 }}
            >
              <Share2 className="w-3.5 h-3.5" />
              공유하기
            </button>

            {qrImageUrl && (
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-green-200 hover:text-green-600 transition-all"
                  style={{ fontSize: "0.8rem", fontWeight: 500 }}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  문의하기
                </button>
                <div className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 hidden group-hover:block z-50">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-36 h-36 object-contain"
                  />
                  <p
                    className="text-gray-500 text-center mt-2"
                    style={{ fontSize: "0.72rem" }}
                  >
                    스캔하여 상담 문의
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Expanded share panel */}
          {shareOpen && (
            <div className="mt-4 bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Left: Link + actions */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-gray-700 mb-2"
                    style={{ fontSize: "0.78rem", fontWeight: 600 }}
                  >
                    <Link2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    링크 복사
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl()}
                      className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 outline-none truncate"
                      style={{ fontSize: "0.78rem" }}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all ${
                        copied
                          ? "bg-green-500 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      style={{ fontSize: "0.78rem", fontWeight: 600 }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> 복사
                        </>
                      )}
                    </button>
                  </div>

                  {canNativeShare && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                      style={{ fontSize: "0.78rem" }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      다른 앱으로 공유
                    </button>
                  )}
                </div>

                {/* Right: Page QR Code */}
                <div className="flex flex-col items-center gap-2 sm:border-l sm:border-gray-200 sm:pl-5">
                  <p
                    className="text-gray-700"
                    style={{ fontSize: "0.78rem", fontWeight: 600 }}
                  >
                    <QrCode className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                    페이지 QR 코드
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <QRCodeSVG
                      id="page-qr-svg"
                      value={getShareUrl()}
                      size={120}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#1e40af"
                    />
                  </div>
                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
                    style={{ fontSize: "0.72rem" }}
                  >
                    <Download className="w-3 h-3" />
                    QR 이미지 저장
                  </button>
                  <p className="text-gray-400 text-center" style={{ fontSize: "0.68rem" }}>
                    스캔하면 이 글로 이동합니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden mb-8">
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                controls
                className="w-full max-h-[500px] bg-black"
              />
            ) : (
              <img
                src={post.mediaUrl}
                alt={post.title}
                className="w-full max-h-[500px] object-cover"
              />
            )}
          </div>
        )}

        {/* Content */}
        {isHtml ? (
          <div
            className="text-gray-700 mb-8 rich-content"
            style={{ fontSize: "0.95rem", lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <div
            className="text-gray-700 whitespace-pre-wrap mb-8"
            style={{ fontSize: "0.95rem", lineHeight: 1.9 }}
          >
            {post.content}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pb-6 border-b border-gray-100">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
            style={{ fontSize: "0.8rem" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        </div>
      </article>

      {/* ── Comments ── */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle className="w-4.5 h-4.5 text-gray-600" />
          <span
            className="text-gray-800"
            style={{ fontSize: "0.95rem", fontWeight: 600 }}
          >
            댓글
          </span>
          <span className="text-gray-400" style={{ fontSize: "0.85rem" }}>
            {totalCommentCount}
          </span>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleAddComment} className="mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름 (선택)"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="bg-transparent text-gray-700 placeholder-gray-400 outline-none flex-1"
                style={{ fontSize: "0.82rem" }}
              />
            </div>
            <div className="flex gap-2">
              <textarea
                placeholder="댓글을 작성하세요..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={2}
                className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 resize-none"
                style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
              />
              <button
                type="submit"
                disabled={!commentContent.trim()}
                className="self-end bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white p-2.5 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Comments List */}
        {post.comments.length === 0 ? (
          <p
            className="text-gray-400 text-center py-6"
            style={{ fontSize: "0.85rem" }}
          >
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요.
          </p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id}>
                {/* Comment */}
                <div className="bg-white border border-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span
                          className="text-blue-600"
                          style={{ fontSize: "0.7rem", fontWeight: 600 }}
                        >
                          {comment.author.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span
                        className="text-gray-800"
                        style={{ fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        {comment.author}
                      </span>
                      <span
                        className="text-gray-400"
                        style={{ fontSize: "0.72rem" }}
                      >
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (replyingTo === comment.id) {
                            setReplyingTo(null);
                          } else {
                            setReplyingTo(comment.id);
                            setReplyAuthor("");
                            setReplyContent("");
                          }
                        }}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="답글"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteComment(post.id, comment.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p
                    className="text-gray-600 pl-8"
                    style={{ fontSize: "0.85rem", lineHeight: 1.6 }}
                  >
                    {comment.content}
                  </p>
                </div>

                {/* Replies */}
                {comment.replies.length > 0 && (
                  <div className="ml-8 mt-1.5 space-y-1.5">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-blue-50/50 border border-blue-100/60 rounded-lg px-4 py-2.5 flex items-start gap-3"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center">
                                <span
                                  className="text-blue-700"
                                  style={{ fontSize: "0.6rem", fontWeight: 600 }}
                                >
                                  {reply.author.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span
                                className="text-gray-800"
                                style={{ fontSize: "0.78rem", fontWeight: 600 }}
                              >
                                {reply.author}
                              </span>
                              <span
                                className="text-gray-400"
                                style={{ fontSize: "0.68rem" }}
                              >
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <button
                              onClick={() =>
                                deleteReply(post.id, comment.id, reply.id)
                              }
                              className="text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p
                            className="text-gray-600"
                            style={{ fontSize: "0.82rem", lineHeight: 1.5 }}
                          >
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-8 mt-2">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-400" />
                        <input
                          type="text"
                          placeholder="이름 (선택)"
                          value={replyAuthor}
                          onChange={(e) => setReplyAuthor(e.target.value)}
                          className="bg-transparent text-gray-700 placeholder-gray-400 outline-none flex-1"
                          style={{ fontSize: "0.78rem" }}
                        />
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          autoFocus
                          placeholder="답글을 작성하세요..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                          className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 resize-none"
                          style={{ fontSize: "0.82rem", lineHeight: 1.5 }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddReply(comment.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className="self-end bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white p-2 rounded-lg transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <Toaster />
    </div>
  );
}
