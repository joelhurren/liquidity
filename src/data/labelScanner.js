import Tesseract from 'tesseract.js';
import { REGIONS, COUNTRIES, COMMON_GRAPES } from './wineData';

// Bordeaux sub-appellations and other common wine sub-regions
const SUB_APPELLATIONS = [
  'Saint-Julien', 'St-Julien', 'Saint Julien',
  'Pauillac', 'Margaux', 'Saint-Estèphe', 'St-Estèphe', 'Saint Estephe',
  'Saint-Émilion', 'St-Émilion', 'Saint Emilion',
  'Pomerol', 'Pessac-Léognan', 'Graves', 'Médoc', 'Haut-Médoc',
  'Sauternes', 'Barsac', 'Listrac', 'Moulis',
  'Gevrey-Chambertin', 'Chambolle-Musigny', 'Vosne-Romanée', 'Nuits-Saint-Georges',
  'Meursault', 'Puligny-Montrachet', 'Chassagne-Montrachet', 'Chablis',
  'Pommard', 'Volnay', 'Beaune', 'Corton',
  'Châteauneuf-du-Pape', 'Hermitage', 'Côte-Rôtie', 'Crozes-Hermitage',
  'Barolo', 'Barbaresco', 'Brunello di Montalcino', 'Chianti Classico',
  'Montalcino', 'Bolgheri',
];

// Map sub-appellations to parent regions
const SUB_APPELLATION_REGION = {
  'saint-julien': 'Bordeaux', 'st-julien': 'Bordeaux', 'saint julien': 'Bordeaux',
  'pauillac': 'Bordeaux', 'margaux': 'Bordeaux',
  'saint-estèphe': 'Bordeaux', 'st-estèphe': 'Bordeaux', 'saint estephe': 'Bordeaux',
  'saint-émilion': 'Bordeaux', 'st-émilion': 'Bordeaux', 'saint emilion': 'Bordeaux',
  'pomerol': 'Bordeaux', 'pessac-léognan': 'Bordeaux', 'graves': 'Bordeaux',
  'médoc': 'Bordeaux', 'haut-médoc': 'Bordeaux',
  'sauternes': 'Bordeaux', 'barsac': 'Bordeaux', 'listrac': 'Bordeaux', 'moulis': 'Bordeaux',
  'gevrey-chambertin': 'Burgundy', 'chambolle-musigny': 'Burgundy',
  'vosne-romanée': 'Burgundy', 'nuits-saint-georges': 'Burgundy',
  'meursault': 'Burgundy', 'puligny-montrachet': 'Burgundy',
  'chassagne-montrachet': 'Burgundy', 'chablis': 'Burgundy',
  'pommard': 'Burgundy', 'volnay': 'Burgundy', 'beaune': 'Burgundy', 'corton': 'Burgundy',
  'châteauneuf-du-pape': 'Rhône Valley', 'hermitage': 'Rhône Valley',
  'côte-rôtie': 'Rhône Valley', 'crozes-hermitage': 'Rhône Valley',
  'barolo': 'Piedmont', 'barbaresco': 'Piedmont',
  'brunello di montalcino': 'Tuscany', 'chianti classico': 'Tuscany',
  'montalcino': 'Tuscany', 'bolgheri': 'Tuscany',
};

/**
 * Preprocess image variant 1: grayscale + contrast boost (no binarization)
 */
function preprocessGrayscale(imageData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Boost contrast gently
        gray = ((gray - 128) * 1.4) + 128;
        gray = Math.max(0, Math.min(255, gray));
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageData;
  });
}

/**
 * Preprocess image variant 2: adaptive binarization for high-contrast labels
 */
function preprocessBinarized(imageData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // First pass: compute average brightness
      let totalBright = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalBright += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgBright = totalBright / (data.length / 4);
      // Use adaptive threshold based on average brightness
      const threshold = avgBright * 0.65;

      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        gray = gray > threshold ? 255 : 0;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageData;
  });
}

/**
 * Run Tesseract OCR on an image and return the text
 */
async function runOCR(image, onProgress, progressOffset, progressRange) {
  const result = await Tesseract.recognize(image, 'eng+fra', {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          stage: 'ocr',
          message: 'Reading label text...',
          percent: progressOffset + Math.round((m.progress || 0) * progressRange),
        });
      }
    },
  });
  return result.data.text;
}

/**
 * Score how useful OCR text is — more real words = better
 */
