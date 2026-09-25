/**
 * Dataset fictício do tenant de demonstração (medflow-v1-demo).
 *
 * Fonte única compartilhada por generate-demo-assets.mjs (imagens de guia +
 * PDF de contrato) e seed-demo-tenant.ts (registros no banco). Todos os
 * nomes, documentos, CRMs, CNES, carteirinhas e operadoras são fictícios.
 * Os códigos TUSS e CBO são reais (tabela TUSS 22 / CBO 2002).
 */

export const DEMO_TENANT_SLUG = "medflow-v1-demo";
export const DEMO_EMAIL_DOMAIN = "demo.medicflow.local";

/** Operadoras fictícias (registro ANS fictício de 6 dígitos). */
export const DEMO_OPERATORS = [
  { key: "horizonte", name: "Horizonte Saúde", ans: "412345", contract: "HZ-2026-014", contractName: "Contrato Horizonte Saúde 2026" },
  { key: "vitalis", name: "Vitalis Assistência Médica", ans: "398765", contract: "VT-2026-007", contractName: "Contrato Vitalis 2026" },
];

/** Procedimentos TUSS reais usados nas guias (valores de tabela fictícios). */
export const DEMO_PROCEDURES = [
  { code: "10101012", description: "Consulta em consultório (no horário normal ou preestabelecido)", specialty: "Clínica médica", group: "Consultas", value: 100 },
  { code: "10101039", description: "Consulta em pronto socorro", specialty: "Clínica médica", group: "Consultas", value: 120 },
  { code: "10102019", description: "Visita hospitalar (paciente internado)", specialty: "Clínica médica", group: "Visitas", value: 95 },
  { code: "40304361", description: "Hemograma com contagem de plaquetas ou frações", specialty: "Patologia clínica", group: "Laboratório", value: 35 },
  { code: "40302040", description: "Glicose - pesquisa e/ou dosagem", specialty: "Patologia clínica", group: "Laboratório", value: 12 },
  { code: "40301630", description: "Creatinina - pesquisa e/ou dosagem", specialty: "Patologia clínica", group: "Laboratório", value: 14 },
  { code: "40316521", description: "Tireoestimulante, hormônio (TSH) - pesquisa e/ou dosagem", specialty: "Patologia clínica", group: "Laboratório", value: 38 },
  { code: "40101010", description: "ECG convencional de até 12 derivações", specialty: "Cardiologia", group: "Métodos diagnósticos", value: 45 },
  { code: "40805026", description: "RX - Tórax - 2 incidências", specialty: "Radiologia", group: "Imagem", value: 60 },
  { code: "40901122", description: "US - Abdome total", specialty: "Radiologia", group: "Imagem", value: 180 },
  { code: "41001010", description: "TC - Crânio ou sela túrcica ou órbitas", specialty: "Radiologia", group: "Imagem", value: 420 },
  { code: "40202038", description: "Endoscopia digestiva alta", specialty: "Gastroenterologia", group: "Endoscopia", value: 380 },
  { code: "40202666", description: "Colonoscopia com biópsia e/ou citologia", specialty: "Gastroenterologia", group: "Endoscopia", value: 850 },
  { code: "31309054", description: "Cesariana", specialty: "Ginecologia e Obstetrícia", group: "Cirurgia", value: 2850 },
  { code: "31005497", description: "Colecistectomia sem colangiografia por videolaparoscopia", specialty: "Cirurgia geral", group: "Cirurgia", value: 3200 },
];

export const DEMO_INSTITUTIONS = [
  {
    code: "HSL",
    name: "Hospital Santa Luzia",
    cnes: "9912345",
    cnpj: "41.582.736/0001-00",
    address: "Av. das Palmeiras, 1200 — Centro, Campinas/SP",
    phone: "(19) 3200-1000",
    units: [
      { name: "Pronto-Socorro", type: "hospital", departments: ["PS Adulto"] },
      { name: "UTI", type: "hospital", departments: ["UTI Adulto"] },
      { name: "Bloco Cirúrgico e Obstétrico", type: "hospital", departments: ["Centro Cirúrgico", "Centro Obstétrico"] },
    ],
  },
  {
    code: "UPA-JA",
    name: "UPA 24h Jardim América",
    cnes: "9923456",
    cnpj: "41.582.736/0002-83",
    address: "Rua dos Ipês, 455 — Jardim América, Campinas/SP",
    phone: "(19) 3200-2000",
    units: [{ name: "UPA 24h", type: "upa", departments: ["Clínica Médica UPA", "Pediatria UPA"] }],
  },
  {
    code: "CVP",
    name: "Clínica Vida Plena",
    cnes: "9934567",
    cnpj: "41.582.736/0003-64",
    address: "Rua Barão de Jaguara, 870 — Cambuí, Campinas/SP",
    phone: "(19) 3200-3000",
    units: [{ name: "Ambulatório de Especialidades", type: "clinic", departments: ["Cardiologia", "Diagnóstico por Imagem"] }],
  },
];

