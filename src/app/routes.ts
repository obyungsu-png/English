import { createBrowserRouter } from "react-router";
import BlogLayout from "./components/blog-layout";
import BlogList from "./components/blog-list";
import PostDetail from "./components/post-detail";
import PostEditor from "./components/post-editor";

// GitHub Pages 배포 시 vite.config.ts의 base와 동일하게 설정
// 예: base가 '/my-blog/'이면 basename도 '/my-blog'
const basename = import.meta.env.BASE_URL;

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: BlogLayout,
      children: [
        { index: true, Component: BlogList },
        { path: "post/:id", Component: PostDetail },
        { path: "write", Component: PostEditor },
      ],
    },
  ],
  { basename: basename === "/" ? undefined : basename.replace(/\/$/, "") }
);
