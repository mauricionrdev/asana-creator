import { MOCK_USERS, OWNER_SECTION_NAMES, SECTION_ASSIGNMENT_FIELDS } from "@/lib/constants-v2";
import type { ByFrontProjectPayload, CreateProjectPayload, UserOption } from "@/lib/types";

type AsanaProject = {
  gid: string;
  name: string;
  permalink_url?: string;
  created_at?: string;
};

type AsanaTaskCounts = {
  num_tasks?: number;
  num_completed_tasks?: number;
};

type AsanaJob = {
  gid: string;
  status: "not_started" | "in_progress" | "completed" | "failed" | "succeeded";
  new_project?: AsanaProject;
  errors?: Array<{ message?: string }>;
};

type AsanaListResponse<T> = {
  data?: T[];
  next_page?: {
    path?: string | null;
  } | null;
  errors?: Array<{ message?: string }>;
};

type AsanaTask = {
  gid: string;
  name: string;
  completed?: boolean;
  due_on?: string | null;
  due_at?: string | null;
  start_on?: string | null;
  start_at?: string | null;
  num_subtasks?: number;
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
    throw new Error("As credenciais do Asana nao foram configuradas.");
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

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || !json.data) {
    throw new Error(json.errors?.[0]?.message ?? "Falha na integracao com o Asana.");
  }

  return json.data;
}

async function asanaFetchAllPages<T>(path: string): Promise<T[]> {
  const token = getEnv("ASANA_ACCESS_TOKEN");

  if (!token) {
    throw new Error("As credenciais do Asana nao foram configuradas.");
  }

  const items: T[] = [];
  let nextPath: string | null = path.includes("limit=")
    ? path
    : `${path}${path.includes("?") ? "&" : "?"}limit=100`;

  while (nextPath) {
    const response = await fetch(`${API_BASE_URL}${nextPath}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    const json = (await response.json()) as AsanaListResponse<T>;

    if (!response.ok || !json.data) {
      throw new Error(json.errors?.[0]?.message ?? "Falha na integracao com o Asana.");
    }

    items.push(...json.data);
    nextPath = json.next_page?.path ?? null;
  }

  return items;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getProject(projectGid: string) {
  return asanaFetch<AsanaProject>(`/projects/${projectGid}?opt_fields=name,permalink_url,created_at`);
}

async function updateProjectOwner(projectGid: string, ownerGid: string) {
  await asanaFetch(`/projects/${projectGid}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        owner: ownerGid
      }
    })
  });
}

async function getProjectTaskCounts(projectGid: string) {
  return asanaFetch<AsanaTaskCounts>(
    `/projects/${projectGid}/task_counts?opt_fields=num_tasks,num_completed_tasks`
  );
}

async function waitForDuplicateJob(jobGid: string) {
  const timeoutAt = Date.now() + 120000;
  let lastSeenProjectGid: string | null = null;

  while (Date.now() < timeoutAt) {
    const job = await asanaFetch<AsanaJob>(`/jobs/${jobGid}`);
    const currentProjectGid = job.new_project?.gid ?? null;

    if (currentProjectGid) {
      lastSeenProjectGid = currentProjectGid;
    }

    console.info("Status do job de duplicacao", {
      jobGid,
      status: job.status,
      newProjectId: currentProjectGid,
      lastSeenProjectGid
    });

    if ((job.status === "completed" || job.status === "succeeded") && lastSeenProjectGid) {
      return getProject(lastSeenProjectGid);
    }

    if (job.status === "failed") {
      throw new Error(job.errors?.[0]?.message ?? "A duplicacao do projeto falhou no Asana.");
    }

    await sleep(2000);
  }

  throw new Error("A duplicacao do projeto excedeu o tempo limite de espera.");
}

async function findProjectByNameInWorkspace(projectName: string) {
  const workspaceGid = getEnv("ASANA_WORKSPACE_GID");

  if (!workspaceGid) {
    throw new Error("ASANA_WORKSPACE_GID nao configurado.");
  }

  const projects = await asanaFetchAllPages<AsanaProject>(
    `/workspaces/${workspaceGid}/projects?archived=false&opt_fields=name,permalink_url,created_at`
  );

  const exactMatches = projects
    .filter((project) => project.name.trim() === projectName.trim())
    .sort((a, b) => {
      const left = new Date(a.created_at ?? 0).getTime();
      const right = new Date(b.created_at ?? 0).getTime();
      return right - left;
    });

  return exactMatches[0] ?? null;
}

