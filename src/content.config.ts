import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './consts';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z
        .string()
        .max(60, 'O título deveria ter no máximo 60 caracteres para não ser cortado no Google.'),
      description: z
        .string()
        .min(120, 'A descrição deve ter entre 120 e 160 caracteres.')
        .max(160, 'A descrição deve ter entre 120 e 160 caracteres.'),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      category: z.enum(CATEGORY_SLUGS),
      tags: z.array(z.string()).default([]),
      /** referencia um arquivo em src/content/authors/, ex.: "amanda-soares" */
      author: reference('authors').optional(),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      /** nome do arquivo em src/data/image-credits.ts, quando o heroImage vier de lá */
      heroImageCredit: z.string().optional(),
      faq: z
        .array(
          z.object({
            question: z.string(),
            answer: z.string(),
          }),
        )
        .optional(),
      draft: z.boolean().default(false),
    })
    // alt é obrigatório sempre que houver imagem
    .refine((data) => !data.heroImage || !!data.heroAlt, {
      message: 'heroAlt é obrigatório quando heroImage está definido.',
      path: ['heroAlt'],
    }),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string(),
      avatar: image().optional(),
      avatarAlt: z.string().optional(),
    }),
});

export const collections = { blog, authors };
