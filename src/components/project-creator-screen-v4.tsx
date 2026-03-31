"use client";

import { useEffect, useState } from "react";
import { AnimatedProjectButton } from "@/components/animated-project-button";
import { FancySelect } from "@/components/fancy-select";
import { FRONT_LABELS } from "@/lib/constants-v2";
import type { CreateProjectResponse, UserOption } from "@/lib/types";
import styles from "./project-creator-screen-v3.module.css";

type Mode = "fixed" | "by_front";

type FormState = {
  nomeProjeto: string;
  proprietarioProjeto: string;
  responsavelColetaCartao: string;
  responsavelConfiguracaoTecnica: string;
  responsavelIntegracaoCanais: string;
  responsavelPenteFino: string;
  responsavelCampanhas: string;
};

const initialFormState: FormState = {
  nomeProjeto: "",
  proprietarioProjeto: "",
  responsavelColetaCartao: "",
  responsavelConfiguracaoTecnica: "",
  responsavelIntegracaoCanais: "",
  responsavelPenteFino: "",
  responsavelCampanhas: ""
};

export function ProjectCreatorScreenV4() {
  const [mode, setMode] = useState<Mode>("fixed");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [feedback, setFeedback] = useState<CreateProjectResponse | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoadingUsers(true);

      try {
        const response = await fetch("/api/asana/users", { cache: "no-store" });
        const data = (await response.json()) as
          | { success: true; users: UserOption[] }
          | { success: false; message: string };

        if (!active) {
          return;
        }

        if (!response.ok || !data.success) {
          setUsers([]);
          setErrorMessage(data.success ? null : data.message);
          return;
        }

        setUsers(data.users);
      } catch {
        if (active) {
          setErrorMessage("Não foi possível carregar a lista de responsáveis.");
        }
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!submitting) {
      return;
    }

    setProgressVisible(true);
    setProgress((current) => (current > 8 ? current : 8));

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) {
          return current;
        }

        if (current < 28) {
          return Math.min(92, current + 7);
        }

        if (current < 58) {
          return Math.min(92, current + 4);
        }

        if (current < 80) {
          return Math.min(92, current + 2.2);
        }

        return Math.min(92, current + 0.8);
      });
    }, 420);

    return () => {
      window.clearInterval(interval);
    };
  }, [submitting]);

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  function handleBrandClick() {
    window.location.reload();
  }

  function wait(milliseconds: number) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProgress(8);
    setProgressVisible(true);
    setSubmitting(true);
    setFeedback(null);
    setWarnings([]);
    setErrorMessage(null);

    const payload =
      mode === "fixed"
        ? {
          mode,
          nomeProjeto: formState.nomeProjeto,
          proprietarioProjeto: formState.proprietarioProjeto
        }
        : {
          mode,
          ...formState
        };

    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as CreateProjectResponse;

      if (!response.ok || !data.success) {
        setFeedback(null);
        setErrorMessage(data.success ? null : data.message);
        return;
      }

      setFeedback(data);
      setWarnings(data.warnings);
    } catch {
      setErrorMessage("Não foi possível concluir o envio agora. Tente novamente.");
    } finally {
      setProgress(100);
      await wait(620);
      setSubmitting(false);
      window.setTimeout(() => {
        setProgressVisible(false);
        setProgress(0);
      }, 320);
    }
  }

  const usersDisabled = loadingUsers || users.length === 0;
  const progressBoxClassName = [
    styles.progressBox,
    progressVisible ? styles.progressBoxVisible : styles.progressBoxHidden
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>Asana-Creator</div>
          <div className={styles.topbarActions}>
            <button
              className={styles.topIconButton}
              type="button"
              aria-label="Recarregar página"
              onClick={handleBrandClick}
            >
              <img
                src="/logo.png"
                alt="Edifica"
                style={{ height: 35, width: "auto", filter: "brightness(0) invert(1)" }}
              />
            </button>
          </div>
        </div>
        <div className={styles.topbarRule} />
      </header>

      <section className={styles.main}>
        <div className={styles.centerCol}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Criar projeto</h1>
            <p className={styles.subtitle}>
              Escolha um modelo de atribuição para gerar seu novo projeto.
            </p>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Modelos de atribuição">
            <button
              aria-selected={mode === "fixed"}
              className={mode === "fixed" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setMode("fixed")}
              role="tab"
              type="button"
            >
              Responsáveis padrão
            </button>
            <button
              aria-selected={mode === "by_front"}
              className={mode === "by_front" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setMode("by_front")}
              role="tab"
              type="button"
            >
              Responsáveis por seção
            </button>
          </div>

          <div className={styles.cardWrap}>
            <div className={styles.cardShadow} />
            <div className={styles.card}>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="nomeProjeto">
                    Nome do projeto
                  </label>
                  <input
                    className={styles.input}
                    id="nomeProjeto"
                    onChange={(event) => updateField("nomeProjeto", event.target.value)}
                    placeholder="Ex: Nome do escritório"
                    required
                    value={formState.nomeProjeto}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="proprietarioProjeto">
                    Proprietário do projeto
                  </label>
                  <FancySelect
                    disabled={usersDisabled}
                    id="proprietarioProjeto"
                    onChange={(value) => updateField("proprietarioProjeto", value)}
                    options={users}
                    placeholder={
                      loadingUsers ? "Carregando responsáveis..." : "Selecionar proprietário..."
                    }
                    value={formState.proprietarioProjeto}
                  />
                </div>

                {mode === "by_front" ? (
                  <>
                    {FRONT_LABELS.map((front) => (
                      <div className={styles.fieldGroup} key={front.field}>
                        <label className={styles.label} htmlFor={front.field}>
                          {front.field === "responsavelColetaCartao"
                            ? "Responsável pela coleta do cartão"
                            : front.field === "responsavelConfiguracaoTecnica"
                              ? "Responsável pela configuração técnica"
                              : front.field === "responsavelIntegracaoCanais"
                                ? "Responsável pela integração de canais"
                                : front.field === "responsavelPenteFino"
                                  ? "Responsável pelo pente fino"
                                  : "Responsável por subir as campanhas"}
                        </label>
                        <FancySelect
                          disabled={usersDisabled}
                          id={front.field}
                          onChange={(value) => updateField(front.field, value)}
                          options={users}
                          placeholder={
                            loadingUsers ? "Carregando responsáveis..." : "Selecionar responsável..."
                          }
                          value={formState[front.field]}
                        />
                      </div>
                    ))}
                  </>
                ) : null}

                <p className={styles.helperText}>
                  {mode === "fixed"
                    ? "Mantém os responsáveis padrão do modelo e aplica o proprietário selecionado."
                    : "Define manualmente os responsáveis por cada seção e aplica o proprietário."}
                </p>

                {errorMessage ? <div className={styles.errorBox}>{errorMessage}</div> : null}

                {feedback?.success ? (
                  <div className={styles.successBox}>
                    <div className={styles.successHeader}>
                      <span className={`material-symbols-outlined ${styles.successIcon}`}>
                        check_circle
                      </span>
                      <div className={styles.successCopy}>
                        <strong>Projeto criado com sucesso</strong>
                        <p className={styles.successSummary}>
                          O novo projeto já está pronto no Asana.
                        </p>
                      </div>
                    </div>
                    <a href={feedback.projectUrl} rel="noreferrer" target="_blank">
                      Abrir projeto no Asana
                    </a>
                    {warnings.length > 0 ? (
                      <ul className={styles.warningList}>
                        {warnings.map((warning, index) => (
                          <li key={`warning-${index}`}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <AnimatedProjectButton busy={submitting} disabled={submitting} type="submit" />

                <div className={progressBoxClassName} aria-live="polite">
                  <div className={styles.progressHeader}>
                    <span className={styles.progressLabel}>Criando projeto no Asana</span>
                    <span className={styles.progressValue}>{Math.round(progress)}%</span>
                  </div>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 Asana-Creator.</span>
          <div className={styles.footerLinks}>
            <a
              href="https://formulario.edificajuridico.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Edifica Leads
            </a>
            <a href="https://app.asana.com/" target="_blank" rel="noopener noreferrer">
              Asana
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
