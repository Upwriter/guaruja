export const SITE_TITLE = 'Destinos Guarujá';
export const SITE_DESCRIPTION =
  'Guia de turismo do Guarujá (SP): praias, passeios, trilhas, onde ficar, onde comer e dicas práticas para planejar sua viagem.';
export const SITE_URL = 'https://destinosguaruja.com.br';
export const DEFAULT_OG_IMAGE = '/og-default.svg';
export const ARTICLES_PER_PAGE = 9;

export interface CategoryInfo {
  /** slug usado na URL, sem acento, minúsculo, com hífen */
  slug: string;
  /** nome exibido para humanos */
  label: string;
  /** frase curta usada em listagens e no menu */
  description: string;
}

export const CATEGORIES = [
  {
    slug: 'praias',
    label: 'Praias',
    description: 'As praias do Guarujá, uma a uma.',
  },
  {
    slug: 'o-que-fazer',
    label: 'O que fazer',
    description: 'Passeios, atrações e programas para todos os gostos.',
  },
  {
    slug: 'trilhas-e-natureza',
    label: 'Trilhas e natureza',
    description: 'Trilhas, mirantes e áreas naturais preservadas.',
  },
  {
    slug: 'onde-ficar',
    label: 'Onde ficar',
    description: 'Bairros, pousadas, hotéis e dicas de hospedagem.',
  },
  {
    slug: 'onde-comer',
    label: 'Onde comer',
    description: 'Restaurantes, quiosques e a gastronomia local.',
  },
  {
    slug: 'como-chegar',
    label: 'Como chegar',
    description: 'Balsa, carro, ônibus e todas as formas de chegar.',
  },
  {
    slug: 'planejamento',
    label: 'Planejamento',
    description: 'Roteiros, épocas do ano e organização da viagem.',
  },
  {
    slug: 'eventos',
    label: 'Eventos',
    description: 'Festas, feriados e datas importantes no calendário.',
  },
  {
    slug: 'dicas-praticas',
    label: 'Dicas práticas',
    description: 'Segurança, clima, o que levar e outras dicas úteis.',
  },
] as const satisfies readonly CategoryInfo[];

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];

export function getCategory(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
