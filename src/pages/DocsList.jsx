import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function DocsList({ onOpen }) {
  const [docs, setDocs] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("docs")
        .select("id,title,slug,summary,published_at,updated_at")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) setErr(error.message);
      else setDocs(data || []);
    })();
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2>문서</h2>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul style={{ paddingLeft: 16 }}>
        {docs.map((d) => (
          <li key={d.id} style={{ marginBottom: 10 }}>
            <a href="#" onClick={(e) => (e.preventDefault(), onOpen(d.slug))}>
              {d.title || d.slug}
            </a>
            {d.summary && <div style={{ opacity: 0.8 }}>{d.summary}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
