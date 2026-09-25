import type { Root, Element, ElementContent, Properties } from 'hast';

/**
 * Insere os blocos de anúncio (<AdSlot/>) direto no HTML do artigo, em tempo de build:
 * um depois do primeiro parágrafo e um perto do meio do texto. O bloco do final do
 * artigo é adicionado normalmente pelo ArticleLayout, fora do conteúdo Markdown.
 *
 * Só insere alguma coisa se PUBLIC_ADSENSE_CLIENT_ID estiver configurado — sem essa
 * variável, este plugin não altera o HTML.
 */
export function rehypeAdSlots() {
  return (tree: Root) => {
    const clientId = process.env.PUBLIC_ADSENSE_CLIENT_ID;
    if (!clientId) return;

    const topLevel = tree.children.filter(
      (node): node is Element => node.type === 'element',
    );
    // Artigo curto demais: não vale a pena quebrar o texto com anúncios.
    if (topLevel.length < 4) return;

    const firstParagraph = topLevel.find((node) => node.tagName === 'p');
    const middleNode = topLevel[Math.floor(topLevel.length / 2)];

    const insertions: { after: Element; position: string }[] = [];
    if (firstParagraph) {
      insertions.push({ after: firstParagraph, position: 'apos-primeiro-paragrafo' });
    }
    if (middleNode && middleNode !== firstParagraph) {
      insertions.push({ after: middleNode, position: 'meio-do-artigo' });
    }

    // Insere de trás para frente para não bagunçar os índices dos nós anteriores.
    for (const { after, position } of insertions.reverse()) {
      const index = tree.children.indexOf(after);
      if (index === -1) continue;
      tree.children.splice(index + 1, 0, adSlotElement(clientId, position));
    }
  };
}

function el(tagName: string, properties: Properties, children: ElementContent[] = []): Element {
  return { type: 'element', tagName, properties, children };
}

function adSlotElement(clientId: string, position: string): Element {
  return el(
    'div',
    {
      className: [
        'dg-ad-slot',
        'not-prose',
        'my-6',
        'flex',
        'min-h-[100px]',
        'w-full',
        'items-center',
        'justify-center',
        'overflow-hidden',
      ],
      dataAdPosition: position,
    },
    [
      el('ins', {
        className: ['adsbygoogle'],
        style: 'display:block; width:100%',
        dataAdClient: clientId,
        dataAdFormat: 'auto',
        dataFullWidthResponsive: 'true',
      }),
      el(
        'script',
        { type: 'text/plain', dataConsent: 'ads' },
        [{ type: 'text', value: '(adsbygoogle = window.adsbygoogle || []).push({});' }],
      ),
    ],
  );
}
