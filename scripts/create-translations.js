#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Translation mappings for each language
const translations = {
  af: { // Afrikaans
    common: { appName: "Gratis Kripto Nuus", tagline: "Intydse kriptogeldeenheid-nuus-aggregeerder", loading: "Laai...", error: "Iets het verkeerd gegaan", retry: "Probeer weer", cancel: "Kanselleer", confirm: "Bevestig", save: "Stoor", delete: "Vee uit", edit: "Wysig", close: "Sluit", back: "Terug", next: "Volgende", previous: "Vorige", search: "Soek", filter: "Filter", sort: "Sorteer", refresh: "Herlaai", share: "Deel", copy: "Kopieer", copied: "Gekopieer!", viewAll: "Sien alles", seeMore: "Sien meer", seeLess: "Sien minder", showMore: "Wys meer", showLess: "Wys minder", noResults: "Geen resultate gevind nie", poweredBy: "Aangedryf deur {name}" },
    nav: { home: "Tuis", news: "Nuus", markets: "Markte", trending: "Trending", sources: "Bronne", topics: "Onderwerpe", defi: "DeFi", digest: "Opsomming", search: "Soek", bookmarks: "Boekmerke", watchlist: "Kyklys", portfolio: "Portefeulje", settings: "Instellings", about: "Oor", compare: "Vergelyk", sentiment: "Sentiment", movers: "Top Bewegers" }
  },
  am: { // Amharic
    common: { appName: "ነፃ ክሪፕቶ ዜና", tagline: "ቀጥታ ክሪፕቶ ዜና አግሪጌተር", loading: "እየጫነ...", error: "የሆነ ስህተት ተፈጠረ", retry: "እንደገና ሞክር", cancel: "ሰርዝ", confirm: "አረጋግጥ", save: "አስቀምጥ", delete: "ሰርዝ", edit: "አርትዕ", close: "ዝጋ", back: "ተመለስ", next: "ቀጣይ", previous: "ያለፈ", search: "ፈልግ", filter: "አጣራ", sort: "ደርድር", refresh: "አድስ", share: "አጋራ", copy: "ቅዳ", copied: "ተቀድቷል!", viewAll: "ሁሉንም ይመልከቱ", seeMore: "ተጨማሪ ይመልከቱ", seeLess: "ያነሰ ይመልከቱ", showMore: "ተጨማሪ አሳይ", showLess: "ያነሰ አሳይ", noResults: "ምንም ውጤት አልተገኘም", poweredBy: "በ{name} የተጎላበተ" },
    nav: { home: "ዋና ገጽ", news: "ዜና", markets: "ገበያዎች", trending: "ተወዳጅ", sources: "ምንጮች", topics: "ርዕሶች", defi: "DeFi", digest: "ማጠቃለያ", search: "ፈልግ", bookmarks: "ዕልባቶች", watchlist: "የክትትል ዝርዝር", portfolio: "ፖርትፎሊዮ", settings: "ቅንብሮች", about: "ስለ", compare: "አወዳድር", sentiment: "ስሜት", movers: "ምርጥ ተንቀሳቃሾች" }
  },
  az: { // Azerbaijani
    common: { appName: "Pulsuz Kripto Xəbərləri", tagline: "Real vaxtda kriptovalyuta xəbər aqreqatoru", loading: "Yüklənir...", error: "Nəsə səhv getdi", retry: "Yenidən cəhd edin", cancel: "Ləğv et", confirm: "Təsdiq et", save: "Saxla", delete: "Sil", edit: "Redaktə et", close: "Bağla", back: "Geri", next: "Növbəti", previous: "Əvvəlki", search: "Axtar", filter: "Filtr", sort: "Sırala", refresh: "Yenilə", share: "Paylaş", copy: "Kopyala", copied: "Kopyalandı!", viewAll: "Hamısına bax", seeMore: "Daha çox gör", seeLess: "Daha az gör", showMore: "Daha çox göstər", showLess: "Daha az göstər", noResults: "Nəticə tapılmadı", poweredBy: "{name} tərəfindən" },
    nav: { home: "Ana səhifə", news: "Xəbərlər", markets: "Bazarlar", trending: "Trend", sources: "Mənbələr", topics: "Mövzular", defi: "DeFi", digest: "Xülasə", search: "Axtar", bookmarks: "Əlfəcinlər", watchlist: "İzləmə siyahısı", portfolio: "Portfel", settings: "Parametrlər", about: "Haqqında", compare: "Müqayisə et", sentiment: "Sentiment", movers: "Ən yaxşı hərəkət edənlər" }
  },
  be: { // Belarusian
    common: { appName: "Бясплатныя крыпта-навіны", tagline: "Агрэгатар крыптавалютных навін у рэжыме рэальнага часу", loading: "Загрузка...", error: "Нешта пайшло не так", retry: "Паспрабаваць зноў", cancel: "Адмена", confirm: "Пацвердзіць", save: "Захаваць", delete: "Выдаліць", edit: "Рэдагаваць", close: "Закрыць", back: "Назад", next: "Далей", previous: "Папярэдні", search: "Пошук", filter: "Фільтр", sort: "Сартаваць", refresh: "Абнавіць", share: "Падзяліцца", copy: "Капіяваць", copied: "Скапіявана!", viewAll: "Глядзець усё", seeMore: "Глядзець больш", seeLess: "Глядзець менш", showMore: "Паказаць больш", showLess: "Паказаць менш", noResults: "Нічога не знойдзена", poweredBy: "Працуе на {name}" },
    nav: { home: "Галоўная", news: "Навіны", markets: "Рынкі", trending: "Трэнды", sources: "Крыніцы", topics: "Тэмы", defi: "DeFi", digest: "Дайджэст", search: "Пошук", bookmarks: "Закладкі", watchlist: "Спіс назірання", portfolio: "Партфоліа", settings: "Налады", about: "Пра нас", compare: "Параўнаць", sentiment: "Настрой", movers: "Лідары руху" }
  },
  bs: { // Bosnian
    common: { appName: "Besplatne Kripto Vijesti", tagline: "Agregator kripto vijesti u realnom vremenu", loading: "Učitavanje...", error: "Nešto je pošlo po zlu", retry: "Pokušaj ponovo", cancel: "Otkaži", confirm: "Potvrdi", save: "Sačuvaj", delete: "Obriši", edit: "Uredi", close: "Zatvori", back: "Nazad", next: "Sljedeće", previous: "Prethodno", search: "Pretraži", filter: "Filter", sort: "Sortiraj", refresh: "Osvježi", share: "Podijeli", copy: "Kopiraj", copied: "Kopirano!", viewAll: "Pogledaj sve", seeMore: "Vidi više", seeLess: "Vidi manje", showMore: "Prikaži više", showLess: "Prikaži manje", noResults: "Nema rezultata", poweredBy: "Pokreće {name}" },
    nav: { home: "Početna", news: "Vijesti", markets: "Tržišta", trending: "U trendu", sources: "Izvori", topics: "Teme", defi: "DeFi", digest: "Sažetak", search: "Pretraži", bookmarks: "Oznake", watchlist: "Lista praćenja", portfolio: "Portfolio", settings: "Postavke", about: "O nama", compare: "Uporedi", sentiment: "Sentiment", movers: "Najveći pokretači" }
  },
  ca: { // Catalan
    common: { appName: "Notícies Cripto Gratuïtes", tagline: "Agregador de notícies de criptomonedes en temps real", loading: "Carregant...", error: "Alguna cosa ha anat malament", retry: "Torna-ho a provar", cancel: "Cancel·la", confirm: "Confirma", save: "Desa", delete: "Elimina", edit: "Edita", close: "Tanca", back: "Enrere", next: "Següent", previous: "Anterior", search: "Cerca", filter: "Filtre", sort: "Ordena", refresh: "Actualitza", share: "Comparteix", copy: "Copia", copied: "Copiat!", viewAll: "Veure tot", seeMore: "Veure més", seeLess: "Veure menys", showMore: "Mostra més", showLess: "Mostra menys", noResults: "No s'han trobat resultats", poweredBy: "Impulsat per {name}" },
    nav: { home: "Inici", news: "Notícies", markets: "Mercats", trending: "Tendències", sources: "Fonts", topics: "Temes", defi: "DeFi", digest: "Resum", search: "Cerca", bookmarks: "Marcadors", watchlist: "Llista de seguiment", portfolio: "Cartera", settings: "Configuració", about: "Sobre", compare: "Compara", sentiment: "Sentiment", movers: "Majors moviments" }
  },
  ceb: { // Cebuano
    common: { appName: "Libre nga Crypto News", tagline: "Real-time cryptocurrency news aggregator", loading: "Nagkarga...", error: "Adunay sayop", retry: "Sulayi pag-usab", cancel: "Kanselahon", confirm: "Kumpirmahon", save: "I-save", delete: "Papason", edit: "I-edit", close: "Sirado", back: "Balik", next: "Sunod", previous: "Kaniadto", search: "Pangita", filter: "Filter", sort: "Pagsunod", refresh: "I-refresh", share: "Ipaambit", copy: "Kopyaha", copied: "Nakopya!", viewAll: "Tan-awa tanan", seeMore: "Tan-awa pa", seeLess: "Tan-awa gamay", showMore: "Ipakita pa", showLess: "Ipakita gamay", noResults: "Walay resulta", poweredBy: "Gipagana sa {name}" },
    nav: { home: "Panimalay", news: "Balita", markets: "Merkado", trending: "Trending", sources: "Tinubdan", topics: "Mga Hilisgutan", defi: "DeFi", digest: "Digest", search: "Pangita", bookmarks: "Mga Bookmark", watchlist: "Watchlist", portfolio: "Portfolio", settings: "Settings", about: "Mahitungod", compare: "Itandi", sentiment: "Sentiment", movers: "Top Movers" }
  },
  cy: { // Welsh
    common: { appName: "Newyddion Crypto Am Ddim", tagline: "Casglwr newyddion arian cyfred digidol amser real", loading: "Yn llwytho...", error: "Aeth rhywbeth o'i le", retry: "Rhowch gynnig arall arni", cancel: "Canslo", confirm: "Cadarnhau", save: "Cadw", delete: "Dileu", edit: "Golygu", close: "Cau", back: "Nôl", next: "Nesaf", previous: "Blaenorol", search: "Chwilio", filter: "Hidlo", sort: "Trefnu", refresh: "Adnewyddu", share: "Rhannu", copy: "Copïo", copied: "Wedi'i gopïo!", viewAll: "Gweld y cyfan", seeMore: "Gweld mwy", seeLess: "Gweld llai", showMore: "Dangos mwy", showLess: "Dangos llai", noResults: "Dim canlyniadau", poweredBy: "Wedi'i bweru gan {name}" },
    nav: { home: "Hafan", news: "Newyddion", markets: "Marchnadoedd", trending: "Yn tueddu", sources: "Ffynonellau", topics: "Pynciau", defi: "DeFi", digest: "Crynodeb", search: "Chwilio", bookmarks: "Nodau tudalen", watchlist: "Rhestr wylio", portfolio: "Portffolio", settings: "Gosodiadau", about: "Amdanom", compare: "Cymharu", sentiment: "Teimlad", movers: "Symudwyr gorau" }
  },
  da: { // Danish
    common: { appName: "Gratis Krypto Nyheder", tagline: "Realtids kryptovaluta nyhedsaggregator", loading: "Indlæser...", error: "Noget gik galt", retry: "Prøv igen", cancel: "Annuller", confirm: "Bekræft", save: "Gem", delete: "Slet", edit: "Rediger", close: "Luk", back: "Tilbage", next: "Næste", previous: "Forrige", search: "Søg", filter: "Filter", sort: "Sorter", refresh: "Opdater", share: "Del", copy: "Kopier", copied: "Kopieret!", viewAll: "Se alle", seeMore: "Se mere", seeLess: "Se mindre", showMore: "Vis mere", showLess: "Vis mindre", noResults: "Ingen resultater fundet", poweredBy: "Drevet af {name}" },
    nav: { home: "Hjem", news: "Nyheder", markets: "Markeder", trending: "Trending", sources: "Kilder", topics: "Emner", defi: "DeFi", digest: "Sammendrag", search: "Søg", bookmarks: "Bogmærker", watchlist: "Overvågningsliste", portfolio: "Portefølje", settings: "Indstillinger", about: "Om", compare: "Sammenlign", sentiment: "Sentiment", movers: "Top bevægelser" }
  },
  eo: { // Esperanto
    common: { appName: "Senpagaj Kripto Novaĵoj", tagline: "Realtempa kriptomonera novaĵagregilo", loading: "Ŝarĝante...", error: "Io misfunkciis", retry: "Reprovu", cancel: "Nuligi", confirm: "Konfirmi", save: "Konservi", delete: "Forigi", edit: "Redakti", close: "Fermi", back: "Reen", next: "Sekva", previous: "Antaŭa", search: "Serĉi", filter: "Filtri", sort: "Ordigi", refresh: "Refreŝigi", share: "Kunhavigi", copy: "Kopii", copied: "Kopiita!", viewAll: "Vidi ĉion", seeMore: "Vidi pli", seeLess: "Vidi malpli", showMore: "Montri pli", showLess: "Montri malpli", noResults: "Neniuj rezultoj", poweredBy: "Funkciigita de {name}" },
    nav: { home: "Hejmo", news: "Novaĵoj", markets: "Merkatoj", trending: "Tendencoj", sources: "Fontoj", topics: "Temoj", defi: "DeFi", digest: "Resumo", search: "Serĉi", bookmarks: "Legosignoj", watchlist: "Observolisto", portfolio: "Paperaro", settings: "Agordoj", about: "Pri", compare: "Kompari", sentiment: "Sentimento", movers: "Ĉefaj movantoj" }
  }
};

