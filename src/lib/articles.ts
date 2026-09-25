import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'blog'>;

/** Retorna todos os artigos publicados (sem rascunhos), do mais novo para o mais antigo. */
export async function getPublishedArticles(): Promise<Article[]> {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** O slug do artigo é o nome do arquivo, sem a pasta de categoria nem a extensão. */
export function getArticleSlug(entry: Article): string {
  const parts = entry.id.split('/');
  return parts[parts.length - 1];
}

/** URL final do artigo: /categoria/slug/ */
export function getArticleUrl(entry: Article): string {
  return `/${entry.data.category}/${getArticleSlug(entry)}/`;
}

export function estimateReadingTime(body: string | undefined): number {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
