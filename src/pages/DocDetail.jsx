import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

function Toc({ toc }) {
  return (
    <nav>
      {(toc || []).map((h) => (
        <div key={h.id} style={{ marginLeft: (h.level - 1) * 12, marginBottom: 6 }}>
          <a href={`#${h.id}`}>{h.text}</a>
        </div>
      ))}
    </nav>
  );
}

export default function DocDetail({ slug, onBack }) {
  const [doc, setDoc] = useState(null);
  const [err, setErr] = useState("");

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
          <Toc toc={doc.toc} />
        </aside>
      </div>
    </div>
  );
}
