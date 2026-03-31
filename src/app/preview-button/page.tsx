"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedProjectButton } from "@/components/animated-project-button";
import styles from "./page.module.css";

function getProgressEstimate(progress: number) {
  if (progress >= 100) {
    return "Concluindo a criação no Asana";
  }

  if (progress >= 86) {
    return "Finalizando. Deve concluir em instantes";
  }

  if (progress >= 62) {
    return "Etapa avançada. Tempo estimado restante: menos de 1 minuto";
  }

  if (progress >= 34) {
    return "Processando no Asana. Tempo estimado restante: cerca de 1 minuto";
  }

  return "Iniciando a criação. Tempo estimado restante: cerca de 2 minutos";
}

export default function PreviewButtonPage() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 94) {
          return current;
        }

        if (current < 34) {
          return Math.min(94, current + 8);
        }

        if (current < 68) {
          return Math.min(94, current + 4.5);
        }

        return Math.min(94, current + 1.2);
      });
    }, 360);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  }

  function handleTogglePreview() {
    if (loading || resetting) {
      return;
    }

    clearTimers();

    if (successVisible) {
      setResetting(true);
      setSuccessVisible(false);
      setProgressVisible(true);
      setProgress(100);

      schedule(() => {
        setProgress(18);
      }, 120);

      schedule(() => {
        setProgressVisible(false);
      }, 340);

      schedule(() => {
        setProgress(0);
        setResetting(false);
      }, 760);
      return;
    }

    setProgress(10);
    setProgressVisible(true);
    setSuccessVisible(false);
    setLoading(true);

    schedule(() => {
      setProgress(100);

      schedule(() => {
        setLoading(false);

        schedule(() => {
          setProgressVisible(false);
          setSuccessVisible(true);

          schedule(() => {
            setProgress(0);
          }, 360);
        }, 280);
      }, 520);
    }, 3400);
  }

  const progressBoxClassName = [
    styles.progressBox,
    progressVisible ? styles.progressBoxVisible : styles.progressBoxHidden
  ]
    .filter(Boolean)
    .join(" ");
  const successBoxClassName = [
    styles.successBox,
    successVisible ? styles.successBoxVisible : styles.successBoxHidden
  ]
    .filter(Boolean)
    .join(" ");
  const progressEstimate = getProgressEstimate(progress);

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Preview</p>
        <h1 className={styles.title}>Botão de criação</h1>
        <p className={styles.text}>
          Esta tela mostra a animação real de loading do botão, incluindo gradiente, foguete,
          fumaça, barra de progresso e o estado final de sucesso.
        </p>

        <AnimatedProjectButton busy={loading || resetting} onClick={handleTogglePreview} />

        <div className={progressBoxClassName} aria-live="polite">
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Criando projeto no Asana</span>
            <span className={styles.progressValue}>{Math.round(progress)}%</span>
          </div>
          <div className={styles.progressTrack} aria-hidden="true">
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressHint}>
            {progressEstimate}
            <span className={styles.progressHintDots} aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        </div>

        <div className={successBoxClassName}>
          <div className={styles.successHeader}>
            <span className={`material-symbols-outlined ${styles.successIcon}`}>
              check_circle
            </span>
            <div className={styles.successCopy}>
              <strong>Projeto criado com sucesso</strong>
              <p className={styles.successText}>
                O cartão final aparece com a mesma direção visual do fluxo principal, fechando a
                interação de forma elegante e suave.
              </p>
            </div>
          </div>
          <a href="#" onClick={(event) => event.preventDefault()}>
            Abrir projeto no Asana
          </a>
        </div>
      </section>
    </main>
  );
}
