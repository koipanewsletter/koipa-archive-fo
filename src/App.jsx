import { useState } from "react";
import DocsList from "./pages/DocsList";
import DocDetail from "./pages/DocDetail";

export default function App() {
  const [slug, setSlug] = useState(null);

  return slug ? (
    <DocDetail slug={slug} onBack={() => setSlug(null)} />
  ) : (
    <DocsList onOpen={(s) => setSlug(s)} />
  );
}