export const DEMO_WORK_GROUPS = ["Equipe Emergência", "Equipe Terapia Intensiva", "Equipe Cirúrgica", "Equipe Ambulatorial"];

/** Equipe administrativa do tenant demo (login com a senha de demonstração). */
export const DEMO_STAFF = [
  { handle: "carla.mendes", fullName: "Carla Mendes", role: "coordinator" },
  { handle: "rafael.souza", fullName: "Rafael Souza", role: "financial" },
];

/**
 * Profissionais. `role` do plantão = especialidade (o agente de sugestão casa
 * role_required ⊂ specialty). CRM no formato aceito pelo XML TISS (UF-número).
 */
export const DEMO_PROFESSIONALS = [
  { handle: "ana.lima", fullName: "Dra. Ana Beatriz Lima", specialty: "Clínica Médica", crm: "SP-123456", cbo: "225125", group: "Equipe Emergência", hospitals: ["HSL", "UPA-JA"], days: [1, 3, 5], hours: ["07:00", "19:00"] },
  { handle: "bruno.carvalho", fullName: "Dr. Bruno Carvalho", specialty: "Medicina Intensiva", crm: "SP-234567", cbo: "225150", group: "Equipe Terapia Intensiva", hospitals: ["HSL"], days: [0, 2, 4, 6], hours: ["07:00", "23:59"] },
  { handle: "camila.rocha", fullName: "Dra. Camila Rocha", specialty: "Pediatria", crm: "SP-345678", cbo: "225124", group: "Equipe Emergência", hospitals: ["UPA-JA", "CVP"], days: [1, 2, 3, 4, 5], hours: ["07:00", "19:00"] },
  { handle: "diego.martins", fullName: "Dr. Diego Martins", specialty: "Anestesiologia", crm: "SP-456789", cbo: "225151", group: "Equipe Cirúrgica", hospitals: ["HSL"], days: [1, 2, 3, 4, 5], hours: ["07:00", "19:00"] },
  { handle: "elisa.nogueira", fullName: "Dra. Elisa Nogueira", specialty: "Ginecologia e Obstetrícia", crm: "SP-567890", cbo: "225250", group: "Equipe Cirúrgica", hospitals: ["HSL", "CVP"], days: [0, 1, 3, 5, 6], hours: ["07:00", "19:00"] },
  { handle: "felipe.andrade", fullName: "Dr. Felipe Andrade", specialty: "Cardiologia", crm: "SP-678901", cbo: "225120", group: "Equipe Ambulatorial", hospitals: ["CVP", "HSL"], days: [2, 4], hours: ["08:00", "18:00"] },
  { handle: "gabriela.pires", fullName: "Dra. Gabriela Pires", specialty: "Clínica Médica", crm: "SP-789012", cbo: "225125", group: "Equipe Emergência", hospitals: ["UPA-JA", "HSL"], days: [0, 2, 4, 6], hours: ["07:00", "23:59"] },
  { handle: "henrique.tavares", fullName: "Dr. Henrique Tavares", specialty: "Cirurgia Geral", crm: "SP-890123", cbo: "225225", group: "Equipe Cirúrgica", hospitals: ["HSL"], days: [1, 2, 3, 4, 5], hours: ["07:00", "19:00"] },
  { handle: "isabela.freitas", fullName: "Dra. Isabela Freitas", specialty: "Medicina Intensiva", crm: "SP-901234", cbo: "225150", group: "Equipe Terapia Intensiva", hospitals: ["HSL"], days: [1, 3, 5], hours: ["07:00", "23:59"] },
  { handle: "joao.alves", fullName: "Dr. João Pedro Alves", specialty: "Radiologia", crm: "SP-112233", cbo: "225320", group: "Equipe Ambulatorial", hospitals: ["CVP"], days: [1, 3, 5], hours: ["08:00", "19:00"] },
  { handle: "lucas.ferraz", fullName: "Dr. Lucas Ferraz", specialty: "Clínica Médica", crm: "SP-223344", cbo: "225125", group: "Equipe Emergência", hospitals: ["HSL", "UPA-JA"], days: [0, 1, 2, 3, 4, 5, 6], hours: ["07:00", "23:59"] },
  { handle: "mariana.costa", fullName: "Dra. Mariana Costa", specialty: "Pediatria", crm: "SP-334455", cbo: "225124", group: "Equipe Emergência", hospitals: ["UPA-JA"], days: [0, 5, 6], hours: ["07:00", "23:59"] },
  { handle: "nicolas.barros", fullName: "Dr. Nicolas Barros", specialty: "Clínica Médica", crm: "SP-445566", cbo: "225125", group: "Equipe Emergência", hospitals: ["UPA-JA", "HSL"], days: [0, 1, 2, 3, 4, 5, 6], hours: ["07:00", "23:59"] },
  { handle: "olivia.santana", fullName: "Dra. Olívia Santana", specialty: "Anestesiologia", crm: "SP-556677", cbo: "225151", group: "Equipe Cirúrgica", hospitals: ["HSL"], days: [1, 2, 3, 4, 5], hours: ["07:00", "19:00"] },
];

