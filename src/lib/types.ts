export type CreateMode = "fixed" | "by_front";

export type AssignmentField =
  | "responsavelColetaCartao"
  | "responsavelConfiguracaoTecnica"
  | "responsavelIntegracaoCanais"
  | "responsavelPenteFino"
  | "responsavelCampanhas";

export type FixedProjectPayload = {
  mode: "fixed";
  nomeProjeto: string;
  proprietarioProjeto: string;
};

export type ByFrontProjectPayload = {
  mode: "by_front";
  nomeProjeto: string;
  proprietarioProjeto: string;
} & Record<AssignmentField, string>;

export type CreateProjectPayload = FixedProjectPayload | ByFrontProjectPayload;

export type UserOption = {
  gid: string;
  name: string;
};

export type CreateProjectSuccess = {
  success: true;
  projectId: string;
  projectName: string;
  projectUrl: string;
  warnings: string[];
};

export type CreateProjectFailure = {
  success: false;
  message: string;
};

export type CreateProjectResponse = CreateProjectSuccess | CreateProjectFailure;
