// Known wine database for quick-fill autocomplete
// Each entry contains all the details needed to populate the Add Wine form

const KNOWN_WINES = [
  // === BORDEAUX LEFT BANK ===
  { name: 'Château Margaux', producer: 'Château Margaux', region: 'Bordeaux', country: 'France', appellation: 'Margaux AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Lafite Rothschild', producer: 'Château Lafite Rothschild', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Latour', producer: 'Château Latour', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Mouton Rothschild', producer: 'Château Mouton Rothschild', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Haut-Brion', producer: 'Château Haut-Brion', region: 'Bordeaux', country: 'France', appellation: 'Pessac-Léognan AOC', type: 'red', grapes: ['Merlot', 'Cabernet Sauvignon', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Léoville Barton', producer: 'Château Léoville Barton', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Cru Classé en 1855' },
  { name: 'Château Léoville Las Cases', producer: 'Château Léoville Las Cases', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Cru Classé en 1855' },
  { name: 'Château Léoville Poyferré', producer: 'Château Léoville Poyferré', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Merlot', 'Cabernet Sauvignon', 'Petit Verdot', 'Cabernet Franc'], classification: 'Cru Classé en 1855' },
  { name: 'Château Ducru-Beaucaillou', producer: 'Château Ducru-Beaucaillou', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Lynch-Bages', producer: 'Château Lynch-Bages', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Pichon Baron', producer: 'Château Pichon Baron', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Pichon Lalande', producer: 'Château Pichon Comtesse de Lalande', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Cos d\'Estournel', producer: 'Château Cos d\'Estournel', region: 'Bordeaux', country: 'France', appellation: 'Saint-Estèphe AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Montrose', producer: 'Château Montrose', region: 'Bordeaux', country: 'France', appellation: 'Saint-Estèphe AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Calon-Ségur', producer: 'Château Calon-Ségur', region: 'Bordeaux', country: 'France', appellation: 'Saint-Estèphe AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Cru Classé en 1855' },
  { name: 'Château Palmer', producer: 'Château Palmer', region: 'Bordeaux', country: 'France', appellation: 'Margaux AOC', type: 'red', grapes: ['Merlot', 'Cabernet Sauvignon', 'Petit Verdot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Pontet-Canet', producer: 'Château Pontet-Canet', region: 'Bordeaux', country: 'France', appellation: 'Pauillac AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Gruaud Larose', producer: 'Château Gruaud Larose', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], classification: 'Cru Classé en 1855' },
  { name: 'Château Beychevelle', producer: 'Château Beychevelle', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: 'Cru Classé en 1855' },
  { name: 'Château Talbot', producer: 'Château Talbot', region: 'Bordeaux', country: 'France', appellation: 'Saint-Julien AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'], classification: 'Cru Classé en 1855' },

  // === BORDEAUX RIGHT BANK ===
  { name: 'Château Pétrus', producer: 'Château Pétrus', region: 'Bordeaux', country: 'France', appellation: 'Pomerol AOC', type: 'red', grapes: ['Merlot'], classification: '' },
  { name: 'Château Cheval Blanc', producer: 'Château Cheval Blanc', region: 'Bordeaux', country: 'France', appellation: 'Saint-Émilion AOC', type: 'red', grapes: ['Merlot', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé A' },
  { name: 'Château Ausone', producer: 'Château Ausone', region: 'Bordeaux', country: 'France', appellation: 'Saint-Émilion AOC', type: 'red', grapes: ['Cabernet Franc', 'Merlot'], classification: 'Premier Grand Cru Classé A' },
  { name: 'Château Angélus', producer: 'Château Angélus', region: 'Bordeaux', country: 'France', appellation: 'Saint-Émilion AOC', type: 'red', grapes: ['Merlot', 'Cabernet Franc'], classification: 'Premier Grand Cru Classé A' },
  { name: 'Château Figeac', producer: 'Château Figeac', region: 'Bordeaux', country: 'France', appellation: 'Saint-Émilion AOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Cabernet Franc', 'Merlot'], classification: 'Premier Grand Cru Classé' },
  { name: 'Château Le Pin', producer: 'Château Le Pin', region: 'Bordeaux', country: 'France', appellation: 'Pomerol AOC', type: 'red', grapes: ['Merlot'], classification: '' },
  { name: 'Château La Conseillante', producer: 'Château La Conseillante', region: 'Bordeaux', country: 'France', appellation: 'Pomerol AOC', type: 'red', grapes: ['Merlot', 'Cabernet Franc'], classification: '' },
  { name: 'Vieux Château Certan', producer: 'Vieux Château Certan', region: 'Bordeaux', country: 'France', appellation: 'Pomerol AOC', type: 'red', grapes: ['Merlot', 'Cabernet Franc', 'Cabernet Sauvignon'], classification: '' },

  // === BORDEAUX SWEET ===
  { name: 'Château d\'Yquem', producer: 'Château d\'Yquem', region: 'Bordeaux', country: 'France', appellation: 'Sauternes AOC', type: 'dessert', grapes: ['Sémillon', 'Sauvignon Blanc'], classification: 'Premier Cru Supérieur' },

  // === BURGUNDY ===
  { name: 'Domaine de la Romanée-Conti', producer: 'Domaine de la Romanée-Conti', region: 'Burgundy', country: 'France', appellation: 'Vosne-Romanée', type: 'red', grapes: ['Pinot Noir'], classification: 'Grand Cru' },
  { name: 'Domaine Leroy', producer: 'Domaine Leroy', region: 'Burgundy', country: 'France', appellation: 'Vosne-Romanée', type: 'red', grapes: ['Pinot Noir'], classification: 'Grand Cru' },
  { name: 'Domaine Armand Rousseau', producer: 'Domaine Armand Rousseau', region: 'Burgundy', country: 'France', appellation: 'Gevrey-Chambertin', type: 'red', grapes: ['Pinot Noir'], classification: 'Grand Cru' },
  { name: 'Domaine Georges Roumier', producer: 'Domaine Georges Roumier', region: 'Burgundy', country: 'France', appellation: 'Chambolle-Musigny', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Domaine Comte Georges de Vogüé', producer: 'Domaine Comte Georges de Vogüé', region: 'Burgundy', country: 'France', appellation: 'Chambolle-Musigny', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Domaine Coche-Dury', producer: 'Domaine Coche-Dury', region: 'Burgundy', country: 'France', appellation: 'Meursault', type: 'white', grapes: ['Chardonnay'], classification: '' },
  { name: 'Domaine Leflaive', producer: 'Domaine Leflaive', region: 'Burgundy', country: 'France', appellation: 'Puligny-Montrachet', type: 'white', grapes: ['Chardonnay'], classification: '' },
  { name: 'Louis Jadot', producer: 'Louis Jadot', region: 'Burgundy', country: 'France', appellation: '', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Joseph Drouhin', producer: 'Joseph Drouhin', region: 'Burgundy', country: 'France', appellation: '', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Bouchard Père & Fils', producer: 'Bouchard Père & Fils', region: 'Burgundy', country: 'France', appellation: '', type: 'red', grapes: ['Pinot Noir'], classification: '' },

  // === RHÔNE ===
  { name: 'E. Guigal Côte-Rôtie', producer: 'E. Guigal', region: 'Rhône Valley', country: 'France', appellation: 'Côte-Rôtie', type: 'red', grapes: ['Syrah'], classification: '' },
  { name: 'Château de Beaucastel', producer: 'Château de Beaucastel', region: 'Rhône Valley', country: 'France', appellation: 'Châteauneuf-du-Pape', type: 'red', grapes: ['Grenache', 'Mourvèdre', 'Syrah'], classification: '' },
  { name: 'Château Rayas', producer: 'Château Rayas', region: 'Rhône Valley', country: 'France', appellation: 'Châteauneuf-du-Pape', type: 'red', grapes: ['Grenache'], classification: '' },
  { name: 'M. Chapoutier Hermitage', producer: 'M. Chapoutier', region: 'Rhône Valley', country: 'France', appellation: 'Hermitage', type: 'red', grapes: ['Syrah'], classification: '' },
  { name: 'Paul Jaboulet Aîné Hermitage', producer: 'Paul Jaboulet Aîné', region: 'Rhône Valley', country: 'France', appellation: 'Hermitage', type: 'red', grapes: ['Syrah'], classification: '' },

  // === CHAMPAGNE ===
  { name: 'Dom Pérignon', producer: 'Moët & Chandon', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Chardonnay', 'Pinot Noir'], classification: '' },
  { name: 'Krug Grande Cuvée', producer: 'Krug', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay', 'Pinot Meunier'], classification: '' },
  { name: 'Louis Roederer Cristal', producer: 'Louis Roederer', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay'], classification: '' },
  { name: 'Veuve Clicquot Brut', producer: 'Veuve Clicquot', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay', 'Pinot Meunier'], classification: '' },
  { name: 'Moët & Chandon Impérial', producer: 'Moët & Chandon', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay', 'Pinot Meunier'], classification: '' },
  { name: 'Taittinger Comtes de Champagne', producer: 'Taittinger', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Chardonnay'], classification: '' },
  { name: 'Bollinger Special Cuvée', producer: 'Bollinger', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay'], classification: '' },
  { name: 'Pol Roger Brut Réserve', producer: 'Pol Roger', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Pinot Noir', 'Chardonnay', 'Pinot Meunier'], classification: '' },
  { name: 'Ruinart Blanc de Blancs', producer: 'Ruinart', region: 'Champagne', country: 'France', appellation: 'Champagne', type: 'sparkling', grapes: ['Chardonnay'], classification: '' },

  // === ITALY ===
  { name: 'Sassicaia', producer: 'Tenuta San Guido', region: 'Tuscany', country: 'Italy', appellation: 'Bolgheri DOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Cabernet Franc'], classification: '' },
  { name: 'Tignanello', producer: 'Marchesi Antinori', region: 'Tuscany', country: 'Italy', appellation: 'Toscana IGT', type: 'red', grapes: ['Sangiovese', 'Cabernet Sauvignon', 'Cabernet Franc'], classification: '' },
  { name: 'Ornellaia', producer: 'Tenuta dell\'Ornellaia', region: 'Tuscany', country: 'Italy', appellation: 'Bolgheri DOC', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot'], classification: '' },
  { name: 'Solaia', producer: 'Marchesi Antinori', region: 'Tuscany', country: 'Italy', appellation: 'Toscana IGT', type: 'red', grapes: ['Cabernet Sauvignon', 'Sangiovese', 'Cabernet Franc'], classification: '' },
  { name: 'Biondi-Santi Brunello di Montalcino', producer: 'Biondi-Santi', region: 'Tuscany', country: 'Italy', appellation: 'Brunello di Montalcino DOCG', type: 'red', grapes: ['Sangiovese'], classification: 'Riserva' },
  { name: 'Giacomo Conterno Barolo Monfortino', producer: 'Giacomo Conterno', region: 'Piedmont', country: 'Italy', appellation: 'Barolo DOCG', type: 'red', grapes: ['Nebbiolo'], classification: 'Riserva' },
  { name: 'Bruno Giacosa Barolo', producer: 'Bruno Giacosa', region: 'Piedmont', country: 'Italy', appellation: 'Barolo DOCG', type: 'red', grapes: ['Nebbiolo'], classification: '' },
  { name: 'Gaja Barbaresco', producer: 'Gaja', region: 'Piedmont', country: 'Italy', appellation: 'Barbaresco DOCG', type: 'red', grapes: ['Nebbiolo'], classification: '' },
  { name: 'Amarone della Valpolicella', producer: 'Various', region: 'Veneto', country: 'Italy', appellation: 'Amarone DOCG', type: 'red', grapes: ['Corvina', 'Rondinella', 'Molinara'], classification: '' },
  { name: 'Antinori Chianti Classico Riserva', producer: 'Marchesi Antinori', region: 'Tuscany', country: 'Italy', appellation: 'Chianti Classico DOCG', type: 'red', grapes: ['Sangiovese'], classification: 'Riserva' },
  { name: 'Ser Lapo Chianti Classico Riserva', producer: 'Mazzei (Castello di Fonterutoli)', region: 'Tuscany', country: 'Italy', appellation: 'Chianti Classico DOCG', type: 'red', grapes: ['Sangiovese', 'Merlot'], classification: 'Riserva' },
  { name: 'Castello di Fonterutoli Chianti Classico', producer: 'Mazzei (Castello di Fonterutoli)', region: 'Tuscany', country: 'Italy', appellation: 'Chianti Classico DOCG', type: 'red', grapes: ['Sangiovese', 'Malvasia Nera', 'Colorino'], classification: '' },
  { name: 'Siepi', producer: 'Mazzei', region: 'Tuscany', country: 'Italy', appellation: 'Toscana IGT', type: 'red', grapes: ['Sangiovese', 'Merlot'], classification: '' },

  // === SPAIN ===
  { name: 'Vega Sicilia Único', producer: 'Vega Sicilia', region: 'Ribera del Duero', country: 'Spain', appellation: 'Ribera del Duero DO', type: 'red', grapes: ['Tempranillo', 'Cabernet Sauvignon'], classification: '' },
  { name: 'Pingus', producer: 'Dominio de Pingus', region: 'Ribera del Duero', country: 'Spain', appellation: 'Ribera del Duero DO', type: 'red', grapes: ['Tempranillo'], classification: '' },
  { name: 'Marqués de Riscal Reserva', producer: 'Marqués de Riscal', region: 'Rioja', country: 'Spain', appellation: 'Rioja DOCa', type: 'red', grapes: ['Tempranillo'], classification: 'Reserva' },
  { name: 'López de Heredia Viña Tondonia', producer: 'López de Heredia', region: 'Rioja', country: 'Spain', appellation: 'Rioja DOCa', type: 'red', grapes: ['Tempranillo', 'Garnacha'], classification: 'Gran Reserva' },
  { name: 'La Rioja Alta Gran Reserva 904', producer: 'La Rioja Alta', region: 'Rioja', country: 'Spain', appellation: 'Rioja DOCa', type: 'red', grapes: ['Tempranillo'], classification: 'Gran Reserva' },
  { name: 'CVNE Imperial Gran Reserva', producer: 'CVNE', region: 'Rioja', country: 'Spain', appellation: 'Rioja DOCa', type: 'red', grapes: ['Tempranillo'], classification: 'Gran Reserva' },

  // === USA (CALIFORNIA) ===
  { name: 'Opus One', producer: 'Opus One Winery', region: 'Napa Valley', country: 'USA', appellation: 'Oakville AVA', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'], classification: '' },
  { name: 'Screaming Eagle Cabernet Sauvignon', producer: 'Screaming Eagle', region: 'Napa Valley', country: 'USA', appellation: 'Oakville AVA', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },
  { name: 'Caymus Special Selection', producer: 'Caymus Vineyards', region: 'Napa Valley', country: 'USA', appellation: 'Napa Valley AVA', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },
  { name: 'Silver Oak Cabernet Sauvignon', producer: 'Silver Oak Cellars', region: 'Napa Valley', country: 'USA', appellation: 'Alexander Valley AVA', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },
  { name: 'Stag\'s Leap Cask 23', producer: 'Stag\'s Leap Wine Cellars', region: 'Napa Valley', country: 'USA', appellation: 'Stags Leap District AVA', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },
  { name: 'Robert Mondavi Reserve Cabernet', producer: 'Robert Mondavi Winery', region: 'Napa Valley', country: 'USA', appellation: 'Oakville AVA', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },
  { name: 'Joseph Phelps Insignia', producer: 'Joseph Phelps Vineyards', region: 'Napa Valley', country: 'USA', appellation: 'Napa Valley AVA', type: 'red', grapes: ['Cabernet Sauvignon', 'Petit Verdot', 'Merlot'], classification: '' },
  { name: 'Ridge Monte Bello', producer: 'Ridge Vineyards', region: 'Napa Valley', country: 'USA', appellation: 'Santa Cruz Mountains AVA', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: '' },
  { name: 'Dominus Estate', producer: 'Dominus Estate', region: 'Napa Valley', country: 'USA', appellation: 'Yountville AVA', type: 'red', grapes: ['Cabernet Sauvignon', 'Cabernet Franc', 'Petit Verdot'], classification: '' },

  // === USA (OREGON) ===
  { name: 'Domaine Drouhin Oregon Pinot Noir', producer: 'Domaine Drouhin Oregon', region: 'Willamette Valley', country: 'USA', appellation: 'Dundee Hills AVA', type: 'red', grapes: ['Pinot Noir'], classification: '' },

  // === AUSTRALIA ===
  { name: 'Penfolds Grange', producer: 'Penfolds', region: 'Barossa Valley', country: 'Australia', appellation: 'South Australia', type: 'red', grapes: ['Shiraz'], classification: '' },
  { name: 'Henschke Hill of Grace', producer: 'Henschke', region: 'Barossa Valley', country: 'Australia', appellation: 'Eden Valley', type: 'red', grapes: ['Shiraz'], classification: '' },
  { name: 'Penfolds Bin 389', producer: 'Penfolds', region: 'Barossa Valley', country: 'Australia', appellation: 'South Australia', type: 'red', grapes: ['Cabernet Sauvignon', 'Shiraz'], classification: '' },
  { name: 'Penfolds Bin 407', producer: 'Penfolds', region: 'Barossa Valley', country: 'Australia', appellation: 'South Australia', type: 'red', grapes: ['Cabernet Sauvignon'], classification: '' },

  // === NEW ZEALAND ===
  { name: 'Cloudy Bay Sauvignon Blanc', producer: 'Cloudy Bay', region: 'Marlborough', country: 'New Zealand', appellation: 'Marlborough', type: 'white', grapes: ['Sauvignon Blanc'], classification: '' },
  { name: 'Kim Crawford Sauvignon Blanc', producer: 'Kim Crawford', region: 'Marlborough', country: 'New Zealand', appellation: 'Marlborough', type: 'white', grapes: ['Sauvignon Blanc'], classification: '' },
  { name: 'Felton Road Pinot Noir', producer: 'Felton Road', region: 'Central Otago', country: 'New Zealand', appellation: 'Bannockburn', type: 'red', grapes: ['Pinot Noir'], classification: '' },

  // === ARGENTINA ===
  { name: 'Catena Zapata Malbec', producer: 'Catena Zapata', region: 'Mendoza', country: 'Argentina', appellation: 'Mendoza', type: 'red', grapes: ['Malbec'], classification: '' },
  { name: 'Achaval-Ferrer Malbec', producer: 'Achaval-Ferrer', region: 'Mendoza', country: 'Argentina', appellation: 'Mendoza', type: 'red', grapes: ['Malbec'], classification: '' },

  // === SOUTH AFRICA ===
  { name: 'Kanonkop Pinotage', producer: 'Kanonkop', region: 'Stellenbosch', country: 'South Africa', appellation: 'Stellenbosch', type: 'red', grapes: ['Pinotage'], classification: '' },

  // === PORTUGAL ===
  { name: 'Quinta do Noval Vintage Port', producer: 'Quinta do Noval', region: 'Douro Valley', country: 'Portugal', appellation: 'Port', type: 'fortified', grapes: ['Touriga Nacional', 'Touriga Franca'], classification: 'Vintage Port' },
  { name: 'Taylor\'s Vintage Port', producer: 'Taylor\'s', region: 'Douro Valley', country: 'Portugal', appellation: 'Port', type: 'fortified', grapes: ['Touriga Nacional', 'Touriga Franca'], classification: 'Vintage Port' },

  // === GERMANY ===
  { name: 'Egon Müller Scharzhofberger Riesling', producer: 'Egon Müller', region: 'Mosel', country: 'Germany', appellation: 'Wiltingen', type: 'white', grapes: ['Riesling'], classification: '' },
  { name: 'Dr. Loosen Riesling', producer: 'Dr. Loosen', region: 'Mosel', country: 'Germany', appellation: 'Mosel', type: 'white', grapes: ['Riesling'], classification: '' },
  { name: 'Joh. Jos. Prüm Riesling Spätlese', producer: 'Joh. Jos. Prüm', region: 'Mosel', country: 'Germany', appellation: 'Wehlen', type: 'white', grapes: ['Riesling'], classification: '' },

  // === CANADA ===
  { name: 'Inniskillin Vidal Icewine', producer: 'Inniskillin', region: 'Niagara Peninsula', country: 'Canada', appellation: 'VQA Niagara Peninsula', type: 'dessert', grapes: ['Vidal'], classification: '' },
  { name: 'Tawse Chardonnay', producer: 'Tawse Winery', region: 'Niagara Peninsula', country: 'Canada', appellation: 'VQA Twenty Mile Bench', type: 'white', grapes: ['Chardonnay'], classification: '' },
  { name: 'Hidden Bench Pinot Noir', producer: 'Hidden Bench', region: 'Niagara Peninsula', country: 'Canada', appellation: 'VQA Beamsville Bench', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Norman Hardie Pinot Noir', producer: 'Norman Hardie', region: 'Prince Edward County', country: 'Canada', appellation: 'VQA Prince Edward County', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Mission Hill Reserve', producer: 'Mission Hill Family Estate', region: 'Okanagan Valley', country: 'Canada', appellation: 'VQA Okanagan Valley', type: 'red', grapes: ['Cabernet Sauvignon', 'Merlot'], classification: '' },
  { name: 'Le Clos Jordanne Pinot Noir', producer: 'Le Clos Jordanne', region: 'Niagara Peninsula', country: 'Canada', appellation: 'VQA Twenty Mile Bench', type: 'red', grapes: ['Pinot Noir'], classification: '' },
  { name: 'Pearl Morissette Cabernet Franc', producer: 'Pearl Morissette', region: 'Niagara Peninsula', country: 'Canada', appellation: 'VQA Twenty Mile Bench', type: 'red', grapes: ['Cabernet Franc'], classification: '' },
];

/**
 * Strip accents/diacritics from a string for fuzzy matching
 */
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Search known wines by query string (accent-insensitive fuzzy match)
 * Returns top matches sorted by relevance
 */
export function searchKnownWines(query, limit = 8) {
  if (!query || query.length < 2) return [];

  const q = stripAccents(query.toLowerCase().trim());
  const words = q.split(/\s+/);

  const scored = KNOWN_WINES.map((wine) => {
    const nameLower = stripAccents(wine.name.toLowerCase());
    const producerLower = stripAccents(wine.producer.toLowerCase());
    const searchable = stripAccents(
      `${wine.name} ${wine.producer} ${wine.region} ${wine.appellation} ${wine.grapes.join(' ')} ${wine.country}`.toLowerCase()
    );
    let score = 0;

    // Exact name start match (highest weight)
    if (nameLower.startsWith(q)) score += 100;
    else if (producerLower.startsWith(q)) score += 80;
    // Name or producer contains full query
    else if (nameLower.includes(q)) score += 50;
    else if (producerLower.includes(q)) score += 40;

    // Each word match
    for (const word of words) {
      if (nameLower.includes(word)) score += 10;
      if (producerLower.includes(word)) score += 8;
      if (searchable.includes(word)) score += 3;
    }

    return { wine, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.wine);
}

export default KNOWN_WINES;
