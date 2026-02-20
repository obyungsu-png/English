import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const BUCKET_NAME = "make-65e03572-blog-media";
const PREFIX = "/make-server-65e03572";

// ── Supabase client helper ──
function supabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Idempotent bucket init ──
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  try {
    const sb = supabase();
    const { data: buckets } = await sb.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
    if (!exists) {
      await sb.storage.createBucket(BUCKET_NAME, { public: false });
    }
    bucketReady = true;
  } catch (err) {
    console.log("Bucket init error:", err);
  }
}
ensureBucket();

// ── Helpers ──
async function uploadBase64(base64Uri: string, path: string): Promise<string> {
  await ensureBucket();
  const sb = supabase();
  const matches = base64Uri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid base64 data URI");
  const contentType = matches[1];
  const base64Data = matches[2];
  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const { error } = await sb.storage
    .from(BUCKET_NAME)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;
  return path;
}

async function getSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const sb = supabase();
  const { data, error } = await sb.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
  if (error) {
    console.log("SignedUrl error:", error);
    return null;
  }
  return data.signedUrl;
}

async function deleteStorage(path: string) {
  if (!path) return;
  const sb = supabase();
  await sb.storage.from(BUCKET_NAME).remove([path]);
}

// Enrich post with signed media URL
async function enrichPost(post: any) {
  if (!post) return post;
  const enriched = { ...post };
  if (post.mediaPath) {
    enriched.mediaUrl = await getSignedUrl(post.mediaPath);
  }
  return enriched;
}

// ── Health ──
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

// ── POSTS ──

// GET all posts
app.get(`${PREFIX}/posts`, async (c) => {
  try {
    const ids: string[] = (await kv.get("blog:post_ids")) || [];
    if (ids.length === 0) return c.json({ posts: [] });

    const keys = ids.map((id) => `blog:post:${id}`);
    const posts = await kv.mget(keys);

    // Filter out null entries (deleted posts whose ID wasn't cleaned up)
    const validPosts = posts.filter((p: any) => p != null);

    // Enrich with signed URLs
    const enriched = await Promise.all(validPosts.map(enrichPost));
    return c.json({ posts: enriched });
  } catch (err) {
    console.log("GET /posts error:", err);
    return c.json({ error: `Failed to fetch posts: ${err}` }, 500);
  }
});

