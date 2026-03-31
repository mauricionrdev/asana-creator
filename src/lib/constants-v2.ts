export const SECTION_ASSIGNMENT_FIELDS = {
  "1 coleta do cartao": "responsavelColetaCartao",
  "2 configuracao tecnica inicial": "responsavelConfiguracaoTecnica",
  "3 integracao de canais": "responsavelIntegracaoCanais",
  "4 pente fino na presenca online": "responsavelPenteFino",
  "5 subir as campanhas": "responsavelCampanhas"
} as const;

export const OWNER_SECTION_NAMES = ["secao sem titulo", "seção sem título"] as const;

export const FRONT_LABELS = [
  {
    field: "responsavelColetaCartao",
    label: "Coleta do cartão",
    sectionName: "1. Coleta do cartão."
  },
  {
    field: "responsavelConfiguracaoTecnica",
    label: "Configuração Técnica Inicial",
    sectionName: "2. Configuração Técnica Inicial."
  },
  {
    field: "responsavelIntegracaoCanais",
    label: "Integração de Canais",
    sectionName: "3. Integração de Canais."
  },
  {
    field: "responsavelPenteFino",
    label: "Pente fino na Presença Online",
    sectionName: "4. Pente fino na Presença Online."
  },
  {
    field: "responsavelCampanhas",
    label: "Subir as campanhas",
    sectionName: "5. Subir as campanhas"
  }
] as const;

export const MOCK_USERS = [
  { gid: "12000000000001", name: "Samara Costa" },
  { gid: "12000000000002", name: "Pedro Henrique Viana" },
  { gid: "12000000000003", name: "Mauricio Nunes" }
];