async function duplicateProjectFromSource(nomeProjeto: string) {
  const sourceProjectGid = getEnv("ASANA_TEMPLATE_PROJECT_GID");

  if (!sourceProjectGid) {
    throw new Error("ASANA_TEMPLATE_PROJECT_GID nao configurado.");
  }

  const job = await asanaFetch<AsanaJob>(`/projects/${sourceProjectGid}/duplicate`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        name: nomeProjeto,
        include: [
          "members",
          "notes",
          "forms",
          "task_notes",
          "task_assignee",
          "task_dates",
          "task_subtasks",
          "task_dependencies"
        ]
      }
    })
  });

  console.info("Job de duplicacao criado", {
    sourceProjectGid,
    nomeProjeto,
    jobGid: job.gid
  });

  try {
    return await waitForDuplicateJob(job.gid);
  } catch (error) {
    console.warn("Job do Asana nao retornou projeto finalizado a tempo. Tentando localizar pelo workspace.", {
      nomeProjeto,
      message: error instanceof Error ? error.message : String(error)
    });

    const fallbackProject = await findProjectByNameInWorkspace(nomeProjeto);

    if (fallbackProject) {
      console.info("Projeto localizado por fallback no workspace", {
        projectId: fallbackProject.gid,
        projectName: fallbackProject.name
      });
      return fallbackProject;
    }

    throw error;
  }
}

async function waitForProjectTasksToBeReady(projectGid: string, expectedTaskCount: number) {
  const timeoutAt = Date.now() + 120000;

  while (Date.now() < timeoutAt) {
    const counts = await getProjectTaskCounts(projectGid);
    const currentTaskCount = counts.num_tasks ?? 0;

    console.info("Aguardando tarefas do projeto duplicado", {
      projectGid,
      expectedTaskCount,
      currentTaskCount
    });

    if (currentTaskCount >= expectedTaskCount && currentTaskCount > 0) {
      return;
    }

    await sleep(2500);
  }

  throw new Error("O projeto foi criado, mas as tarefas nao ficaram disponiveis a tempo.");
}

async function getProjectTasks(projectGid: string) {
  return asanaFetchAllPages<AsanaTask>(
    `/tasks?project=${projectGid}&completed_since=1970-01-01T00:00:00.000Z&opt_fields=name,completed,due_on,due_at,start_on,start_at,num_subtasks,memberships.section.name,memberships.section.gid`
  );
}

async function getSubtasks(taskGid: string) {
  return asanaFetchAllPages<AsanaTask>(
    `/tasks/${taskGid}/subtasks?completed_since=1970-01-01T00:00:00.000Z&opt_fields=name,completed,due_on,due_at,start_on,start_at,num_subtasks`
  );
}

function findAssignmentField(task: AsanaTask) {
  const sectionName = task.memberships?.[0]?.section?.name?.trim();

  if (!sectionName) {
    return null;
  }

  const normalizedSectionName = sectionName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return (
    SECTION_ASSIGNMENT_FIELDS[
      normalizedSectionName as keyof typeof SECTION_ASSIGNMENT_FIELDS
    ] ?? null
  );
}

function isOwnerSection(task: AsanaTask) {
  const sectionName = task.memberships?.[0]?.section?.name?.trim();

  if (!sectionName) {
    return false;
  }

  const normalizedSectionName = sectionName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return OWNER_SECTION_NAMES.some(
    (candidate) =>
      candidate
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() === normalizedSectionName
  );
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

function getRenamedTaskTitle(taskName: string, projectName: string) {
  if (/^implementa[cç][aã]o\s*-\s*.+/i.test(taskName.trim())) {
    return `Implementação - ${projectName}.`;
  }

  return null;
}

function getNormalizedImplementationTitle(taskName: string, projectName: string) {
  const normalizedName = taskName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalizedName.startsWith("implementacao -")) {
    return `Implementação - ${projectName}.`;
  }

  return getRenamedTaskTitle(taskName, projectName);
}