function scoreOCRText(text) {
  const words = text.split(/\s+/).filter(w => w.length > 2);
  // Count words that look like real words (mostly letters, not garbage)
  const realWords = words.filter(w => /^[a-zA-ZÀ-ÿ'-]+$/.test(w));
  // Bonus for wine-related terms
  const wineTerms = ['chateau', 'château', 'domaine', 'cru', 'classe', 'classé',
    'saint', 'mis', 'bouteille', 'vin', 'wine', 'vintage', 'appellation',
    'bordeaux', 'bourgogne', 'julien', 'barton', 'léoville', 'leoville',
    ...REGIONS.map(r => r.toLowerCase()),
    ...SUB_APPELLATIONS.map(a => a.toLowerCase()),
  ];
  const bonusCount = words.filter(w =>
    wineTerms.some(t => w.toLowerCase().includes(t))
  ).length;
  return realWords.length + bonusCount * 3;
}

/**
 * Merge two OCR texts — combine unique lines, prefer longer/better matches
 */
function mergeOCRTexts(text1, text2) {
  const score1 = scoreOCRText(text1);
  const score2 = scoreOCRText(text2);

  // Use the better text as primary, but append unique lines from the other
  const primary = score1 >= score2 ? text1 : text2;
  const secondary = score1 >= score2 ? text2 : text1;

  const primaryLines = new Set(primary.toLowerCase().split('\n').map(l => l.trim()).filter(Boolean));
  const extraLines = secondary.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2)
    .filter(l => {
      const lower = l.toLowerCase();
      // Only add if not already in primary (fuzzy match)
      return ![...primaryLines].some(pl => pl.includes(lower) || lower.includes(pl));
    });

  return primary + '\n' + extraLines.join('\n');
}

/**
 * Scan a wine label image and extract wine details via OCR.
 * Runs OCR twice with different preprocessing and merges results.
 */
export async function scanWineLabel(imageData, onProgress) {
  onProgress?.({ stage: 'preprocess', message: 'Enhancing image...', percent: 5 });

  // Prepare two preprocessed versions in parallel
  const [grayscaleImg, binarizedImg] = await Promise.all([
    preprocessGrayscale(imageData),
    preprocessBinarized(imageData),
  ]);

  // Run OCR on both versions
  onProgress?.({ stage: 'ocr', message: 'Reading label (pass 1)...', percent: 10 });
  const text1 = await runOCR(grayscaleImg, onProgress, 10, 25);

  onProgress?.({ stage: 'ocr', message: 'Reading label (pass 2)...', percent: 38 });
  const text2 = await runOCR(binarizedImg, onProgress, 38, 25);

  // Merge the best results from both passes
  const rawText = mergeOCRTexts(text1, text2);

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  onProgress?.({ stage: 'parsing', message: 'Analyzing wine details...', percent: 70 });

  // Log raw OCR for debugging
  console.log('[Wine Scanner] OCR pass 1:', text1);
  console.log('[Wine Scanner] OCR pass 2:', text2);
  console.log('[Wine Scanner] Merged text:', rawText);

  const extracted = parseWineLabel(lines, rawText);

  onProgress?.({ stage: 'done', message: 'Done!', percent: 100 });

  return {
    ...extracted,
    rawText,
    lines,
  };
}

function parseWineLabel(lines, rawText) {
  const result = {
    name: '',
    producer: '',
    vintage: null,
    region: '',
    country: '',
    appellation: '',
    type: '',
    grapeVarieties: [],
    alcoholPercent: null,
    classification: '',
  };

  const fullText = rawText.toLowerCase();

  // --- Extract Vintage (4-digit year between 1900-2030) ---
  const vintageMatch = rawText.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (vintageMatch) {
    result.vintage = parseInt(vintageMatch[1]);
  }

  // --- Extract Alcohol % ---
  const alcoholMatch = rawText.match(/(\d{1,2}[.,]\d)\s*%\s*(?:vol|alc|alcohol)?/i)
    || rawText.match(/(?:alc|alcohol)[.\s:]*(\d{1,2}[.,]\d)\s*%/i);
  if (alcoholMatch) {
    result.alcoholPercent = parseFloat(alcoholMatch[1].replace(',', '.'));
  }

  // --- Extract Region (check sub-appellations first, then main regions) ---
  // Also try fuzzy matching for OCR errors (e.g., "Saint-Jullen" → "Saint-Julien")
  for (const appel of SUB_APPELLATIONS) {
    const appelLower = appel.toLowerCase();
    if (fullText.includes(appelLower)) {
      result.appellation = result.appellation || appel;
      result.region = SUB_APPELLATION_REGION[appelLower] || '';
      break;
    }
    // Fuzzy: try without accents and hyphens
    const simplified = appelLower.replace(/[àâ]/g, 'a').replace(/[éèê]/g, 'e')
      .replace(/[ôö]/g, 'o').replace(/[ùû]/g, 'u').replace(/[-]/g, ' ');
    const simplifiedText = fullText.replace(/[àâ]/g, 'a').replace(/[éèê]/g, 'e')
      .replace(/[ôö]/g, 'o').replace(/[ùû]/g, 'u').replace(/[-]/g, ' ');
    if (simplifiedText.includes(simplified)) {
      result.appellation = result.appellation || appel;
      result.region = SUB_APPELLATION_REGION[appelLower] || '';
      break;
    }
  }
  if (!result.region) {
    for (const region of REGIONS) {
      if (fullText.includes(region.toLowerCase())) {
        result.region = region;
        break;
      }
    }
  }

  // --- Extract Country ---
  for (const country of COUNTRIES) {
    if (fullText.includes(country.toLowerCase())) {
      result.country = country;
      break;
    }
  }

  // Infer country from region if not found
  if (!result.country && result.region) {
    const regionCountryMap = {
      'Bordeaux': 'France', 'Burgundy': 'France', 'Champagne': 'France',
      'Loire Valley': 'France', 'Rhône Valley': 'France', 'Alsace': 'France', 'Languedoc': 'France',
      'Tuscany': 'Italy', 'Piedmont': 'Italy', 'Veneto': 'Italy', 'Sicily': 'Italy',
      'Rioja': 'Spain', 'Ribera del Duero': 'Spain', 'Priorat': 'Spain',
      'Napa Valley': 'USA', 'Sonoma': 'USA', 'Willamette Valley': 'USA',
      'Finger Lakes': 'USA', 'Paso Robles': 'USA',
      'Niagara Peninsula': 'Canada', 'Okanagan Valley': 'Canada', 'Prince Edward County': 'Canada',
      'Barossa Valley': 'Australia', 'Margaret River': 'Australia',
      'Hunter Valley': 'Australia', 'McLaren Vale': 'Australia',
      'Marlborough': 'New Zealand', 'Central Otago': 'New Zealand', "Hawke's Bay": 'New Zealand',
      'Mendoza': 'Argentina', 'Stellenbosch': 'South Africa',
      'Douro Valley': 'Portugal', 'Mosel': 'Germany', 'Wachau': 'Austria',
    };
    result.country = regionCountryMap[result.region] || '';
  }

  // --- Extract Grape Varieties ---
  const allGrapes = [
    ...Object.values(COMMON_GRAPES).flat(),
  ];
  const uniqueGrapes = [...new Set(allGrapes)];
  for (const grape of uniqueGrapes) {
    if (fullText.includes(grape.toLowerCase())) {
      result.grapeVarieties.push(grape);
    }
  }

  // --- Extract Appellation ---
  if (!result.appellation) {
    const appellationPatterns = [
      /\b(AOC|AOP|DOC|DOCG|DO|AVA|VQA|IGT|IGP)\b\s*([^\n]{0,40})/i,
      /appellation\s+([^\n]{0,50})\s+(?:contrôlée|protégée)/i,
      /(contrôlée|protégée)/i,
    ];
    for (const pattern of appellationPatterns) {
      const match = rawText.match(pattern);
      if (match) {
        result.appellation = match[0].trim().substring(0, 60);
        break;
      }
    }
  }

  // --- Extract Classification ---
  const classificationPatterns = [
    /\b(Cru Class[ée]\s*(?:en\s*\d{4})?)\b/i,
    /\b(Grand Cru|Premier Cru|1er Cru|Cru Bourgeois|Reserva|Gran Reserva|Riserva|Superiore|Classico)\b/i,
    /\b(Premier Grand Cru|Cru Artisan|Village|Lieu-dit)\b/i,
  ];
  for (const pattern of classificationPatterns) {
    const match = rawText.match(pattern);
    if (match) {
      result.classification = match[1];
      break;
    }
  }

  // --- Detect Wine Type ---
  if (/\b(rosé|rose|rosato)\b/i.test(fullText)) {
    result.type = 'rose';
  } else if (/\b(blanc|white|bianco|blanco|weiss|weisswein)\b/i.test(fullText)) {
    result.type = 'white';
  } else if (/\b(champagne|prosecco|cava|sparkling|spumante|crémant|brut|mousseux)\b/i.test(fullText)) {
    result.type = 'sparkling';
  } else if (/\b(port|sherry|madeira|marsala|fortified|vermouth)\b/i.test(fullText)) {
    result.type = 'fortified';
  } else if (/\b(rouge|red|rosso|tinto|rotwein)\b/i.test(fullText)) {
    result.type = 'red';
  } else if (/\b(dessert|ice\s*wine|sauternes|tokaj|late\s*harvest|vendange\s*tardive)\b/i.test(fullText)) {
    result.type = 'dessert';
  }

  // If we found red grapes but no type, infer red
  if (!result.type && result.grapeVarieties.length > 0) {
    const redGrapes = (COMMON_GRAPES.red || []).map((g) => g.toLowerCase());
    const whiteGrapes = (COMMON_GRAPES.white || []).map((g) => g.toLowerCase());
    const hasRed = result.grapeVarieties.some((g) => redGrapes.includes(g.toLowerCase()));
    const hasWhite = result.grapeVarieties.some((g) => whiteGrapes.includes(g.toLowerCase()));
    if (hasRed && !hasWhite) result.type = 'red';
    else if (hasWhite && !hasRed) result.type = 'white';
  }

  // --- Extract Wine Name and Producer ---
  // Look for "Château X" or "Domaine X" pattern — very common on French labels
  // Allow for OCR errors: Ch%teau, Chateau, CHÂTEAU, etc.
  const chateauMatch = rawText.match(/\b(ch[aâ%]teau\s+[\w\s\u00C0-\u024F-]{3,30})\b/i)
    || rawText.match(/\b(domaine\s+[\w\s\u00C0-\u024F-]{3,30})\b/i)
    || rawText.match(/\b(maison\s+[\w\s\u00C0-\u024F-]{3,30})\b/i)
    || rawText.match(/\b(tenuta\s+[\w\s\u00C0-\u024F-]{3,30})\b/i)
    || rawText.match(/\b(bodega\s+[\w\s\u00C0-\u024F-]{3,30})\b/i);
  if (chateauMatch) {
    let chateauName = chateauMatch[1].trim().replace(/\s+/g, ' ');
    // Remove trailing words that are metadata, not name
    chateauName = chateauName.replace(/\s+(mis|en|de|du|au|cru|class[ée]?)$/i, '').trim();
    // Capitalize properly
    chateauName = chateauName.replace(/^ch[aâ%]teau/i, 'Château');
    result.producer = chateauName;
    result.name = chateauName;
  }

  // Fallback: use significant lines
  if (!result.name) {
    const significantLines = lines.filter((line) => {
      const l = line.toLowerCase();
      if (/^\d{4}$/.test(line)) return false;
      if (/^\d{1,2}[.,]\d\s*%/.test(line)) return false;
      if (/^(AOC|AOP|DOC|DOCG|DO|AVA|VQA|IGT|IGP)\b/i.test(line)) return false;
      if (/^(appellation|contrôlée|protégée|mis en bouteille|product of|produce of|contains|sulfites|wine of|cru class)/i.test(l)) return false;
      if (/^\d+\s*(ml|cl|l)\b/i.test(line)) return false;
      if (line.length < 3) return false;
      return true;
    });

    if (significantLines.length > 0) {
      result.producer = significantLines[0];
      if (significantLines.length > 1) {
        result.name = significantLines[0] + ' ' + significantLines[1];
      } else {
        result.name = significantLines[0];
      }
    }
  }

  // If we found a vintage, append it to the name if not already there
  if (result.vintage && result.name && !result.name.includes(result.vintage.toString())) {
    result.name = result.name + ' ' + result.vintage;
  }

  // If "Mis en Bouteille au Château" is present, it confirms château bottling
  if (/mis en bouteille au ch[aâ]teau/i.test(fullText) && !result.type) {
    result.type = 'red'; // Most château-bottled French wines are red
  }

  return result;
}

/**
 * Build a search query from extracted label data to look up the wine online.
 */
export function buildSearchQuery(extracted) {
  const parts = [
    extracted.name,
    extracted.producer,
    extracted.vintage,
    extracted.region,
  ].filter(Boolean);
  return [...new Set(parts)].join(' ');
}
