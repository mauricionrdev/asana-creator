"use client";

import { useEffect, useState } from "react";
import { FRONT_LABELS } from "@/lib/constants";
import type { CreateProjectResponse, UserOption } from "@/lib/types";
import styles from "./project-creator-screen.module.css";

type Mode = "fixed" | "by_front";

type FormState = {
  nomeProjeto: string;
  responsavelColetaCartao: string;
  responsavelConfiguracaoTecnica: string;
  responsavelIntegracaoCanais: string;
  responsavelPenteFino: string;
  responsavelCampanhas: string;
};

const initialFormState: FormState = {
  nomeProjeto: "",
  responsavelColetaCartao: "",
  responsavelConfiguracaoTecnica: "",
  responsavelIntegracaoCanais: "",
  responsavelPenteFino: "",
  responsavelCampanhas: ""
};

export function ProjectCreatorScreen() {
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

        if (!active) {
          return;
        }

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
          nomeProjeto: formState.nomeProjeto
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
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.brand}>Asana-Creator</p>
          </div>
          <nav className={styles.nav}>
            <span>Projetos</span>
            <span>Modelos</span>
            <span>Suporte</span>
          </nav>
        </header>

        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Arquiteto silencioso</p>
            <h1>Novo Projeto</h1>
            <p className={styles.subtitle}>
              Crie um projeto no Asana a partir do modelo oficial, com responsáveis fixos ou
              redistribuição por frente.
            </p>
          </div>
          <div className={styles.heroCard}>
            <span>Projeto-modelo centralizado</span>
            <strong>Fluxo pronto para operação interna</strong>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.tabRow}>
            <button
              className={mode === "fixed" ? styles.activeTab : styles.tab}
              onClick={() => setMode("fixed")}
              type="button"
            >
              Responsáveis fixos
            </button>
            <button
              className={mode === "by_front" ? styles.activeTab : styles.tab}
              onClick={() => setMode("by_front")}
              type="button"
            >
              Responsáveis por frente
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.primaryCard}>
              <label className={styles.fieldLabel} htmlFor="nomeProjeto">
                Nome do projeto
              </label>
              <input
                className={styles.projectInput}
                id="nomeProjeto"
                onChange={(event) => updateField("nomeProjeto", event.target.value)}
                placeholder="Ex: Implantação Clínica Horizonte"
                required
                value={formState.nomeProjeto}
              />
              <p className={styles.helperText}>
                {mode === "fixed"
                  ? "Este modo mantém os responsáveis originais já definidos no modelo."
                  : "Este modo redistribui as tarefas com base na seção de cada frente."}
              </p>
            </div>

            {mode === "by_front" ? (
              <div className={styles.grid}>
                {FRONT_LABELS.map((front) => (
                  <label className={styles.selectCard} key={front.field}>
                    <span className={styles.cardLabel}>{front.label}</span>
                    <select
                      className={styles.select}
                      disabled={byFrontDisabled}
                      onChange={(event) =>
                        updateField(front.field, event.target.value)
                      }
                      required={mode === "by_front"}
                      value={formState[front.field]}
                    >
                      <option value="">
                        {loadingUsers ? "Carregando responsáveis..." : "Selecionar responsável"}
                      </option>
                      {users.map((user) => (
                        <option key={user.gid} value={user.gid}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <small className={styles.sectionHint}>{front.sectionName}</small>
                  </label>
                ))}
              </div>
            ) : null}

            {errorMessage ? <div className={styles.errorBox}>{errorMessage}</div> : null}

            {feedback?.success ? (
              <div className={styles.successBox}>
                <strong>Projeto criado com sucesso.</strong>
                <a href={feedback.projectUrl} rel="noreferrer" target="_blank">
                  Abrir projeto no Asana
                </a>
                {warnings.length > 0 ? (
                  <ul className={styles.warningList}>
                    {warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.submitButton} disabled={submitting} type="submit">
                {submitting ? "Criando projeto ..." : "Criar projeto"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