// GET single post
app.get(`${PREFIX}/posts/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const post = await kv.get(`blog:post:${id}`);
    if (!post) return c.json({ error: "Post not found" }, 404);
    const enriched = await enrichPost(post);
    return c.json({ post: enriched });
  } catch (err) {
    console.log("GET /posts/:id error:", err);
    return c.json({ error: `Failed to fetch post: ${err}` }, 500);
  }
});

// CREATE post
app.post(`${PREFIX}/posts`, async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, category, mediaData, mediaType } = body;

    if (!title || !content || !category) {
      return c.json({ error: "Missing required fields (title, content, category)" }, 400);
    }

    const id = Date.now().toString();
    let mediaPath: string | null = null;

    // Upload media if provided (base64 data URI)
    if (mediaData && mediaType) {
      const ext = mediaType === "video" ? "mp4" : "jpg";
      mediaPath = `posts/${id}/media.${ext}`;
      await uploadBase64(mediaData, mediaPath);
    }

    const post = {
      id,
      title,
      content,
      category,
      mediaPath,
      mediaType: mediaType || null,
      mediaUrl: null,
      createdAt: new Date().toISOString(),
      comments: [],
    };

    // Save post
    await kv.set(`blog:post:${id}`, post);

    // Update post_ids (prepend)
    const ids: string[] = (await kv.get("blog:post_ids")) || [];
    await kv.set("blog:post_ids", [id, ...ids]);

    const enriched = await enrichPost(post);
    return c.json({ post: enriched }, 201);
  } catch (err) {
    console.log("POST /posts error:", err);
    return c.json({ error: `Failed to create post: ${err}` }, 500);
  }
});

// DELETE post
app.delete(`${PREFIX}/posts/:id`, async (c) => {
  try {
    const id = c.req.param("id");
    const post = await kv.get(`blog:post:${id}`);

    // Delete media from storage
    if (post?.mediaPath) {
      await deleteStorage(post.mediaPath);
    }

    // Delete post from KV
    await kv.del(`blog:post:${id}`);

    // Remove from post_ids
    const ids: string[] = (await kv.get("blog:post_ids")) || [];
    await kv.set(
      "blog:post_ids",
      ids.filter((i) => i !== id)
    );

    return c.json({ ok: true });
  } catch (err) {
    console.log("DELETE /posts/:id error:", err);
    return c.json({ error: `Failed to delete post: ${err}` }, 500);
  }
});

// ── COMMENTS ──

// ADD comment
app.post(`${PREFIX}/posts/:id/comments`, async (c) => {
  try {
    const postId = c.req.param("id");
    const { author, content } = await c.req.json();
    if (!content?.trim()) {
      return c.json({ error: "Comment content is required" }, 400);
    }

    const post = await kv.get(`blog:post:${postId}`);
    if (!post) return c.json({ error: "Post not found" }, 404);

    const comment = {
      id: Date.now().toString(),
      author: (author || "").trim() || "익명",
      content: content.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    };

    post.comments = [...(post.comments || []), comment];
    await kv.set(`blog:post:${postId}`, post);

    return c.json({ comment }, 201);
  } catch (err) {
    console.log("POST comment error:", err);
    return c.json({ error: `Failed to add comment: ${err}` }, 500);
  }
});

// DELETE comment
app.delete(`${PREFIX}/posts/:id/comments/:cid`, async (c) => {
  try {
    const postId = c.req.param("id");
    const cid = c.req.param("cid");

    const post = await kv.get(`blog:post:${postId}`);
    if (!post) return c.json({ error: "Post not found" }, 404);

    post.comments = (post.comments || []).filter((cm: any) => cm.id !== cid);
    await kv.set(`blog:post:${postId}`, post);

    return c.json({ ok: true });
  } catch (err) {
    console.log("DELETE comment error:", err);
    return c.json({ error: `Failed to delete comment: ${err}` }, 500);
  }
});

// ── REPLIES ──

// ADD reply
app.post(`${PREFIX}/posts/:id/comments/:cid/replies`, async (c) => {
  try {
    const postId = c.req.param("id");
    const cid = c.req.param("cid");
    const { author, content } = await c.req.json();
    if (!content?.trim()) {
      return c.json({ error: "Reply content is required" }, 400);
    }

    const post = await kv.get(`blog:post:${postId}`);
    if (!post) return c.json({ error: "Post not found" }, 404);

    const comment = (post.comments || []).find((cm: any) => cm.id === cid);
    if (!comment) return c.json({ error: "Comment not found" }, 404);

    const reply = {
      id: Date.now().toString(),
      author: (author || "").trim() || "관리자",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    comment.replies = [...(comment.replies || []), reply];
    await kv.set(`blog:post:${postId}`, post);

    return c.json({ reply }, 201);
  } catch (err) {
    console.log("POST reply error:", err);
    return c.json({ error: `Failed to add reply: ${err}` }, 500);
  }
});

// DELETE reply
app.delete(`${PREFIX}/posts/:id/comments/:cid/replies/:rid`, async (c) => {
  try {
    const postId = c.req.param("id");
    const cid = c.req.param("cid");
    const rid = c.req.param("rid");

    const post = await kv.get(`blog:post:${postId}`);
    if (!post) return c.json({ error: "Post not found" }, 404);

    const comment = (post.comments || []).find((cm: any) => cm.id === cid);
    if (!comment) return c.json({ error: "Comment not found" }, 404);

    comment.replies = (comment.replies || []).filter((r: any) => r.id !== rid);
    await kv.set(`blog:post:${postId}`, post);

    return c.json({ ok: true });
  } catch (err) {
    console.log("DELETE reply error:", err);
    return c.json({ error: `Failed to delete reply: ${err}` }, 500);
  }
});

// ── QR IMAGE ──

// GET QR image
app.get(`${PREFIX}/settings/qr`, async (c) => {
  try {
    const qrPath = await kv.get("blog:qr_path");
    if (!qrPath) return c.json({ qrImageUrl: null });
    const url = await getSignedUrl(qrPath);
    return c.json({ qrImageUrl: url });
  } catch (err) {
    console.log("GET QR error:", err);
    return c.json({ error: `Failed to get QR: ${err}` }, 500);
  }
});

// SET QR image (base64)
app.post(`${PREFIX}/settings/qr`, async (c) => {
  try {
    const { imageData } = await c.req.json();
    if (!imageData) return c.json({ error: "imageData is required" }, 400);

    // Delete old QR if exists
    const oldPath = await kv.get("blog:qr_path");
    if (oldPath) await deleteStorage(oldPath);

    const path = `qr/qr-image-${Date.now()}.png`;
    await uploadBase64(imageData, path);
    await kv.set("blog:qr_path", path);

    const url = await getSignedUrl(path);
    return c.json({ qrImageUrl: url });
  } catch (err) {
    console.log("POST QR error:", err);
    return c.json({ error: `Failed to upload QR: ${err}` }, 500);
  }
});

// DELETE QR image
app.delete(`${PREFIX}/settings/qr`, async (c) => {
  try {
    const qrPath = await kv.get("blog:qr_path");
    if (qrPath) await deleteStorage(qrPath);
    await kv.del("blog:qr_path");
    return c.json({ ok: true });
  } catch (err) {
    console.log("DELETE QR error:", err);
    return c.json({ error: `Failed to delete QR: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
