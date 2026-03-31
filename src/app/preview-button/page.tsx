 "use client";

import { useState } from "react";
import { AnimatedProjectButton } from "@/components/animated-project-button";
import styles from "./page.module.css";

export default function PreviewButtonPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Preview</p>
        <h1 className={styles.title}>Botão de criação</h1>
        <p className={styles.text}>
          Esta tela mostra a animação real de loading do botão, incluindo gradiente, foguete e fumaça.
        </p>

        <AnimatedProjectButton busy={loading} onClick={() => setLoading((current) => !current)} />
      </section>
    </main>
  );
}
