import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import * as api from "./api";

export interface Reply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies: Reply[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  mediaUrl: string | null;
  mediaType: "image" | "video" | null;
  createdAt: string;
  category: string;
  comments: Comment[];
}

export const AP_SUBCATEGORIES = [
  "AP Physics 1",
  "AP Physics C",
  "AP Chemistry",
  "AP Biology",
  "AP Economics",
];

export const NAV_TABS = ["전체", "공지사항", "AP", "TOEFL", "SAT"];

// All assignable categories for posts (used in editor)
export const POST_CATEGORIES = [
  "공지사항",
  ...AP_SUBCATEGORIES,
  "TOEFL",
  "SAT",
];

// Keep CATEGORIES for backwards compatibility (includes 전체)
export const CATEGORIES = ["전체", ...POST_CATEGORIES];

interface BlogContextType {
  posts: Post[];
  loading: boolean;
  addPost: (post: {
    title: string;
    content: string;
    category: string;
    mediaData: string | null;
    mediaType: "image" | "video" | null;
  }) => Promise<string>;
  deletePost: (id: string) => Promise<void>;
  addComment: (
    postId: string,
    author: string,
    content: string
  ) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  addReply: (
    postId: string,
    commentId: string,
    author: string,
    content: string
  ) => Promise<void>;
  deleteReply: (
    postId: string,
    commentId: string,
    replyId: string
  ) => Promise<void>;
  getPost: (id: string) => Post | undefined;
  refreshPost: (id: string) => Promise<void>;
  qrImageUrl: string | null;
  setQrImage: (dataUri: string | null) => Promise<void>;
}

const BlogContext = createContext<BlogContextType | null>(null);

export function BlogProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // ── Initial fetch ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [fetchedPosts, qrUrl] = await Promise.all([
          api.fetchPosts(),
          api.fetchQrImage(),
        ]);
        if (!cancelled) {
          setPosts(fetchedPosts);
          setQrImageUrl(qrUrl);
        }
      } catch (err) {
        console.error("Blog init error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Posts ──
  const addPost = useCallback(
    async (post: {
      title: string;
      content: string;
      category: string;
      mediaData: string | null;
      mediaType: "image" | "video" | null;
    }): Promise<string> => {
      const newPost = await api.createPost(post);
      setPosts((prev) => [newPost, ...prev]);
      return newPost.id;
    },
    []
  );

  const deletePost = useCallback(async (id: string) => {
    // Optimistic: remove from local state immediately
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.deletePostApi(id);
    } catch (err) {
      console.error("deletePost rollback error:", err);
      // Re-fetch to restore state
      const fresh = await api.fetchPosts();
      setPosts(fresh);
    }
  }, []);

  // ── Comments ──
  const addComment = useCallback(
    async (postId: string, author: string, content: string) => {
      const comment = await api.addCommentApi(postId, author, content);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: [
                  ...p.comments,
                  { ...comment, replies: comment.replies || [] },
                ],
              }
            : p
        )
      );
    },
    []
  );

  const deleteComment = useCallback(
    async (postId: string, commentId: string) => {
      // Optimistic
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.filter((c) => c.id !== commentId),
              }
            : p
        )
      );
      try {
        await api.deleteCommentApi(postId, commentId);
      } catch (err) {
        console.error("deleteComment error:", err);
      }
    },
    []
  );

  // ── Replies ──
  const addReply = useCallback(
    async (
      postId: string,
      commentId: string,
      author: string,
      content: string
    ) => {
      const reply = await api.addReplyApi(postId, commentId, author, content);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? { ...c, replies: [...c.replies, reply] }
                    : c
                ),
              }
            : p
        )
      );
    },
    []
  );

  const deleteReply = useCallback(
    async (postId: string, commentId: string, replyId: string) => {
      // Optimistic
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id === commentId
                    ? {
                        ...c,
                        replies: c.replies.filter((r) => r.id !== replyId),
                      }
                    : c
                ),
              }
            : p
        )
      );
      try {
        await api.deleteReplyApi(postId, commentId, replyId);
      } catch (err) {
        console.error("deleteReply error:", err);
      }
    },
    []
  );

  const getPost = useCallback(
    (id: string) => posts.find((p) => p.id === id),
    [posts]
  );

  const refreshPost = useCallback(async (id: string) => {
    try {
      const fresh = await api.fetchPost(id);
      if (fresh) {
        setPosts((prev) => {
          const exists = prev.some((p) => p.id === id);
          if (exists) {
            return prev.map((p) => (p.id === id ? fresh : p));
          }
          // Direct-link: post not yet in state → prepend it
          return [fresh, ...prev];
        });
      }
    } catch (err) {
      console.error("refreshPost error:", err);
    }
  }, []);

  // ── QR Image ──
  const setQrImage = useCallback(async (dataUri: string | null) => {
    if (dataUri) {
      try {
        const url = await api.uploadQrImage(dataUri);
        setQrImageUrl(url);
      } catch (err) {
        console.error("uploadQr error:", err);
      }
    } else {
      try {
        await api.deleteQrImage();
        setQrImageUrl(null);
      } catch (err) {
        console.error("deleteQr error:", err);
      }
    }
  }, []);

  return (
    <BlogContext.Provider
      value={{
        posts,
        loading,
        addPost,
        deletePost,
        addComment,
        deleteComment,
        addReply,
        deleteReply,
        getPost,
        refreshPost,
        qrImageUrl,
        setQrImage,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const ctx = useContext(BlogContext);
  if (!ctx) throw new Error("useBlog must be used inside BlogProvider");
  return ctx;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}