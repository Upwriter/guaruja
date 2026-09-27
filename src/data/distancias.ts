/**
 * Distâncias aproximadas por estrada até o Guarujá, do centro de cada cidade até o
 * centro do Guarujá. Calculadas em 27/09/2026 com dados do OpenStreetMap: coordenadas
 * pelo Nominatim e rota de carro mais curta pelo roteador OSRM (router.project-osrm.org).
 * Para atualizar, refaça o cálculo com as mesmas fontes — não edite os números à mão.
 */
export interface Distancia {
  cidade: string;
  km: number;
  observacao?: string;
}

export const DISTANCIAS: Distancia[] = [
  { cidade: 'Santos', km: 10, observacao: 'pela Balsa Santos–Guarujá' },
  { cidade: 'São Bernardo do Campo', km: 68 },
  { cidade: 'São Paulo', km: 95 },
  { cidade: 'Guarulhos', km: 100 },
  { cidade: 'Jundiaí', km: 150 },
  { cidade: 'São José dos Campos', km: 174 },
  { cidade: 'Sorocaba', km: 186 },
  { cidade: 'Campinas', km: 192 },
  { cidade: 'Ribeirão Preto', km: 407 },
];
