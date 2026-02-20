import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { Post } from "./blog-context";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-65e03572`;

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
});

// ── Posts ──

export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${BASE}/posts`, { headers: headers() });
  if (!res.ok) {
    const err = await res.text();
    console.error("fetchPosts error:", err);
    throw new Error(err);
  }
  const data = await res.json();
  return (data.posts || []).map(normalizePost);
}

export async function fetchPost(id: string): Promise<Post | null> {
  const res = await fetch(`${BASE}/posts/${id}`, { headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    console.error("fetchPost error:", err);
    throw new Error(err);
  }
  const data = await res.json();
  return normalizePost(data.post);
}

export async function createPost(post: {
  title: string;
  content: string;
  category: string;
  mediaData: string | null;
  mediaType: "image" | "video" | null;
}): Promise<Post> {
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(post),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("createPost error:", err);
    throw new Error(err);
  }
  const data = await res.json();
  return normalizePost(data.post);
}

export async function deletePostApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/posts/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("deletePost error:", err);
    throw new Error(err);
  }
}

// ── Comments ──

export async function addCommentApi(
  postId: string,
  author: string,
  content: string
): Promise<any> {
  const res = await fetch(`${BASE}/posts/${postId}/comments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ author, content }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("addComment error:", err);
    throw new Error(err);
  }
  return (await res.json()).comment;
}

export async function deleteCommentApi(
  postId: string,
  commentId: string
): Promise<void> {
  const res = await fetch(`${BASE}/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("deleteComment error:", err);
    throw new Error(err);
  }
}

// ── Replies ──

export async function addReplyApi(
  postId: string,
  commentId: string,
  author: string,
  content: string
): Promise<any> {
  const res = await fetch(
    `${BASE}/posts/${postId}/comments/${commentId}/replies`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ author, content }),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("addReply error:", err);
    throw new Error(err);
  }
  return (await res.json()).reply;
}

export async function deleteReplyApi(
  postId: string,
  commentId: string,
  replyId: string
): Promise<void> {
  const res = await fetch(
    `${BASE}/posts/${postId}/comments/${commentId}/replies/${replyId}`,
    {
      method: "DELETE",
      headers: headers(),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("deleteReply error:", err);
    throw new Error(err);
  }
}

// ── QR Image ──

export async function fetchQrImage(): Promise<string | null> {
  const res = await fetch(`${BASE}/settings/qr`, { headers: headers() });
  if (!res.ok) return null;
  const data = await res.json();
  return data.qrImageUrl || null;
}

export async function uploadQrImage(imageData: string): Promise<string | null> {
  const res = await fetch(`${BASE}/settings/qr`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ imageData }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("uploadQr error:", err);
    throw new Error(err);
  }
  const data = await res.json();
  return data.qrImageUrl || null;
}

export async function deleteQrImage(): Promise<void> {
  const res = await fetch(`${BASE}/settings/qr`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("deleteQr error:", err);
  }
}

// ── Normalize post shape ──
function normalizePost(p: any): Post {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    mediaUrl: p.mediaUrl || null,
    mediaType: p.mediaType || null,
    createdAt: p.createdAt,
    category: p.category,
    comments: (p.comments || []).map((c: any) => ({
      id: c.id,
      author: c.author,
      content: c.content,
      createdAt: c.createdAt,
      replies: (c.replies || []).map((r: any) => ({
        id: r.id,
        author: r.author,
        content: r.content,
        createdAt: r.createdAt,
      })),
    })),
  };
}
