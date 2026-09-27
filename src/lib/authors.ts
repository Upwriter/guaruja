import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { getPublishedArticles, type Article } from './articles';

export type AuthorEntry = CollectionEntry<'authors'>;

export async function getAllAuthors(): Promise<AuthorEntry[]> {
  return getCollection('authors');
}

export async function getAuthorArticles(authorId: string): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter((a) => a.data.author?.id === authorId);
}

/** Resolve a referência `author` do frontmatter de um artigo para a entrada completa. */
export async function resolveArticleAuthor(article: Article): Promise<AuthorEntry | undefined> {
  if (!article.data.author) return undefined;
  return getEntry(article.data.author);
}

export function getAuthorUrl(authorId: string): string {
  return `/autores/${authorId}/`;
}
