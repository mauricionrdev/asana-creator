"use client";

import { useEffect, useState } from "react";
import { FRONT_LABELS } from "@/lib/constants-v2";
import type { CreateProjectResponse, UserOption } from "@/lib/types";
import styles from "./project-creator-screen-v2.module.css";

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

function Icon({ name, filled = false, className }: { name: string; filled?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className ?? ""}`.trim()}
      style={{
        fontFamily: '"Material Symbols Outlined"',
        fontWeight: 'normal',
        fontStyle: 'normal',
        lineHeight: 1,
        display: 'inline-block',
        textTransform: 'none',
        letterSpacing: 'normal',
        whiteSpace: 'nowrap',
        direction: 'ltr',
        WebkitFontSmoothing: 'antialiased',
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24"
      }}
    >
      {name}
    </span>
  );
}

export function ProjectCreatorScreenV2() {
  const [mode, setMode] = useState<Mode>("fixed");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

        if (!active) return;

        if (!response.ok || !data.success) {
          setErrorMessage(data.success ? null : data.message);
          setUsers([]);
          return;
        }

        setUsers(data.users);
      } catch {
        if (active) {
          setErrorMessage("Não foi possível carregar a lista de responsáveis.");
        }
      } finally {
        if (active) setLoadingUsers(false);
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      setSubmitting(false);
    }
  }

  const byFrontDisabled = loadingUsers || users.length === 0;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>Asana-Creator</div>
          <div className={styles.topbarActions}>
            <button className={styles.topIconButton} type="button" aria-label="Edifica">
              <img src="/logo.png" alt="Edifica" style={{ height: 35, width: "auto", filter: "brightness(0) invert(1)" }} />
            </button>
          </div>
        </div>
        <div className={styles.topbarRule} />
      </header>

      <section className={styles.main}>
        <div className={styles.centerCol}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Criar projeto</h1>
            <p className={styles.subtitle}>Escolha um modelo de atribuição para gerar seu novo projeto.</p>
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
                    placeholder="Ex: Nome do Escritório"
                    required
                    value={formState.nomeProjeto}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="proprietarioProjeto">
                    Proprietário do projeto
                  </label>
                  <div className={styles.selectWrap}>
                    <select
                      className={styles.select}
                      disabled={loadingUsers || users.length === 0}
                      id="proprietarioProjeto"
                      onChange={(event) => updateField("proprietarioProjeto", event.target.value)}
                      required
                      value={formState.proprietarioProjeto}
                    >
                      <option value="">
                        {loadingUsers ? "Carregando responsáveis..." : "Selecionar proprietário..."}
                      </option>
                      {users.map((user) => (
                        <option key={`owner-${user.gid}`} value={user.gid}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <span aria-hidden="true" className={styles.chevron}>▾</span>
                  </div>
                </div>

                {mode === "by_front" ? (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.label} htmlFor="proprietarioProjeto">
                        Proprietário do projeto
                      </label>
                      <div className={styles.selectWrap}>
                        <select
                          className={styles.select}
                          disabled={byFrontDisabled}
                          id="proprietarioProjeto"
                          onChange={(event) => updateField("proprietarioProjeto", event.target.value)}
                          required
                          value={formState.proprietarioProjeto}
                        >
                          <option value="">
                            {loadingUsers ? "Carregando responsáveis..." : "Selecionar proprietário..."}
                          </option>
                          {users.map((user) => (
                            <option key={`owner-${user.gid}`} value={user.gid}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                        <span aria-hidden="true" className={styles.chevron}>▾</span>
                      </div>
                    </div>

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
                        <div className={styles.selectWrap}>
                          <select
                            className={styles.select}
                            disabled={byFrontDisabled}
                            id={front.field}
                            onChange={(event) => updateField(front.field, event.target.value)}
                            required
                            value={formState[front.field]}
                          >
                            <option value="">
                              {loadingUsers ? "Carregando responsáveis..." : "Selecionar responsável..."}
                            </option>
                            {users.map((user) => (
                              <option key={`${front.field}-${user.gid}`} value={user.gid}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                          <span aria-hidden="true" className={styles.chevron}>▾</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : null}

                <p className={styles.helperText}>
                  {mode === "fixed"
                    ? "Usa os responsáveis padrão já definidos no modelo do projeto."
                    : "Define manualmente os responsáveis por cada seção do projeto."}
                </p>

                {errorMessage ? <div className={styles.errorBox}>{errorMessage}</div> : null}

                {feedback?.success ? (
                  <div className={styles.successBox}>
                    <strong>Projeto criado com sucesso.</strong>
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

                <button className={styles.submitButton} disabled={submitting} type="submit">
                  <Icon name="rocket_launch" filled className={styles.buttonIcon} />
                  <span>{submitting ? "Criando projeto ..." : "Criar projeto"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>© 2026 Asana-Creator.</span>
          <div className={styles.footerLinks}>
            <a href="https://formulario.edificajuridico.com/" target="_blank" rel="noopener noreferrer">
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
