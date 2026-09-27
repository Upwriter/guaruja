/**
 * Créditos das fotos de terceiros usadas no site, todas do Wikimedia Commons.
 * Cada campo aqui foi conferido na API do Commons (action=query, prop=imageinfo,
 * iiprop=extmetadata|url) antes do download — todas com licença que permite uso
 * comercial (nenhuma "NC"). Ver também /creditos-das-imagens/.
 *
 * `file` é o nome do arquivo dentro de src/assets/guaruja/ — use-o como chave ao
 * chamar <ImageCredit file="..." />.
 */
export interface ImageCredit {
  file: string;
  /** título exato do arquivo no Wikimedia Commons */
  commonsTitle: string;
  author: string;
  authorUrl?: string;
  license: string;
  licenseUrl: string;
  /** URL da página do arquivo no Commons (a fonte) */
  sourceUrl: string;
  /** texto alternativo padrão em português; pode ser sobrescrito no local de uso */
  defaultAlt: string;
}

export const IMAGE_CREDITS: ImageCredit[] = [
  {
    file: 'operacao-praia-segura.jpg',
    commonsTitle: 'Operação Praia Segura no Guarujá. (45937901095).jpg',
    author: 'Governo do Estado de São Paulo',
    authorUrl: 'https://www.flickr.com/people/38014693@N04',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Opera%C3%A7%C3%A3o_Praia_Segura_no_Guaruj%C3%A1._(45937901095).jpg',
    defaultAlt: 'Agentes de segurança e viaturas durante operação de fiscalização em uma praia do Guarujá',
  },
  {
    file: 'guaiuba-panoramio.jpg',
    commonsTitle: 'GUAIUBA GUARUJÁ - panoramio (4).jpg',
    author: 'Fernando Druziani',
    authorUrl: 'https://web.archive.org/web/20161024122535/http://www.panoramio.com/user/7157607?with_photo_id=80765034',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:GUAIUBA_GUARUJ%C3%81_-_panoramio_(4).jpg',
    defaultAlt: 'Vista aérea da praia e do bairro de Guaiúba, no Guarujá, com mar azul e vegetação ao redor',
  },
  {
    file: 'asturias-sobre-as-ondas.jpg',
    commonsTitle: 'Guaruja.SP.Asturias.SobreAsOndas.Warchavick.jpg',
    author: 'KikoCorreia',
    license: 'CC BY-SA 2.5 br',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.5/br/deed.en',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Guaruja.SP.Asturias.SobreAsOndas.Warchavick.jpg',
    defaultAlt: 'Vista do bairro de Astúrias, no Guarujá, com as ondas do mar em primeiro plano',
  },
  {
    file: 'guaruja-marco-2018.jpg',
    commonsTitle: 'Guarujá (March 2018) 11.jpg',
    author: 'Sturm',
    authorUrl: 'https://commons.wikimedia.org/wiki/User:Sturm',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Guaruj%C3%A1_(March_2018)_11.jpg',
    defaultAlt: 'Vista panorâmica da orla do Guarujá, com prédios à beira-mar e o mar ao fundo',
  },
  {
    file: 'praia-do-pereque.jpg',
    commonsTitle: 'Praia do Pereque,Guaruja,sp,Brasil.jpg',
    author: 'Luiz coelho',
    authorUrl: 'https://commons.wikimedia.org/wiki/User:Luiz_coelho',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Praia_do_Pereque,Guaruja,sp,Brasil.jpg',
    defaultAlt: 'Vista da Praia do Perequê, no Guarujá, com faixa de areia e mar calmo',
  },
  {
    file: 'mapa-guaruja-sp.svg',
    commonsTitle: 'SaoPaulo Municip Guaruja.svg',
    author: 'Raphael Lorenzeto de Abreu',
    license: 'CC BY 2.5',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.5',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:SaoPaulo_Municip_Guaruja.svg',
    defaultAlt: 'Mapa de localização do município do Guarujá no estado de São Paulo',
  },
];

export function getImageCredit(file: string): ImageCredit | undefined {
  return IMAGE_CREDITS.find((c) => c.file === file);
}
