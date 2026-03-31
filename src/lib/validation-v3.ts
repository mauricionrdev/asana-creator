import { FRONT_LABELS } from "@/lib/constants-v2";
import type { CreateProjectPayload } from "@/lib/types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function sanitizeProjectName(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export function validatePayload(payload: unknown): {
  valid: boolean;
  errors: string[];
  data?: CreateProjectPayload;
} {
  if (typeof payload !== "object" || payload === null) {
    return { valid: false, errors: ["Payload inválido."] };
  }

  const candidate = payload as Record<string, unknown>;
  const nomeProjeto = isNonEmptyString(candidate.nomeProjeto)
    ? sanitizeProjectName(candidate.nomeProjeto)
    : "";

  if (!isNonEmptyString(candidate.mode)) {
    return { valid: false, errors: ["O modo de criação é obrigatório."] };
  }

  if (!nomeProjeto) {
    return { valid: false, errors: ["O nome do projeto é obrigatório."] };
  }

  if (!isNonEmptyString(candidate.proprietarioProjeto)) {
    return { valid: false, errors: ["O proprietário do projeto é obrigatório."] };
  }

  if (candidate.mode === "fixed") {
    return {
      valid: true,
      errors: [],
      data: {
        mode: "fixed",
        nomeProjeto,
        proprietarioProjeto: String(candidate.proprietarioProjeto)
      }
    };
  }

  if (candidate.mode === "by_front") {
    const missing = FRONT_LABELS.filter(({ field }) => !isNonEmptyString(candidate[field])).map(
      ({ label }) => label
    );

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Preencha todos os responsáveis obrigatórios. Faltando: ${missing.join(", ")}.`]
      };
    }

    return {
      valid: true,
      errors: [],
      data: {
        mode: "by_front",
        nomeProjeto,
        proprietarioProjeto: String(candidate.proprietarioProjeto),
        responsavelColetaCartao: String(candidate.responsavelColetaCartao),
        responsavelConfiguracaoTecnica: String(candidate.responsavelConfiguracaoTecnica),
        responsavelIntegracaoCanais: String(candidate.responsavelIntegracaoCanais),
        responsavelPenteFino: String(candidate.responsavelPenteFino),
        responsavelCampanhas: String(candidate.responsavelCampanhas)
      }
    };
  }

  return { valid: false, errors: ["Modo de criação desconhecido."] };
}
