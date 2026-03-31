import { FRONT_LABELS, MOCK_USERS, SECTION_ASSIGNMENT_FIELDS } from "@/lib/constants";
import type { ByFrontProjectPayload, CreateProjectPayload, UserOption } from "@/lib/types";

type AsanaProject = {
  gid: string;
  name: string;
  permalink_url?: string;
};

type AsanaTask = {
  gid: string;
  name: string;
  assignee?: { gid: string } | null;
  memberships?: Array<{
    section?: {
      gid?: string;
      name?: string;
    } | null;
  }>;
};

const API_BASE_URL = "https://app.asana.com/api/1.0";

function getEnv(name: string) {
  return process.env[name]?.trim();
}

function isMockMode() {
  return !getEnv("ASANA_ACCESS_TOKEN") || !getEnv("ASANA_TEMPLATE_PROJECT_GID");
}

async function asanaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getEnv("ASANA_ACCESS_TOKEN");

  if (!token) {
    throw new Error("As credenciais do Asana não foram configuradas.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const json = (await response.json()) as { data?: T; errors?: Array<{ message?: string }> };

  if (!response.ok || !json.data) {
    throw new Error(json.errors?.[0]?.message ?? "Falha na integração com o Asana.");
  }

  return json.data;
}

function resolveProjectUrl(project: AsanaProject) {
  return project.permalink_url ?? `https://app.asana.com/0/${project.gid}`;
}

async function duplicateProject(nomeProjeto: string) {
  const templateProjectGid = getEnv("ASANA_TEMPLATE_PROJECT_GID");

  if (!templateProjectGid) {
    throw new Error("ASANA_TEMPLATE_PROJECT_GID não configurado.");
  }

  const workspaceGid = getEnv("ASANA_WORKSPACE_GID");
  const body = {
    data: {
      name: nomeProjeto,
      include: ["members", "notes", "forms", "dates", "task_notes", "task_assignee"],
      ...(workspaceGid ? { team: workspaceGid } : {})
    }
  };

  return asanaFetch<AsanaProject>(`/project_templates/${templateProjectGid}/instantiateProject`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function getProjectTasks(projectGid: string) {
  return asanaFetch<AsanaTask[]>(
    `/projects/${projectGid}/tasks?opt_fields=name,assignee.gid,memberships.section.name,memberships.section.gid`
  );
}

function findAssignmentField(task: AsanaTask) {
  const sectionName = task.memberships?.[0]?.section?.name?.trim();

  if (!sectionName) {
    return null;
  }

  return SECTION_ASSIGNMENT_FIELDS[sectionName as keyof typeof SECTION_ASSIGNMENT_FIELDS] ?? null;
}

async function updateTaskAssignee(taskGid: string, assignee: string) {
  await asanaFetch(`/tasks/${taskGid}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        assignee
      }
    })
  });
}

async function redistributeTasks(projectGid: string, payload: ByFrontProjectPayload) {
  const tasks = await getProjectTasks(projectGid);
  const warnings: string[] = [];
  let reassignedCount = 0;

  for (const task of tasks) {
    const assignmentField = findAssignmentField(task);

    if (!assignmentField) {
      warnings.push(`Tarefa "${task.name}" mantida como no modelo por falta de mapeamento.`);
      continue;
    }

    const assignee = payload[assignmentField];

    if (!assignee) {
      warnings.push(`A frente da tarefa "${task.name}" não recebeu responsável válido.`);
      continue;
    }

    await updateTaskAssignee(task.gid, assignee);
    reassignedCount += 1;
  }

  if (warnings.length > 0) {
    console.warn("Avisos ao redistribuir tarefas:", warnings);
  }

  console.info("Redistribuição concluída", { projectGid, reassignedCount });

  return warnings;
}

function buildMockProject(payload: CreateProjectPayload) {
  const projectId = `mock-${Date.now()}`;

  return {
    projectId,
    projectName: payload.nomeProjeto,
    projectUrl: `https://app.asana.com/0/${projectId}`,
    warnings:
      payload.mode === "by_front"
        ? ["Modo de demonstração ativo: configure as variáveis do Asana para criação real."]
        : ["Modo de demonstração ativo: configure as variáveis do Asana para criação real."]
  };
}

export async function listAssignableUsers(): Promise<UserOption[]> {
  if (isMockMode()) {
    return MOCK_USERS;
  }

  const workspaceGid = getEnv("ASANA_WORKSPACE_GID");

  if (!workspaceGid) {
    throw new Error("ASANA_WORKSPACE_GID não configurado.");
  }

  return asanaFetch<UserOption[]>(`/workspaces/${workspaceGid}/users?opt_fields=name`);
}

export async function createProjectFromTemplate(payload: CreateProjectPayload) {
  if (isMockMode()) {
    return buildMockProject(payload);
  }

  const project = await duplicateProject(payload.nomeProjeto);
  const warnings = payload.mode === "by_front" ? await redistributeTasks(project.gid, payload) : [];

  return {
    projectId: project.gid,
    projectName: project.name,
    projectUrl: resolveProjectUrl(project),
    warnings
  };
}

export function getFrontConfiguration() {
  return FRONT_LABELS;
}
