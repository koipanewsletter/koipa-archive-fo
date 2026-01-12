import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import GithubSlugger from "github-slugger";

function Toc({ toc, activeId }) {
  return (
    <nav>
      {(toc || []).map((h) => {
        const isActive = h.id === activeId;
        return (
          <div
            key={`${h.id}-${h.level}-${h.text}`}
            style={{
              marginLeft: (h.level - 1) * 12,
              marginBottom: 6,
              fontWeight: isActive ? 700 : 400,
              opacity: isActive ? 1 : 0.75,
            }}
          >
            <a
              href={`#${h.id}`}
              style={{
                textDecoration: "none",
              }}
            >
              {h.text}
            </a>
          </div>
        );
      })}
    </nav>
  );
}

export default function DocDetail({ slug, onBack }) {
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");
  const [activeId, setActiveId] = useState(null);

  // ✅ doc.content로 TOC를 "FO에서" 다시 계산 (rehype-slug와 동일 계열 slug 규칙)
  const toc = useMemo(() => {
    if (!doc?.content) return [];
    const slugger = new GithubSlugger();

    return doc.content
      .split("\n")
      .map((line) => line.trim())
      .map((line) => {
        const m = /^(#{1,3})\s+(.+)$/.exec(line);
        if (!m) return null;
        const level = m[1].length;
        const text = m[2].trim();
        const id = slugger.slug(text);
        return { level, text, id };
      })
      .filter(Boolean);
  }, [doc]);

  // ✅ 문서 로드
  useEffect(() => {
    (async () => {
      setErr("");
      setDoc(null);

      const { data, error } = await supabase
        .from("docs")
        .select("title,summary,content,published_at,updated_at,status")
        .eq("slug", slug)
        .single();

      if (error) setErr(error.message);
      else setDoc(data);
    })();
  }, [slug]);

  // ✅ 스크롤 스파이: 실제 DOM 헤더를 관찰해서 activeId 갱신
  useEffect(() => {
    if (!toc?.length) return;

    const ids = toc.map((t) => t.id);
    const headings = ids.map((id) => document.getElementById(id)).filter(Boolean);

    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0)
          );

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 1.0],
      }
    );

    headings.forEach((el) => observer.observe(el));

    // 최초 진입 시 active 기본값
    if (headings[0]?.id) setActiveId(headings[0].id);

    return () => observer.disconnect();
  }, [toc]);

  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack}>← 목록</button>
        <p style={{ color: "crimson" }}>{err}</p>
      </div>
    );
  }

  if (!doc) return <div style={{ padding: 24 }}>불러오는 중...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <button onClick={onBack}>← 목록</button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: 24,
          marginTop: 12,
        }}
      >
        <article>
          <h1 style={{ marginBottom: 8 }}>{doc.title}</h1>
          {doc.summary && <p style={{ opacity: 0.8 }}>{doc.summary}</p>}

          <ReactMarkdown
            rehypePlugins={[
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: "wrap" }],
            ]}
          >
            {doc.content || ""}
          </ReactMarkdown>
        </article>

        <aside style={{ position: "sticky", top: 16, height: "fit-content" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>목차</div>
          <Toc toc={toc} activeId={activeId} />
        </aside>
      </div>
    </div>
  );
}