// Full template based on English
const fullTemplate = JSON.parse(fs.readFileSync('messages/en.json', 'utf8'));

// Languages to create
const missing = ['af', 'am', 'az', 'be', 'bs', 'ca', 'ceb', 'cy', 'da', 'eo', 'et', 'eu', 'fi', 'fy', 'ga', 'gd', 'gl', 'gu', 'ha', 'hr', 'hy', 'is', 'jv', 'ka', 'kk', 'km', 'kn', 'ku', 'ky', 'la', 'lb', 'lo', 'lt', 'lv', 'mg', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne', 'no', 'or', 'pa', 'ps', 'pt-BR', 'rw', 'si', 'sk', 'sl', 'so', 'sq', 'sr', 'su', 'ta', 'te', 'tg', 'tk', 'ur', 'uz', 'xh', 'yi', 'yo', 'zu'];

for (const lang of missing) {
  const output = JSON.parse(JSON.stringify(fullTemplate));
  // Merge translations if available
  if (translations[lang]) {
    for (const [section, values] of Object.entries(translations[lang])) {
      if (output[section]) {
        Object.assign(output[section], values);
      }
    }
  }
  fs.writeFileSync(`messages/${lang}.json`, JSON.stringify(output, null, 2));
  console.log(`Created: messages/${lang}.json`);
}

console.log(`\nCreated ${missing.length} translation files`);