async function normalizeTask(task: AsanaTask, projectName: string) {
  const nextName = getNormalizedImplementationTitle(task.name, projectName);

  await asanaFetch(`/tasks/${task.gid}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        completed: false,
        due_on: null,
        due_at: null,
        start_on: null,
        start_at: null,
        ...(nextName ? { name: nextName } : {})
      }
    })
  });

  if ((task.num_subtasks ?? 0) > 0) {
    const subtasks = await getSubtasks(task.gid);

    for (const subtask of subtasks) {
      await normalizeTask(subtask, projectName);
    }
  }
}

async function redistributeTasks(projectGid: string, payload: ByFrontProjectPayload) {
  const tasks = await getProjectTasks(projectGid);
  const warnings: string[] = [];

  for (const task of tasks) {
    if (isOwnerSection(task)) {
      await updateTaskAssignee(task.gid, payload.proprietarioProjeto);
      continue;
    }

    const assignmentField = findAssignmentField(task);

    if (!assignmentField) {
      warnings.push(`Tarefa "${task.name}" mantida como no modelo por falta de mapeamento.`);
      continue;
    }

    await updateTaskAssignee(task.gid, payload[assignmentField]);
  }

  return warnings;
}

async function sanitizeDuplicatedProject(projectGid: string, projectName: string) {
  const tasks = await getProjectTasks(projectGid);

  console.info("Sanitizando projeto duplicado", {
    projectGid,
    projectName,
    totalTasks: tasks.length,
    sampleTasks: tasks.slice(0, 5).map((task) => task.name)
  });

  for (const task of tasks) {
    await normalizeTask(task, projectName);
  }
}

function resolveProjectUrl(project: AsanaProject) {
  return project.permalink_url ?? `https://app.asana.com/0/${project.gid}`;
}

function buildMockProject(payload: CreateProjectPayload) {
  const projectId = `mock-${Date.now()}`;

  return {
    projectId,
    projectName: payload.nomeProjeto,
    projectUrl: `https://app.asana.com/0/${projectId}`,
    warnings: ["Modo de demonstracao ativo: configure as variaveis do Asana para criacao real."]
  };
}

export async function listAssignableUsers(): Promise<UserOption[]> {
  if (isMockMode()) {
    return MOCK_USERS;
  }

  const workspaceGid = getEnv("ASANA_WORKSPACE_GID");

  if (!workspaceGid) {
    throw new Error("ASANA_WORKSPACE_GID nao configurado.");
  }

  return asanaFetch<UserOption[]>(`/workspaces/${workspaceGid}/users?opt_fields=name`);
}

export async function createProjectFromTemplate(payload: CreateProjectPayload) {
  if (isMockMode()) {
    return buildMockProject(payload);
  }

  const sourceProjectGid = getEnv("ASANA_TEMPLATE_PROJECT_GID");
  console.info("Iniciando duplicacao do projeto", {
    sourceProjectGid,
    mode: payload.mode,
    nomeProjeto: payload.nomeProjeto
  });
  const sourceCounts = sourceProjectGid ? await getProjectTaskCounts(sourceProjectGid) : undefined;
  console.info("Contagem do projeto-base", {
    sourceProjectGid,
    numTasks: sourceCounts?.num_tasks ?? null,
    numCompletedTasks: sourceCounts?.num_completed_tasks ?? null
  });
  const project = await duplicateProjectFromSource(payload.nomeProjeto);
  console.info("Projeto duplicado", {
    projectId: project.gid,
    projectName: project.name
  });
  await waitForProjectTasksToBeReady(project.gid, sourceCounts?.num_tasks ?? 1);
  console.info("Atualizando proprietario do projeto", {
    projectId: project.gid,
    owner: payload.proprietarioProjeto
  });
  await updateProjectOwner(project.gid, payload.proprietarioProjeto);
  await sanitizeDuplicatedProject(project.gid, payload.nomeProjeto);
  console.info("Sanitizacao concluida", {
    projectId: project.gid
  });
  const warnings = payload.mode === "by_front" ? await redistributeTasks(project.gid, payload) : [];
  console.info("Fluxo de criacao concluido", {
    projectId: project.gid,
    warnings: warnings.length
  });

  return {
    projectId: project.gid,
    projectName: project.name,
    projectUrl: resolveProjectUrl(project),
    warnings
  };
}