/**
 * Grade de plantões por setor. `weekdays` null = todos os dias.
 * Horários locais (America/Sao_Paulo, UTC-3).
 */
export const DEMO_SHIFT_GRID = [
  { department: "PS Adulto", role: "Clínica Médica", slots: [["07:00", 12], ["19:00", 12]], weekdays: null },
  { department: "UTI Adulto", role: "Medicina Intensiva", slots: [["07:00", 12], ["19:00", 12]], weekdays: null },
  { department: "Centro Cirúrgico", role: "Anestesiologia", slots: [["07:00", 12]], weekdays: [1, 2, 3, 4, 5] },
  { department: "Centro Obstétrico", role: "Ginecologia e Obstetrícia", slots: [["07:00", 12]], weekdays: null },
  { department: "Clínica Médica UPA", role: "Clínica Médica", slots: [["07:00", 12], ["19:00", 12]], weekdays: null },
  { department: "Pediatria UPA", role: "Pediatria", slots: [["07:00", 12]], weekdays: null },
  { department: "Cardiologia", role: "Cardiologia", slots: [["08:00", 6]], weekdays: [2, 4] },
  { department: "Diagnóstico por Imagem", role: "Radiologia", slots: [["13:00", 6]], weekdays: [1, 3, 5] },
];

/**
 * Guias digitalizadas enviadas à Captura Inteligente. `outcome` define o
 * destino após o pipeline real (OCR → parser → auditoria → contrato → risco):
 *   approve | corrections | reject | review (fica aguardando revisão) | ocr_pending (só upload)
 */
