/* ===== Disegna e indovina: le parole da disegnare =====
   Facili (1 punto): oggetti, animali, cibi, persone e luoghi che si disegnano in pochi tratti.
   Difficili (2 punti): azioni, situazioni, sentimenti, sport particolari, mestieri con i loro attrezzi, storie e
   modi di dire: bisogna inventarsi una scenetta per farli indovinare.
   Le parole già uscite al tavolo non tornano finché non sono finite tutte (vedi engine.js e ui.js). */
var DGData = (function () {
  function L(s) { return s.split('|'); }
  var EASY = L(
    'casa|sole|luna|albero|gatto|cane|pesce|fiore|mela|banana|automobile|bicicletta|treno|aereo|nave|barca|palla|libro|occhiali|cappello|ombrello' +
    '|chiave|orologio|telefono|sedia|tavolo|letto|lampada|finestra|porta|scala|ponte|montagna|nuvola|pioggia|neve|stella|cuore|fungo|carota|uovo|' +
    'pizza|gelato|torta|candela|regalo|palloncino|aquilone|farfalla|ape|ragno|serpente|uccello|coniglio|tartaruga|elefante|giraffa|leone|mucca|ma' +
    'iale|cavallo|pecora|rana|lumaca|balena|squalo|polpo|granchio|pinguino|gufo|mano|piede|occhio|naso|bocca|orecchio|dente|scarpa|maglietta|pant' +
    'aloni|guanto|sciarpa|corona|spada|scudo|castello|razzo|robot|chitarra|tamburo|campana|forbici|matita|zaino|bottiglia|bicchiere|forchetta|cuc' +
    'chiaio|coltello|pentola|tazza|ciliegia|fragola|uva|pera|ananas|anguria|limone|pomodoro|cactus|palma|isola|vulcano|arcobaleno|fulmine|faro|te' +
    'nda|fuoco|ancora|bandiera|freccia|busta|televisione|computer|microfono|valigia|anello|dado|scopa|secchio|martello|lucchetto|semaforo|autobus' +
    '|camion|trattore|elicottero|sottomarino|mongolfiera|paracadute|pupazzo di neve|ombrellone|conchiglia|stella marina|occhiolino|sorriso|nido|r' +
    'agnatela|tromba|violino|pianoforte|occhio di bue|biscotto|panino|hamburger|ciambella|lecca lecca|caramella|torre|piramide|igloo|tavola da su' +
    'rf|altalena|scivolo|scheletro|teschio|cappello da cowboy|baffi|barba|parrucca|cravatta|calzino|stivale|ombra|vela|remo|bussola|mappa|tesoro|' +
    'topo|criceto|scoiattolo|riccio|volpe|lupo|orso|orso polare|panda|koala|canguro|scimmia|gorilla|tigre|leopardo|ghepardo|zebra|rinoceronte|ipp' +
    'opotamo|cammello|dromedario|lama|alce|cervo|renna|cinghiale|castoro|talpa|pipistrello|procione|puzzola|tasso|lontra|foca|tricheco|delfino|or' +
    'ca|pesce rosso|pesce palla|pesce spada|cavalluccio marino|medusa|riccio di mare|aragosta|gambero|calamaro|seppia|vongola|cozza|ostrica|cocco' +
    'drillo|alligatore|lucertola|camaleonte|geco|iguana|cobra|rospo|girino|salamandra|chiocciola|verme|lombrico|scorpione|formica|vespa|calabrone' +
    '|mosca|zanzara|coccinella|bruco|libellula|grillo|cavalletta|cicala|scarafaggio|lucciola|pulce|gallina|gallo|pulcino|anatra|oca|cigno|tacchin' +
    'o|pavone|struzzo|fenicottero|pellicano|gabbiano|piccione|passero|pettirosso|rondine|merlo|corvo|pappagallo|tucano|aquila|falco|civetta|picch' +
    'io|colibrì|toro|vitello|agnello|capra|asino|pony|unicorno|drago|dinosauro|mammut|sirena|pane|focaccia|piadina|toast|tramezzino|hot dog|patat' +
    'ine|spaghetti|lasagna|ravioli|tortellini|gnocchi|risotto|minestra|polpetta|salame|prosciutto|formaggio|mozzarella|uovo fritto|frittata|biste' +
    'cca|coscia di pollo|pesce fritto|sushi|taco|burrito|kebab|insalata|patata|cipolla|aglio|peperone|peperoncino|melanzana|zucchina|zucca|cetrio' +
    'lo|broccolo|cavolfiore|lattuga|piselli|fagioli|mais|pannocchia|oliva|arancia|mandarino|pompelmo|melone|cocco|kiwi|pesca|albicocca|prugna|fic' +
    'o|mango|lampone|mirtillo|melograno|castagna|noce|nocciola|arachide|mandorla|cono gelato|ghiacciolo|torta di compleanno|crostata|cornetto|bri' +
    'oche|cannolo|panettone|colomba|pasticcino|muffin|cupcake|pancake|waffle|cioccolata|tavoletta di cioccolato|zucchero filato|pop corn|marmella' +
    'ta|miele|burro|latte|caffè|tazzina di caffè|tè|succo di frutta|limonata|frullato|bibita|lattina|acqua|vino|birra|spumante|cocktail|cannuccia' +
    '|villa|grattacielo|capanna|tetto|camino|balcone|ascensore|cancello|recinto|cassetta della posta|campanello|serratura|cuscino|coperta|armadio' +
    '|cassettiera|comodino|sveglia|lampadina|specchio|quadro|tappeto|tenda da finestra|divano|poltrona|sgabello|scrivania|libreria|mensola|teleco' +
    'mando|radio|cellulare|portatile|tablet|tastiera|mouse|stampante|cuffie|altoparlante|macchina fotografica|frigorifero|forno|microonde|lavatri' +
    'ce|lavastoviglie|aspirapolvere|ferro da stiro|asciugacapelli|ventilatore|condizionatore|termosifone|lavandino|rubinetto|vasca da bagno|docci' +
    'a|water|carta igienica|spazzolino|dentifricio|pettine|spazzola|sapone|shampoo|asciugamano|rasoio|profumo|rossetto|smalto|padella|coperchio|m' +
    'estolo|piatto|teiera|caffettiera|barattolo|scatola|cestino|paletta|mocio|spugna|bacinella|stendino|molletta|appendiabiti|gruccia|borsa|porta' +
    'foglio|moneta|banconota|salvadanaio|carta di credito|francobollo|lettera|pacco|fiocco|nastro|festone|coriandoli|maschera|trombetta|camicia|m' +
    'aglione|felpa|giacca|cappotto|impermeabile|pantaloncini|jeans|gonna|vestito|pigiama|costume da bagno|calzini|calze|mutande|scarpe|scarpe da ' +
    'ginnastica|stivali|ciabatte|infradito|sandali|tacchi|berretto|cappellino|cuffia|guanti|cintura|papillon|bretelle|occhiali da sole|collana|br' +
    'accialetto|orecchini|diadema|mantello|grembiule|tuta|quaderno|diario|penna|gomma|temperino|righello|squadra|compasso|astuccio|pennarello|pas' +
    'telli|pennello|tavolozza|colla|graffetta|puntina|cartella|lavagna|gesso|cartina geografica|mappamondo|calcolatrice|microscopio|telescopio|le' +
    'nte d\'ingrandimento|provetta|calamita|chiodo|vite|cacciavite|pinza|chiave inglese|sega|trapano|metro|livella|scala a pioli|carriola|pala|ras' +
    'trello|zappa|annaffiatoio|tosaerba|tubo dell\'acqua|cesoie|macchina da corsa|taxi|pullman|furgone|camper|roulotte|ruspa|gru|betoniera|ambulan' +
    'za|camion dei pompieri|auto della polizia|moto|motorino|monopattino|skateboard|pattini|locomotiva|tram|metropolitana|funivia|seggiovia|alian' +
    'te|deltaplano|dirigibile|astronave|disco volante|satellite|barca a vela|gommone|canoa|kayak|zattera|nave pirata|traghetto|yacht|motoscafo|je' +
    't ski|slitta|carrozza|carro|ruota|volante|cartello stradale|strisce pedonali|benzinaio|parcheggio|galleria|binari|stazione|porto|aeroporto|l' +
    'una piena|mezzaluna|stella cadente|cometa|pianeta|terra|temporale|fiocco di neve|ghiacciolo appeso|grandine|vento|tornado|nebbia|collina|gro' +
    'tta|cascata|fiume|lago|mare|onda|spiaggia|deserto|oasi|duna|bosco|foresta|giungla|prato|campo di grano|pino|abete|quercia|salice|cespuglio|s' +
    'iepe|foglia|ramo|radice|tronco|ghianda|pigna|rosa|margherita|girasole|tulipano|papavero|giglio|orchidea|ninfea|quadrifoglio|erba|sasso|rocci' +
    'a|sabbia|castello di sabbia|pozzanghera|ghiacciaio|iceberg|igloo innevato|testa|faccia|lingua|labbra|capelli|sopracciglio|ciglia|collo|spall' +
    'a|braccio|gomito|dito|pollice|unghia|pancia|ombelico|schiena|gamba|ginocchio|tallone|cervello|impronta|impronta digitale|pallone da calcio|p' +
    'allone da basket|pallina da tennis|racchetta|mazza da baseball|mazza da golf|porta da calcio|canestro|rete|fischietto|coppa|medaglia|trofeo|' +
    'birillo|bocce|freccette|bersaglio|arco|elmo|armatura|pistola ad acqua|fionda|yo yo|trottola|bambola|orsacchiotto|peluche|cavallo a dondolo|g' +
    'iostra|ruota panoramica|montagne russe|castello gonfiabile|carte da gioco|scacchi|dama|puzzle|cubo di rubik|videogioco|joystick|chitarra ele' +
    'ttrica|basso|violoncello|contrabbasso|arpa|organo|fisarmonica|flauto|clarinetto|sassofono|trombone|tuba|batteria|maracas|triangolo|xilofono|' +
    'campanella|nota musicale|giradischi|disco|cassetta|mp3|tempio|chiesa|campanile|moschea|colosseo|torre di pisa|torre eiffel|statua della libe' +
    'rtà|mulino a vento|fattoria|fienile|stalla|pozzo|fontana|panchina|lampione|cabina telefonica|edicola|negozio|supermercato|carrello|cassa|ban' +
    'comat|banca|ospedale|farmacia|scuola|biblioteca|museo|cinema|teatro|stadio|piscina|palestra|parco|parco giochi|zoo|acquario|circo|tendone|lu' +
    'na park|ristorante|pizzeria|bar|gelateria|panetteria|macelleria|pescheria|mercato|bancarella|hotel|campeggio|rifugio|baita|prigione|municipi' +
    'o|ufficio postale|caserma dei pompieri|commissariato|cimitero|piazza|strada|incrocio|rotonda|autostrada|marciapiede|fogna|tombino|bambino|ne' +
    'onato|nonno|nonna|mamma|papà|gemelli|sposi|re|regina|principe|principessa|cavaliere|pirata|cowboy|indiano|ninja|samurai|vichingo|astronauta|' +
    'alieno|fantasma|mostro|vampiro|zombie|mummia|strega|mago|fata|folletto|gnomo|gigante|nano|elfo|babbo natale|befana|angelo|diavolo|supereroe|' +
    'clown|mimo|giocoliere|equilibrista|sub|sciatore|surfista|pugile|ballerina|cuoco|pizzaiolo|medico|infermiere|dentista|poliziotto|vigile|pompi' +
    'ere|soldato|marinaio|pilota|autista|postino|contadino|pescatore|giardiniere|muratore|idraulico|elettricista|meccanico|falegname|pittore|scul' +
    'tore|fotografo|cantante|musicista|direttore d\'orchestra|maestra|scienziato|detective|ladro|spazzacamino|pastore|cacciatore|minatore|albero d' +
    'i natale|pallina di natale|stella cometa|presepe|calza della befana|uovo di pasqua|coniglio di pasqua|zucca di halloween|pipistrello di hall' +
    'oween|cappello da strega|maschera di carnevale|fuochi d\'artificio|petardo|candelina|torta nuziale|anello di fidanzamento|bouquet|confetti|cu' +
    'ore spezzato|bacio|abbraccio|lacrima|sudore|zzz|punto interrogativo|punto esclamativo|freccia direzionale|segno della pace|simbolo dell\'euro' +
    '|chiocciola della mail|hashtag|codice a barre|semaforo rosso|divieto di sosta|teschio dei pirati|mappa del tesoro|forziere|lingotto d\'oro|di' +
    'amante|cristallo|bacchetta magica|lampada di aladino|tappeto volante|sfera di cristallo|calderone|scopa volante|uovo di dinosauro|osso|impro' +
    'nta di cane|cuccia|guinzaglio|ciotola|gabbia|acquario dei pesci|voliera|spaventapasseri|sdraio|salvagente|materassino|pinne|maschera da sub|' +
    'boa|paletta e secchiello|pallone da spiaggia|occhiali da sci|sci|snowboard|slittino|pattini da ghiaccio|bob|scala mobile|barbiere|pagliaccio' +
    '|cappuccino|gondola|pinocchio|navigatore|bagaglio|passaporto|podio|popcorn|fumetto|caricabatterie|ridere|piangere|sbadigliare|cerotto|stampe' +
    'lle|sedia a rotelle|termometro|siringa|pillola|sciroppo|mascherina|stetoscopio|pala eolica|chiavetta usb|emoji|drone|monopattino elettrico|a' +
    'uto elettrica|scontrino|gatto nero|ferro di cavallo|quadrifoglio fortunato|mangiafuoco|pallavolo|beach volley|basket|tennis|ping pong|golf|m' +
    'inigolf|bowling|biliardo|freccette al pub|rugby|football americano|baseball|hockey su ghiaccio');
  var HARD = L(
    'mal di testa|compleanno|matrimonio|vacanza|sciare|nuotare|dormire|russare|starnuto|selfie|ingorgo|eclissi|polo nord|terremoto|tombola|carnev' +
    'ale|rigore|tuffo|karate|yoga|picnic|barbecue|labirinto|idea|sogno|orchestra|chirurgo|tribunale|elezioni|pagella|compiti|ricreazione|interrog' +
    'azione|gita scolastica|colazione|trasloco|mutuo|bolletta|sciopero|coda|multa|casello|dogana|abbronzatura|scottatura|nevicata|valanga|pattina' +
    'ggio|maratona|arbitro|tifoso|concerto|karaoke|discoteca|wifi|batteria scarica|influencer|fidanzati|gelosia|vergogna|paura|felicità|noia|corr' +
    'ere|camminare|saltare|tuffarsi|pattinare|arrampicarsi|scalare|ballare|cantare|fischiare|urlare|starnutire|tossire|sognare|svegliarsi|stiracc' +
    'hiarsi|lavarsi i denti|pettinarsi|truccarsi|radersi|vestirsi|allacciarsi le scarpe|cucinare|impastare|friggere|apparecchiare|sparecchiare|la' +
    'vare i piatti|stirare|stendere i panni|spolverare|passare l\'aspirapolvere|annaffiare|potare|seminare|raccogliere|pescare|cacciare|guidare|pa' +
    'rcheggiare|frenare|sorpassare|fare benzina|fare l\'autostop|pedalare|remare|navigare|volare|atterrare|decollare|cadere|inciampare|scivolare|r' +
    'otolare|girare|spingere|tirare|sollevare|lanciare|afferrare|calciare|palleggiare|segnare|parare|tifare|esultare|applaudire|salutare|abbracci' +
    'are|baciare|litigare|fare pace|bisbigliare|spiare|nascondersi|cercare|trovare|perdere|rubare|scappare|inseguire|aspettare|fare la fila|pagar' +
    'e|comprare|vendere|regalare|scartare un regalo|festeggiare|brindare|soffiare le candeline|fare un selfie|scattare una foto|telefonare|scrive' +
    're un messaggio|leggere|scrivere|disegnare|dipingere|colorare|ritagliare|incollare|costruire|aggiustare|rompere|smontare|contare|misurare|pe' +
    'sare|studiare|copiare|alzare la mano|sbagliare|vincere|perdere la partita|arrivare primo|meditare|fare yoga|fare la verticale|fare la ruota|' +
    'fare le flessioni|sollevare pesi|fare jogging|fare surf|fare immersioni|fare snorkeling|fare un pupazzo di neve|fare a palle di neve|prender' +
    'e il sole|spalmare la crema|gonfiare un palloncino|fare le bolle di sapone|giocare a nascondino|giocare a carte|fare un puzzle|lavorare a ma' +
    'glia|cucire|suonare il campanello|bussare|aprire la porta|chiudere a chiave|accendere il fuoco|spegnere la luce|fare la spesa|portare a spas' +
    'so il cane|dare da mangiare ai pesci|mungere la mucca|cavalcare|fare la doccia|fare il bagno|asciugarsi i capelli|mettersi lo smalto|fare la' +
    ' valigia|prendere il treno|perdere l\'autobus|fare l\'occhiolino|alzare le spalle|mangiarsi le unghie|grattarsi la testa|fare il broncio|mostr' +
    'are la lingua|pronto soccorso|sala d\'attesa|sala operatoria|dal dentista|dal parrucchiere|dal barbiere|in lavanderia|in palestra|in bibliote' +
    'ca|in discoteca|al cinema|a teatro|al concerto|allo stadio|al mare|in montagna|in campeggio|in crociera|in aereo|in metropolitana|in ascenso' +
    're|in coda alla posta|al supermercato|al mercato|in pizzeria|al ristorante|al bar|alla cassa|al casello|all\'autolavaggio|dal meccanico|dal v' +
    'eterinario|in farmacia|in banca|in ufficio|in riunione|in fabbrica|in cantiere|in miniera|in laboratorio|sulla luna|nello spazio|sott\'acqua|' +
    'in fondo al mare|nel deserto|al polo nord|nella giungla|in una grotta|in un labirinto|su un\'isola deserta|in prigione|in tribunale|al circo|' +
    'al luna park|sulle montagne russe|in una casa stregata|in un castello|alla fiera|in spiaggia|sotto l\'ombrellone|in piscina|in sauna|alle ter' +
    'me|in una baita|sulla neve|in barca a vela|in mongolfiera|su un treno|alla stazione|in aeroporto|alla dogana|al matrimonio|alla laurea|al co' +
    'mpleanno|a una festa in maschera|a carnevale|a capodanno|a ferragosto|alla vigilia di natale|a pasqua|a halloween|alla sagra|al pic nic|al b' +
    'arbecue|in gita scolastica|all\'interrogazione|alla ricreazione|all\'esame di guida|al colloquio di lavoro|al primo appuntamento|in luna di mi' +
    'ele|al trasloco|in vacanza|amore|amicizia|invidia|coraggio|rabbia|stanchezza|fame|sete|freddo|caldo|febbre|raffreddore|mal di pancia|singhio' +
    'zzo|solletico|prurito|puntura di zanzara|livido|ingessatura|radiografia|alluvione|incendio|siccità|tramonto|alba|mezzanotte|mezzogiorno|buio' +
    '|eco|riflesso|silenzio|rumore|musica|odore|profumo di pane|puzza|velocità|gravità|elettricità|magnetismo|calore|ghiaccio sciolto|vapore|fumo' +
    '|nebbia in val padana|inquinamento|riciclo|raccolta differenziata|energia solare|centrale elettrica|password|internet|virus del computer|ric' +
    'arica del telefono|notifica|mi piace|meme|youtuber|diretta streaming|podcast|intelligenza artificiale|realtà virtuale|navigatore satellitare' +
    '|autovelox|manifestazione|scheda elettorale|tasse|saldi|black friday|offerta speciale|coupon|carta fedeltà|prestito|stipendio|pensione|ferie' +
    '|ponte del primo maggio|lunedì mattina|venerdì sera|sabato sera|domenica pomeriggio|pausa caffè|pausa pranzo|colpo di sonno|sveglia che suon' +
    'a|ritardo|anticipo|appuntamento|scadenza|compleanno dimenticato|sorpresa|scherzo|pesce d\'aprile|barzelletta|indovinello|segreto|pettegolezzo' +
    '|bugia|promessa|scommessa|fortuna|sfortuna|specchio rotto|desiderio|stella cadente esprimi un desiderio|oroscopo|zodiaco|destino|magia|incan' +
    'tesimo|maledizione|pozione|fantasma in soffitta|leggenda|favola|fiaba|cappuccetto rosso|biancaneve|cenerentola|la bella addormentata|il gatt' +
    'o con gli stivali|hansel e gretel|il brutto anatroccolo|la lepre e la tartaruga|il lupo e i tre porcellini|il pifferaio magico|aladino|peter' +
    ' pan|capitan uncino|alice nel paese delle meraviglie|il piccolo principe|robin hood|re artù|la spada nella roccia|ulisse|il cavallo di troia' +
    '|ercole|medusa con i serpenti|il minotauro|icaro|babbo natale sulla slitta|la befana sulla scopa|in bocca al lupo|acqua in bocca|alzare il g' +
    'omito|avere le mani bucate|avere la testa tra le nuvole|essere al settimo cielo|fare orecchie da mercante|prendere due piccioni con una fava' +
    '|piove sul bagnato|non vedere l\'ora|mettere il carro davanti ai buoi|cercare un ago in un pagliaio|essere un pesce fuor d\'acqua|avere un dia' +
    'volo per capello|fare una figuraccia|rompere il ghiaccio|tagliare la corda|andare a gonfie vele|essere sulla stessa barca|stare con le mani ' +
    'in mano|fare il passo più lungo della gamba|chi dorme non piglia pesci|a caval donato non si guarda in bocca|il mattino ha l\'oro in bocca|av' +
    'ere le farfalle nello stomaco|avere la pelle d\'oca|essere un orso|essere una volpe|essere un coniglio|lacrime di coccodrillo|dormire come un' +
    ' ghiro|sano come un pesce|muto come un pesce|forte come un toro|lento come una lumaca|testardo come un mulo|fame da lupi|freddo cane|tempo d' +
    'a lupi|ultima spiaggia|colpo di fulmine|luna di miele|pecora nera|gallina dalle uova d\'oro|cavallo di battaglia|tallone d\'achille|vaso di pa' +
    'ndora|castello in aria|buco nell\'acqua|mosca bianca|mal di mare|fuori di testa|testa a testa|faccia a faccia|mano nella mano|cuore a cuore|a' +
    'stronauta in tuta spaziale|archeologo|architetto|avvocato|giudice|notaio|commercialista|impiegato|segretaria|cassiere|commesso|barista|camer' +
    'iere|sommelier|chef|pasticciere|panettiere|macellaio|pescivendolo|fruttivendolo|fioraio|tabaccaio|edicolante|parrucchiere|estetista|tatuator' +
    'e|sarto|stilista|modella|fotografo di moda|giornalista|inviato|conduttore tv|attore|regista|cameraman|truccatore|ballerino|coreografo|dj|rap' +
    'per|rockstar|cantante lirico|violinista|pianista|batterista|chitarrista|scrittore|poeta|bibliotecario|insegnante|professore|preside|bidello|' +
    'pediatra|veterinario|farmacista|psicologo|fisioterapista|personal trainer|allenatore|guardalinee|portiere|calciatore|tennista|nuotatore|cicl' +
    'ista|pilota di formula uno|fantino|torero|alpinista|guida turistica|hostess|steward|capitano di una nave|comandante|controllore|ferroviere|t' +
    'assista|camionista|rider|corriere|magazziniere|operaio|saldatore|imbianchino|piastrellista|giardiniere con il tosaerba|apicoltore|viticoltor' +
    'e|allevatore|pastore con il gregge|boscaiolo|guardia forestale|bagnino|maestro di sci|vigile del fuoco|carabiniere|guardia giurata|spia|agen' +
    'te segreto|hacker|programmatore|youtuber famoso|influencer di moda|prete|suora|sindaco|presidente|re sul trono|regina d\'inghilterra|mago con' +
    ' il coniglio|prestigiatore|illusionista|domatore di leoni|trapezista|burattinaio|cantastorie|olimpiadi|mondiali di calcio|finale di champion' +
    's|giro d\'italia|tour de france|staffetta|salto in alto|salto con l\'asta|lancio del peso|nuoto sincronizzato|tuffi|pallanuoto|badminton|scher' +
    'ma|judo|boxe|lotta|sollevamento pesi|ginnastica artistica|ginnastica ritmica|equitazione|polo|curling|pattinaggio artistico|sci di fondo|sla' +
    'lom|salto con gli sci|snowboard sulla neve|surf sull\'onda|windsurf|kitesurf|canottaggio|rafting|parapendio|paracadutismo|bungee jumping|arra' +
    'mpicata|trekking|corsa campestre|triathlon|formula uno|motogp|rally|autoscontro|karting|calcio d\'angolo|fuorigioco|cartellino rosso|var|gol ' +
    'in rovesciata|autogol|tempi supplementari|festival di sanremo|oscar|red carpet|tappeto rosso|autografo|fan|prima fila|biglietto del concerto' +
    '|bis|standing ovation|sipario|applausi|pop corn al cinema|film horror|film d\'amore|cartone animato|telenovela|serie tv|reality show|quiz tel' +
    'evisivo|telegiornale|previsioni del tempo|pubblicità|spot|videoclip');
  return { EASY: EASY, HARD: HARD };
})();
if (typeof module !== 'undefined') module.exports = DGData;
