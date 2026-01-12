import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import GIthubSlugger from "github-slugger";

function Toc({ toc, activeId }) {
  return (
    <nav>
      {(toc || []).map((h) => {
        const isActive = h.id === activeId;
        return (
          <div
            key={h.id}
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
      const id = slugger.slug(text); // ★ rehype-slug와 같은 계열 규칙
      return { level, text, id };
    })
    .filter(Boolean);
}, [doc]);


  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("docs")
        .select("title,summary,content,toc,published_at,updated_at")
        .eq("slug", slug)
        .single();

      if (error) setErr(error.message);
      else setDoc(data);
    })();
  }, [slug]);

  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack}>← 목록</button>
        <p style={{ color: "crimson" }}>{err}</p>
      </div>
    );
  }
  useEffect(() => {
  if (!doc?.toc?.length) return;

  const ids = doc.toc.map((t) => t.id);

  // 이미 렌더된 헤더 DOM을 관찰
  const headings = ids
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!headings.length) return;

  // 화면 상단 근처에 들어오는 헤더를 active로 잡기 위한 설정
  const observer = new IntersectionObserver(
    (entries) => {
      // 여러 개가 동시에 들어올 수 있으니 "보이는 것들" 중 상단에 가까운 걸 선택
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    },
    {
      root: null,
      // 상단에서 좀 내려온 지점을 기준으로 활성화 (헤더가 화면 위쪽에 걸리면 active)
      rootMargin: "-20% 0px -70% 0px",
      threshold: [0, 1.0],
    }
  );

  headings.forEach((el) => observer.observe(el));

  // 초기 activeId (페이지 진입 시)
  if (!activeId && headings[0]?.id) setActiveId(headings[0].id);

  return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [doc]);

  if (!doc) return <div style={{ padding: 24 }}>불러오는 중...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <button onClick={onBack}>← 목록</button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 24, marginTop: 12 }}>
        <article>
          <h1 style={{ marginBottom: 8 }}>{doc.title}</h1>
          {doc.summary && <p style={{ opacity: 0.8 }}>{doc.summary}</p>}

          <ReactMarkdown
            rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
          >
            {doc.content || ""}
          </ReactMarkdown>
        </article>

        <aside style={{ position: "sticky", top: 16, height: "fit-content" }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>목차</div>
          <Toc toc={doc.toc} activeId={activeId} />

        </aside>
      </div>
    </div>
  );
}