export const DEMO_CAPTURE_GUIDES = [
  {
    file: "guia-sadt-horizonte-mariana-teixeira.png", type: "sadt", operator: "horizonte", outcome: "approve",
    patient: "Mariana Alves Teixeira", card: "412345.0087.2231-04", date: "08/09/2026", guideNumber: "2026090801",
    requester: { name: "Dra. Ana Beatriz Lima", crm: "123456/SP" }, executor: { name: "Dra. Ana Beatriz Lima", crm: "123456/SP" },
    cid: "E11.9", indication: "Controle glicêmico — diabetes tipo 2", authorization: "HZ88213",
    items: [["40304361", 1], ["40302040", 1], ["40301630", 1]],
  },
  {
    file: "guia-consulta-vitalis-roberto-farias.png", type: "consulta", operator: "vitalis", outcome: "approve",
    patient: "Roberto Nunes Farias", card: "398765.1120.0045-77", date: "10/09/2026", guideNumber: "2026091003",
    executor: { name: "Dr. Felipe Andrade", crm: "678901/SP" }, cid: "I10", indication: "Hipertensão essencial — retorno",
    items: [["10101012", 1]],
  },
  {
    file: "guia-sadt-horizonte-luciana-prado.png", type: "sadt", operator: "horizonte", outcome: "corrections",
    patient: "Luciana Prado Meireles", card: "", date: "11/09/2026", guideNumber: "2026091107",
    requester: { name: "Dra. Gabriela Pires", crm: "789012/SP" }, executor: { name: "Dr. João Pedro Alves", crm: "112233/SP" },
    cid: "R10.4", indication: "Dor abdominal a esclarecer", authorization: "",
    items: [["40901122", 1]],
  },
  {
    file: "guia-honorario-horizonte-patricia-souza.png", type: "honorario", operator: "horizonte", outcome: "review",
    patient: "Patrícia Souza Cavalcanti", card: "412345.0301.7789-12", date: "14/09/2026", guideNumber: "2026091402",
    executor: { name: "Dra. Elisa Nogueira", crm: "567890/SP" }, participation: "Cirurgião", originGuide: "2026091400",
    cid: "O82.0", indication: "Parto cesáreo eletivo", items: [["31309054", 1]],
  },
  {
    file: "guia-sadt-vitalis-marcos-oliveira.png", type: "sadt", operator: "vitalis", outcome: "reject",
    patient: "Marcos Vinícius Oliveira", card: "398765.2210.3301-09", date: "15/09/2026", guideNumber: "2026091511",
    requester: { name: "Dr. Lucas Ferraz", crm: "223344/SP" }, executor: { name: "Dr. João Pedro Alves", crm: "112233/SP" },
    cid: "R51", indication: "Cefaleia intensa — investigação", authorization: "",
    items: [["41001010", 1]],
  },
  {
    file: "guia-consulta-horizonte-helena-duarte.png", type: "consulta", operator: "horizonte", outcome: "corrections",
    patient: "Helena Duarte Campos", card: "412345.0550.1234-88", date: "17/09/2026", guideNumber: "2026091705",
    executor: { name: "Dra. Camila Rocha", crm: "345678/SP" }, cid: "J06.9", indication: "IVAS — criança de 6 anos",
    items: [["10101099", 1]],
  },
  {
    file: "guia-sadt-vitalis-sergio-almeida.png", type: "sadt", operator: "vitalis", outcome: "review",
    patient: "Sérgio Almeida Rezende", card: "398765.0098.4410-31", date: "18/09/2026", guideNumber: "2026091804",
    requester: { name: "Dr. Henrique Tavares", crm: "890123/SP" }, executor: { name: "Dr. Henrique Tavares", crm: "890123/SP" },
    cid: "K21.9", indication: "Doença do refluxo gastroesofágico", authorization: "VT55102",
    items: [["40202038", 1]],
  },
  {
    file: "guia-sadt-horizonte-antonio-ribeiro.png", type: "sadt", operator: "horizonte", outcome: "approve",
    patient: "Antônio Carlos Ribeiro", card: "412345.0761.9020-45", date: "19/09/2026", guideNumber: "2026091909",
    requester: { name: "Dr. Felipe Andrade", crm: "678901/SP" }, executor: { name: "Dr. Felipe Andrade", crm: "678901/SP" },
    cid: "I20.9", indication: "Dor torácica — avaliação cardiológica", authorization: "HZ90417",
    items: [["40101010", 1], ["40805026", 1]],
  },
  {
    file: "guia-consulta-horizonte-beatriz-gomes.png", type: "consulta", operator: "horizonte", outcome: "review",
    patient: "Beatriz Gomes Pacheco", card: "412345.0112.6605-19", date: "21/09/2026", guideNumber: "2026092102",
    executor: { name: "Dra. Mariana Costa", crm: "334455/SP" }, cid: "A09", indication: "Gastroenterite aguda — pediatria",
    items: [["10101039", 1]],
  },
  {
    file: "guia-sadt-vitalis-claudia-matos.png", type: "sadt", operator: "vitalis", outcome: "corrections",
    patient: "Cláudia Matos Ferreira", card: "398765.3345.1102-60", date: "22/09/2026", guideNumber: "2026092206",
    requester: { name: "Dr. Henrique Tavares", crm: "890123/SP" }, executor: { name: "Dr. Henrique Tavares", crm: "890123/SP" },
    cid: "Z12.1", indication: "Rastreamento de neoplasia de cólon", authorization: "VT55987",
    items: [["40202666", 2]],
  },
  {
    file: "guia-sadt-horizonte-fernando-lopes.png", type: "sadt", operator: "horizonte", outcome: "ocr_pending",
    patient: "Fernando Lopes Aguiar", card: "412345.0923.4471-02", date: "24/09/2026", guideNumber: "2026092403",
    requester: { name: "Dra. Isabela Freitas", crm: "901234/SP" }, executor: { name: "Dra. Isabela Freitas", crm: "901234/SP" },
    cid: "J18.9", indication: "Pneumonia — controle", authorization: "HZ91233",
    items: [["40805026", 1], ["40304361", 1]],
  },
  {
    file: "guia-consulta-vitalis-renata-silveira.png", type: "consulta", operator: "vitalis", outcome: "ocr_pending",
    patient: "Renata Silveira Brandão", card: "398765.4410.2287-53", date: "24/09/2026", guideNumber: "2026092408",
    executor: { name: "Dr. Nicolas Barros", crm: "445566/SP" }, cid: "M54.5", indication: "Lombalgia",
    items: [["10101039", 1]],
  },
];

/** Contrato fictício da Horizonte Saúde — alimenta a esteira RAG → propostas de regra. */
export const DEMO_CONTRACT = {
  operator: "horizonte",
  label: "HORIZONTE-SAUDE-2026",
  file: "contrato-horizonte-saude-2026.pdf",
};

export function procedureByCode(code) {
  return DEMO_PROCEDURES.find((p) => p.code === code) ?? null;
}

export function operatorByKey(key) {
  const op = DEMO_OPERATORS.find((o) => o.key === key);
  if (!op) throw new Error(`Operadora desconhecida: ${key}`);
  return op;
}

/** CNPJ fictício (DV válido) da cooperativa demo — usado no envelope do XML TISS. */
export const DEMO_TENANT_CNPJ = "41582736000445";
