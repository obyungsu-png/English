import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useBlog, POST_CATEGORIES } from "./blog-context";
import {
  X,
  ImagePlus,
  Film,
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
  Loader2,
} from "lucide-react";

const FONT_SIZES = [
  { label: "작게", value: "2" },
  { label: "보통", value: "3" },
  { label: "크게", value: "4" },
  { label: "매우 크게", value: "5" },
  { label: "제목", value: "6" },
];

const TEXT_COLORS = [
  { label: "검정", value: "#1f2937", swatch: "bg-gray-800" },
  { label: "빨강", value: "#dc2626", swatch: "bg-red-600" },
  { label: "파랑", value: "#2563eb", swatch: "bg-blue-600" },
  { label: "초록", value: "#16a34a", swatch: "bg-green-600" },
  { label: "주황", value: "#ea580c", swatch: "bg-orange-600" },
  { label: "보라", value: "#9333ea", swatch: "bg-purple-600" },
  { label: "회색", value: "#6b7280", swatch: "bg-gray-500" },
];

export default function PostEditor() {
  const { addPost } = useBlog();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(POST_CATEGORIES[0]);
  const [mediaDataUri, setMediaDataUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const execCmd = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleMediaUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMediaDataUri(ev.target?.result as string);
      setMediaType(type);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const htmlContent = editorRef.current?.innerHTML || "";
    const textContent = editorRef.current?.innerText?.trim() || "";
    if (!title.trim() || !textContent) return;

    setSubmitting(true);
    try {
      const id = await addPost({
        title: title.trim(),
        content: htmlContent,
        category,
        mediaData: mediaDataUri,
        mediaType,
      });
      navigate(`/post/${id}`);
    } catch (err) {
      console.error("Submit error:", err);
      alert("글 발행에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
          style={{ fontSize: "0.82rem" }}
        >
          <X className="w-4 h-4" />
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-1.5 rounded-full transition-colors"
          style={{ fontSize: "0.82rem", fontWeight: 600 }}
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitting ? "발행 중..." : "발행"}
        </button>
      </div>

      {/* Editor Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Media Preview */}
        {mediaDataUri ? (
          <div className="relative">
            {mediaType === "video" ? (
              <video
                src={mediaDataUri}
                controls
                className="w-full max-h-72 bg-black"
              />
            ) : (
              <img
                src={mediaDataUri}
                alt="preview"
                className="w-full max-h-72 object-cover"
              />
            )}
            <button
              onClick={() => {
                setMediaDataUri(null);
                setMediaType(null);
              }}
              className="absolute top-3 right-3 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex-1 h-28 flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 transition-colors border-r border-gray-100"
            >
              <ImagePlus className="w-6 h-6 text-gray-300" />
              <span className="text-gray-400" style={{ fontSize: "0.78rem" }}>
                사진 추가
              </span>
            </button>
            <button
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 h-28 flex flex-col items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Film className="w-6 h-6 text-gray-300" />
              <span className="text-gray-400" style={{ fontSize: "0.78rem" }}>
                동영상 추가
              </span>
            </button>
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleMediaUpload(e, "image")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleMediaUpload(e, "video")}
        />

        <div className="p-6 space-y-4">
          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 focus:outline-none cursor-pointer"
            style={{ fontSize: "0.78rem", fontWeight: 600 }}
          >
            {POST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Title */}
          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent"
            style={{ fontSize: "1.5rem", fontWeight: 700 }}
          />

          <div className="border-t border-gray-100" />

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 flex-wrap border border-gray-100 rounded-lg p-1.5 bg-gray-50">
            <button
              onClick={() => execCmd("bold")}
              className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all"
              title="굵게"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd("italic")}
              className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all"
              title="기울임"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd("underline")}
              className="p-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all"
              title="밑줄"
            >
              <Underline className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1" />

            {/* Font Size */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSizePicker(!showSizePicker);
                  setShowColorPicker(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all"
                title="글자 크기"
              >
                <Type className="w-4 h-4" />
                <span style={{ fontSize: "0.7rem" }}>크기</span>
              </button>
              {showSizePicker && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                  {FONT_SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => {
                        execCmd("fontSize", s.value);
                        setShowSizePicker(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700 transition-colors"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Color */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowColorPicker(!showColorPicker);
                  setShowSizePicker(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-800 transition-all"
                title="글자 색상"
              >
                <Palette className="w-4 h-4" />
                <span style={{ fontSize: "0.7rem" }}>색상</span>
              </button>
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                  <div className="flex gap-1.5">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => {
                          execCmd("foreColor", c.value);
                          setShowColorPicker(false);
                        }}
                        className={`w-7 h-7 rounded-full ${c.swatch} hover:ring-2 hover:ring-offset-1 hover:ring-blue-400 transition-all`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rich Content Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="w-full min-h-[400px] text-gray-700 outline-none bg-transparent"
            style={{ fontSize: "0.95rem", lineHeight: 1.9 }}
            data-placeholder="내용을 입력하세요..."
            onFocus={() => {
              const el = editorRef.current;
              if (el && el.innerText.trim() === "") {
                el.classList.remove("is-empty");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
