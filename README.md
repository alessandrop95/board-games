# Board Games

Giochi da tavolo da giocare online con gli amici.

## Bang! (`polvere-e-piombo`)

Gioco di carte western a ruoli segreti, da 4 a 7 giocatori, ognuno dal proprio telefono.

**Gioca:** https://alessandrop95.github.io/board-games/polvere-e-piombo/

- Apri un tavolo, tocca **Invita amici** e manda il link: chi lo apre si siede al tavolo, senza registrarsi.
- I posti vuoti si riempiono con pistoleri automatici.
- Chi apre il tavolo (l'host) tiene la partita sul suo telefono. Se esce, dopo qualche secondo un altro giocatore può prendere il comando.

La sincronizzazione passa da broker MQTT pubblici e gratuiti (HiveMQ, EMQX, Mosquitto), senza server proprio né account.
Nomi, testi e grafica delle carte sono originali. Le illustrazioni sono disegni e dipinti western di pubblico dominio
(soprattutto Frederic Remington, più stampe dell'Ottocento da Harper's Weekly e cartoline d'inizio Novecento), presi da
Wikimedia Commons e appena virati in seppia da `tools/process_pp.py`; originali e crediti in `polvere-e-piombo/img/src/`.

- Su ogni avviso dei giocatori si leggono il potere del personaggio, i punti vita, le carte in mano, l'arma, la distanza
  e le carte in gioco con il loro effetto.
- Animazioni: carte che volano tra mano, mazzo, scarti e tavolo; colpi di pistola, Mitraglia, Stampede, esplosioni del
  Candelotto, sfide, eliminazioni, estrazioni, distribuzione iniziale e fine partita.

## Wizard (`presagio`)

Gioco di carte a prese con previsione, da 3 a 6 giocatori.

**Gioca:** https://alessandrop95.github.io/board-games/presagio/

- 60 carte: quattro casate (Fiamme, Maree, Foreste, Sabbie) da 1 a 13, 4 Arcimaghi (vincono sempre) e 4 Giullari (perdono sempre).
- A ogni mano le carte aumentano di una. Prima si prevede quante prese si faranno, poi si gioca.
- Previsione esatta: 20 punti + 10 per presa. Sbagliata: −10 per ogni presa di differenza.
- Opzione del tavolo: la somma delle previsioni non può essere uguale al numero di prese.
- Opzione del tavolo: previsioni coperte, che si scoprono tutte insieme a fine mano.
- Con tante carte in mano il ventaglio passa su due file, così ogni carta resta leggibile.
- Tavolo animato: le carte volano dalla mano al centro, la presa va al vincitore, la distribuzione parte dal mazzo.

Illustrazioni: incisioni antiche di pubblico dominio da Wikimedia Commons (Gustave Doré, l'incisione di Will Sommers,
il planisfero di Cellarius e la xilografia Flammarion), ricolorate in stile fantasy da `tools/process_assets.py`.
Originali e crediti in `presagio/img/src/` (scaricati dalla Action «assets»).

## Exploding Kittens (`gattomina`)

Gioco di carte esplosivo con i gatti, da 2 a 5 giocatori (regole equivalenti al gioco base dei gattini esplosivi, con nomi e grafica originali).

**Gioca:** https://alessandrop95.github.io/board-games/gattomina/

- 56 carte: 4 Gattomine, 6 Scatolette (disinnesco), Agguato, Pisolino, Fusa, Gomitolo, Sfera, Soffio! e cinque tipi di Micio da giocare in coppia.
- Ognuno riceve 7 carte e una Scatoletta; nel mazzo ci sono tante Gattomine quanti i giocatori meno uno.
- Dopo ogni carta giocata compare un annuncio con chi la gioca, su chi e che effetto avrà; ci sono 9 secondi (6–15 a scelta dell'host) per rispondere con un Soffio!, anche a catena. Se tutti toccano «Lascia passare» si prosegue subito.
- Combinazioni: coppia (rubi a caso), tris (chiedi una carta precisa), cinque diverse (prendi dagli scarti).
- Grafica: emoji 3D di [Noto Emoji](https://github.com/googlefonts/noto-emoji) di Google, licenza Apache 2.0 (copia in `gattomina/img/e/`), composte in carte cartoon.

## Scythe (`campi-acciaio`)

Strategia dieselpunk da 2 a 5 giocatori (regole equivalenti a un noto gioco di mech e campagne; nomi, testi, carte e grafica originali).

**Gioca:** https://alessandrop95.github.io/board-games/campi-acciaio/

- Cinque fazioni (Regno di Brina, Unione di Ferro, Orda della Steppa, Impero di Carbone, Repubblica dei Campi), ognuna con personaggio, animale, abilità e quattro mech diversi; cinque plance giocatore. Fazioni e plance vengono assegnate a caso.
- Ogni turno si sceglie una colonna della plancia: azione in alto (Muovi, Rinforza, Commercia, Produci) e poi in basso (Aggiorna, Schiera, Costruisci, Arruola). La partita finisce quando qualcuno conquista la sesta stella; vince chi ha più monete.
- Mappa di 54 esagoni dipinta dal codice (nessuna immagine esterna): fiumi animati, gallerie, laghi, incontri, la Fabbrica che fuma. Le mosse si preparano sulla mappa in anteprima e partono solo alla conferma.
- Battaglie con scelta segreta di potere e carte, 28 incontri, 12 carte Fabbrica e 23 obiettivi scritti da zero. Ogni passo ha un «?» con la spiegazione; le regole complete sono nel gioco.
- Giocatori automatici che valutano ogni colonna della plancia su una copia della partita.

## Ticket to Ride Italy

Gioco di treni e tratte ferroviarie da 2 a 5 giocatori con le regole della mappa Italia (cartella `binari-italia/`: indirizzi, tavoli e statistiche restano quelli di prima). Mappa, carte e grafica sono originali.

**Gioca:** https://alessandrop95.github.io/board-games/binari-italia/

- Mappa dell’Italia con 43 città, 4 Paesi confinanti (Francia, Svizzera, Austria, Slovenia) con 10 valichi e 93 tratte, compresi i traghetti per Sicilia e Sardegna e i binari doppi. Coste, laghi e fiumi da [Natural Earth](https://www.naturalearthdata.com/) (pubblico dominio), dipinti dal codice in stile carta ferroviaria d’epoca.
- 5 biglietti all’inizio (se ne tengono almeno 3), 56 biglietti in tutto, 12 dei quali verso i Paesi confinanti; durante la partita se ne pescano 4.
- Quattro azioni per turno: pescare 2 carte vagone, conquistare una tratta, pescare biglietti o prendere una **carta Traghetto** (al massimo 2 in mano; ognuna paga fino a 2 spazi con l’onda, una locomotiva uno solo).
- Le tratte verso i Paesi confinanti sono vicoli ciechi: tratte diverse verso lo stesso Paese non sono collegate tra loro.
- A fine partita c’è il **bonus delle regioni**: ogni rete di tratte collegate vale punti secondo quante delle 19 regioni tocca, e Sicilia, Sardegna e Puglia complete valgono doppio. Non c’è il bonus per il percorso più lungo. Il pulsante con lo stemma colora le stazioni per regione; «Regioni e bonus» mostra le proprie reti.
- Presentazione delle regole alla prima partita, «?» su ogni fase, mete dei propri biglietti cerchiate sulla mappa, conteggio finale con biglietti e regioni.
- Giocatori automatici che pianificano i biglietti con il percorso più economico, prendono le carte Traghetto quando servono e cercano di unire le proprie reti. Dati della mappa generati con gli script in `tools/binari-italia/`.

## Catan

Gioco di coloni, risorse e commercio da 3 a 4 giocatori, con le regole del gioco base (fondazione, produzione, 7 e ladro, commercio con giocatori, banca e porti, carte sviluppo, Strada più lunga ed Esercito più grande). Grafica originale.

**Gioca:** https://alessandrop95.github.io/board-games/catan/

- Isola di 19 tessere diversa a ogni partita (6 e 8 mai vicini), 9 porti, numeri con i puntini della probabilità. I sei terreni sono dipinti dal codice: foreste di abeti, pascoli con le pecore, campi di grano, colline d’argilla con la fornace, montagne innevate con la miniera, deserto.
- Fondazione a serpentina, poi a ogni turno: lancio dei dadi, commercio e costruzione nell’ordine che si vuole (variante combinata). I posti validi lampeggiano sull’isola: si tocca e si conferma.
- Scambi tra giocatori dal proprio telefono: chi è di turno propone a tutti, gli altri accettano o rifiutano, lui sceglie con chi chiudere. Scambi con la banca e i porti (4:1, 3:1, 2:1).
- Col 7: scarto di metà delle carte per chi ne ha più di 7, poi ladro e furto. Carte sviluppo: Cavaliere, Punto vittoria, Costruzione di strade, Invenzione, Monopolio.
- Opzioni dell’host: punti per vincere (8, 10 o 12) e «ladro gentile» (non colpisce chi ha 2 punti o meno).
- Presentazione alla prima partita, «?» su ogni fase, schede delle tessere con la probabilità, conteggio finale dei punti.
- Giocatori automatici che scelgono gli incroci migliori, commerciano, usano le carte e spostano il ladro sul giocatore in testa.

## Machiavelli

Il gioco di carte italiano con due mazzi francesi (104 carte, senza jolly), da 2 a 5 giocatori.

**Gioca:** https://alessandrop95.github.io/board-games/machiavelli/

- 13 carte a testa (l’host può scegliere 15). Combinazioni: tris e poker (stesso valore, semi diversi) e scale dello stesso seme (asso basso A-2-3 o alto Q-K-A, mai K-A-2).
- Nel proprio turno o si gioca almeno una carta della mano riorganizzando a piacere tutto il tavolo (alla fine le combinazioni devono essere tutte valide e le carte del tavolo restano sul tavolo), oppure si pesca. Vince chi finisce le carte; a mazzo finito chi non può giocare passa e, se passano tutti, vince chi ha meno carte.
- Variante «apertura a 36»: la prima giocata solo con carte proprie, per almeno 36 punti.
- Sul telefono le carte si **trascinano** (o si selezionano a tocchi) dalla mano e dal tavolo: mentre si trascina, le combinazioni dove la carta sta bene si accendono di verde, le mosse sbagliate vengono rifiutate, le combinazioni incomplete restano rosse finché non vanno a posto. «Annulla» rimette tutto com’era; gli altri vedono la bozza in diretta.
- Carte disegnate da zero (semi, figure e dorso), giocatori automatici che attaccano carte, spezzano scale e prendono in prestito carte libere dal tavolo.

## Unlock!

Escape room cooperativa in carte, da 1 a 6 giocatori, ognuno dal proprio telefono: si gioca tutti insieme contro lo stesso timer.

**Gioca:** https://alessandrop95.github.io/board-games/unlock/

- Le regole sono quelle di Unlock!: carte numerate da scoprire quando il loro numero compare su una carta in tavola (anche nascosto nei disegni), carte **rosse + blu** da unire sommando i numeri, modificatori «+N», macchine (carte verdi) da far funzionare, lucchetti con codici di 4 cifre (carte gialle), carte da scartare, penalità di tempo, indizi e soluzioni per ogni carta, pausa e valutazione da 1 a 5 stelle.
- Le avventure sono **originali** (storie, enigmi e disegni creati da zero, non quelle delle scatole ufficiali), con difficoltà da 1 a 4:
  - «La soffitta del nonno» (1/4, tutorial, 10 minuti);
  - «Abisso» (2/4, 60 minuti, a bordo di un sottomarino in avaria);
  - «Espresso di Mezzanotte» (3/4, 60 minuti): un treno del 1928 lanciato verso un viadotto crollato. Indizi da incrociare tra più carte (registro, biglietto, porte), un’incisione da leggere allo specchio, comandi in tedesco da tradurre; **solo 2 indizi** in tutta l’avventura, che costano anche tempo;
  - «Il teatro dell’illusionista» (3/4, 60 minuti): Milano 1908, il Grande Zambrini chiuso nella cassa d’acqua della Sparizione. Carte segnate da riconoscere, luci di scena da ricostruire incrociando copione e campionario, un cifrario di Cesare, due numeri da trovare con «Cerca» (la botola e il palco); **solo 2 indizi**;
  - «La tomba di Neferka» (4/4, **estremo**, 60 minuti): sepolti in una tomba egizia. Numeri egizi da decifrare, il nome del re da scrivere in geroglifici, stelle da allineare, trappole; **un solo indizio**, errori e ricerche a vuoto che costano 2–4 minuti;
  - «Stazione Polare» (4/4, **estremo**, 60 minuti): Svalbard 1958, un aereo nella tormenta e la pista al buio. Una catena lunga tra quattro stanze: frequenza radio da calcolare, Morse da decifrare, una mappa con la bussola girata, un registro con un dato falso, due taniche da non confondere, l’avviamento a freddo di un diesel e il vento da leggere sulla manica; **un solo indizio**.
- **Numeri da calcolare** (livelli 3 e 4): alcune carte non hanno un numero da toccare, si deduce dagli indizi e si cerca con **Cerca**. Una ricerca a vuoto costa tempo.
- **Tempo scaduto = avventura persa**: allo zero (anche per colpa di una penalità) il gioco si ferma per tutti e l’host fa **ricominciare da capo**, con tutte le carte di nuovo coperte e il timer pieno.
- Carte illustrate e animate (bolle, luci d’emergenza, pesci, polvere), carte che si girano quando escono, unioni che si scontrano, lucchetti che si aprono, schermo rosso per le penalità, timer che batte negli ultimi secondi.
- Ognuno vede le stesse carte ma può guardarne una diversa: sotto ogni carta compare chi la sta guardando, e con «Segnala» la si fa lampeggiare sugli altri telefoni.
- Partita guidata: il tutorial da soli, con il passo consigliato sempre a portata di dito.

## Skyjo

Il gioco di carte delle griglie, da 2 a 8 giocatori, con le regole ufficiali. Grafica originale.

**Gioca:** https://alessandrop95.github.io/board-games/skyjo/

- 150 carte da −2 a 12, colorate per fasce (notte, nuvole, colline, sole, temporale). Ognuno ha 12 carte coperte in 3 righe × 4 colonne e all’inizio di ogni manche ne scopre 2 (tutti insieme); nella prima manche comincia chi ha la somma più alta, poi chi ha chiuso la manche prima.
- Nel turno: prendi la carta degli scarti e mettila al posto di una tua, oppure pesca dal mazzo e tienila o scartala scoprendo una carta coperta. Tre carte scoperte uguali in colonna spariscono.
- Chi scopre tutte le carte chiude: gli altri giocano un ultimo turno. Se chi ha chiuso non ha il punteggio più basso (da solo), i suoi punti positivi raddoppiano. La partita finisce a 100 punti (l’host può scegliere 50 o 150): vince il totale più basso.
- Tavolo animato: carte che volano dal mazzo e dagli scarti e si girano in 3D, colonne che brillano ed esplodono verso gli scarti, il cielo che cambia a ogni manche (alba, giorno, tramonto, notte), punti della manche con il timbro del raddoppio, podio e segnapunti a fine partita.
- Presentazione alla prima partita, «?» su ogni fase, regole complete con esempi, giocatori automatici che inseguono le colonne ed evitano di chiudere quando rischiano il raddoppio.

## Flip 7

Il gioco di carte dove si tenta la fortuna, da 2 a 8 giocatori (dà il meglio da 3 in su), con le regole ufficiali. Grafica originale: un luna park di notte.

**Gioca:** https://alessandrop95.github.io/board-games/flip7/

- 94 carte: un solo 0 e tante copie quanto il valore da 1 a 12 (i puntini sotto il numero ricordano quante sono), i modificatori +2 +4 +6 +8 +10 e ×2, e tre copie di ognuna delle azioni Congela, Flip Three e Seconda possibilità.
- A ogni manche il mazziere dà una carta scoperta a testa, poi a turno si sceglie PESCA o STOP. Un numero doppio fa sballare (zero punti), a meno di avere la Seconda possibilità. Sette numeri diversi: Flip 7, la manche finisce subito e valgono 15 punti in più. Le azioni si danno a chi si vuole tra chi è in gioco (Flip Three a catena, con le azioni pescate nel mezzo usate dopo).
- Punti: somma dei numeri, ×2 sui numeri, poi i modificatori, poi +15 per il Flip 7. Le carte giocate non tornano nel mazzo finché non finisce. Si gioca fino a 200 punti (l’host può scegliere 100 o 300); a pari merito in testa si gioca un’altra manche.
- Tavolo animato: ruota panoramica, lucine e fari sullo sfondo; carte che volano dal mazzo e si girano, le azioni che si fermano sotto il faretto e poi volano dal giocatore scelto, la fila che trema e il timbro «SBALLATO!», il ghiaccio di Congela, i fuochi d’artificio del Flip 7, i punti della manche che contano da zero, podio e segnapunti.
- Indicatore del rischio di sballare (dalle carte rimaste nel mazzo), presentazione alla prima partita, «?» su ogni momento, regole complete con esempi, giocatori automatici che contano le carte e scelgono con cura a chi dare le azioni.
- Flip 7 usa per ora tre brani già presenti nel sito.

## Citadels

Il gioco dei personaggi segreti, da 4 a 7 giocatori (se siete in meno, i posti mancanti li prendono i giocatori automatici), con le regole ufficiali dell’edizione 2016. Grafica originale: una città medievale di notte, carte e ritratti disegnati da zero.

**Gioca:** https://alessandrop95.github.io/board-games/citadels/

- 8 personaggi (Assassino, Ladro, Mago, Re, Vescovo, Mercante, Architetto, Condottiero) e 68 quartieri: 54 base in quattro colori (nobili, religiosi, commerciali, militari) e 14 quartieri unici viola con il loro effetto (Porta del Drago, Fabbrica, Quartiere Infestato, Tesoro Imperiale, Mastio, Laboratorio, Biblioteca, Sala delle Mappe, Cava, Scuola di Magia, Fucina, Statua, Covo dei Ladri, Pozzo dei Desideri).
- Ogni round: scelta segreta dei personaggi a giro (comincia chi ha la corona; scarti scoperti con 4 e 5 giocatori, uno coperto sempre, il Re mai scoperto, il settimo giocatore può prendere quello coperto), poi chiamata dall’1 all’8. Nel turno: 2 oro oppure 2 carte (se ne tiene una), un quartiere da costruire (tre per l’Architetto), il potere del personaggio e l’oro dei quartieri del suo colore.
- Fine partita al round in cui una città arriva a 7 quartieri. Punti: costo dei quartieri, +3 per i cinque colori, +4 a chi completa per primo e +2 agli altri, bonus degli unici; a pari merito vince il personaggio più alto.
- Istruzioni sempre chiare: la riga «Adesso» spiega cosa succede e cosa fare, con i passi del turno (① Risorse ② Costruisci ③ Potere) che si spuntano; la corte in alto mostra gli 8 personaggi con chi è di turno, chi ha già giocato, chi è stato scartato, ucciso o derubato; il registro delle ultime mosse; il «?» apre la regola giusta per ogni momento; la finestra di scelta del personaggio dice quanto oro renderebbe ciascuno con la propria città; avviso se si chiude il turno senza costruire.
- Tavolo animato: la grande rivelazione del personaggio chiamato («Si chiama il 6… è Bea!»), il pugnale dell’Assassino, il sacco del Ladro, le monete che volano dal tesoro, le carte dal mazzo, i quartieri che si costruiscono nella città, l’esplosione del Condottiero, la corona che passa, i fuochi della città completa, la classifica con i punti voce per voce.
- Presentazione alla prima partita, regole complete, giocatori automatici che scelgono il personaggio più utile, mirano Assassino e Ladro su chi è in testa e usano il Condottiero contro chi sta per completare la città.
- Citadels usa per ora tre brani già presenti nel sito.

## Musica e suoni

- Ogni gioco ha la sua musica di sottofondo e i suoi effetti (spari e cavalli nel western, cristalli e arpe in Presagio, miagolii ed esplosioni in Gattomina).
- Il pulsante con l'altoparlante accende o spegne separatamente musica ed effetti; la scelta resta salvata sul telefono.
- Skyjo usa per ora tre brani già presenti nel sito («Carefree», «Fluffing a Duck», «Enchanted Valley»).
- Musica di Kevin MacLeod (incompetech.com, CC BY 3.0) e «Maple Leaf Rag» suonata da Scott Joplin (1916, pubblico dominio); suoni registrati da Wikimedia Commons (pubblico dominio, CC0, CC BY-SA); gli altri effetti sono sintetizzati nel browser. Originali in `*/audio/src/`, conversione con `tools/process_audio.sh`.

## Installare i giochi sul telefono

- **Android:** nella home tocca *Scarica l’app* e installa `board-games.apk` (la prima volta Android chiede di consentire l’installazione da Chrome).
  È una vera app: icona, schermo intero e notifiche anche a telefono bloccato. Gli aggiornamenti si installano sopra la versione precedente.
  In alternativa, dal browser: *Installa dal browser*, oppure menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.
- **iPhone e iPad (Safari):** Condividi → *Aggiungi alla schermata Home* → *Aggiungi*. Le notifiche su iPhone arrivano solo aprendo i giochi dall’icona sulla Home (iOS 16.4 o successivo).

## Tavoli aperti e chiusura

- Nella schermata iniziale di ogni gioco c'è la lista dal vivo dei **Tavoli aperti**.
- Chi apre un tavolo sceglie: **Aperto a tutti** (ci si siede con un tocco; in partita si può guardare), **Solo su invito** (compare nella lista ma serve il codice o il link) oppure, con l'account, **Solo amici** (lo vedono e ricevono la notifica solo i tuoi amici, che si siedono con un tocco). L'host può cambiarlo dalla sala d'attesa.
- **Invita amico** (tavolo privato): il tavolo non compare in nessuna lista, nessuno riceve avvisi e gli amici non vedono dove sei; col solo codice non si entra. L'host crea un **invito personale** (pulsante *Crea un invito personale*, *Invita amici* o *Copia link*): è un link che vale per una sola persona, che può poi rientrare quando vuole; per gli altri quel link non funziona più. Con l'account, l'invito a un amico dalla sala gli manda direttamente il suo link personale. Nello stato del tavolo c'è solo l'impronta della chiave, non la chiave.
- **Serie di partite**: in sala d'attesa l'host sceglie *Partite singole*, *Al meglio di 3* o *Al meglio di 5*. Con «Nuova partita con lo stesso tavolo» le vittorie si sommano; la classifica della serie è in sala d'attesa e nella schermata finale.
- **Partita guidata**: nella lista dei tavoli di ogni gioco, *🎓 Partita guidata* apre una partita di prova contro i bot (non compare nella lista, nessun limite di tempo). Una barra in alto spiega cosa fare in quel momento e *Fai la mossa consigliata* gioca la mossa che sceglierebbe un giocatore esperto. Si nasconde con ×.
- In **home**, *Continua la partita* mostra i tavoli dove sei seduto, in qualsiasi gioco.
- L'host può **chiudere il tavolo** (sala d'attesa o Menu): tutti tornano alla home e il tavolo sparisce dalla lista. I tavoli abbandonati spariscono da soli dopo poco più di un minuto.
- **Uscire (pulsante *Esci*):**
  - **host**: sceglie tra *Esci e lascia il comando a…* (passa da solo al primo giocatore collegato; in partita al suo posto gioca l'automatico) e *Chiudi il tavolo per tutti*. Se al tavolo restano solo giocatori automatici, il tavolo si può solo chiudere e la partita finisce;
  - **gli altri, a partita iniziata**: *Lascia la partita* (l'automatico prende il posto fino alla fine) oppure *Esci per ora* (il posto resta tuo e puoi rientrare). In sala d'attesa si esce e basta.

## Chat al tavolo

- **Reazioni rapide**: il pulsante 😊 accanto a *Chat* manda un'emoji che tutti vedono per qualche secondo.

- Pulsante **Chat** in alto, nella sala d'attesa e durante la partita, con il numero di messaggi nuovi e un'anteprima quando arriva un messaggio.
- Frasi rapide ("Ben giocata!", "Tocca a te!"…); chi entra dopo vede gli ultimi messaggi; i messaggi arrivano anche se l'host è assente.
- **Fissa sul tavolo**: gli ultimi messaggi restano sempre in vista sopra il tavolo (si sgancia con la ×). La scelta vale per il tuo telefono.

## Connessione e assenze

- Se la connessione cade o resta "appesa", il gioco se ne accorge e si ricollega da solo; quando riapri l'app dal background si ricollega subito.
- Se l'host sparisce, dopo circa 30 secondi il comando passa automaticamente a un altro giocatore.
- Timer di turno (opzione del tavolo, 60 secondi di base): chi resta fermo oltre il tempo gioca in automatico finché non tocca *Riprendo io*.

## Modificare i giochi

I sorgenti sono in `src/` (parte di rete condivisa in `src/shared/`). Dopo una modifica: `python3 build.py` rigenera tutte le pagine, oppure `python3 build.py campi-acciaio` solo quella di un gioco.

**Modifiche dal telefono (o da github.com).** Modifica i file in `src/` e conferma con *Commit changes* sul ramo `main`.
L'azione *Ricostruisci i giochi* controlla che il codice non abbia errori di scrittura, rigenera con `build.py` solo le pagine
dei giochi i cui sorgenti sono cambiati (tutte, se cambia `src/shared/` o `build.py`) e le pubblica: dopo 1–2 minuti il gioco aggiornato è online. Se qualcosa va storto, la scheda *Actions* mostra l'errore in rosso
e il gioco online resta com'era. Conviene modificare `src/`: se cambi a mano una pagina `*/index.html`, l'azione se ne accorge e **non** la sovrascrive
(compare un avviso giallo in *Actions*), ma quella pagina smette di ricevere gli aggiornamenti finché la stessa modifica non viene riportata in `src/`.

## Presenza e notifiche

- Accanto a ogni giocatore c'è un pallino: verde se è collegato, grigio con la scritta «offline» se ha chiuso l'app o perso la rete.
  Se tocca a un giocatore offline da più di 45 secondi, gioca l'automatico al suo posto (anche con «Nessun limite»); quando torna riprende lui.
- **Notifiche** (anche ad app chiusa, senza app esterne): *Nuovo tavolo* quando qualcuno apre un tavolo **aperto a tutti** nei giochi scelti,
  e *Inviti degli amici*. Si attivano dal pulsante 👤 → *Notifiche*, dove si scelgono anche i giochi. Ogni telefono va attivato una volta.
  Con l’app aperta l’avviso compare in alto nella pagina, con «Siediti». I tavoli «solo su invito» non vengono annunciati.

## Account e amici

- Per giocare serve un account: **nome utente e password**, nient’altro (niente email). Si crea dal pulsante 👤 *Accedi o registrati* nella home o in un gioco.
- **Amici:** 👤 → *Amici* → scrivi il nome utente. L’altro riceve la richiesta (anche come notifica) e la accetta.
- **Invitare:** nella sala d’attesa del tavolo tocca *Invita un amico* → *Invita*: all’amico arriva una notifica che lo porta direttamente al tavolo.
- Dal pannello 👤 si cambia la password, si esce o si cancella l’account (con amici e notifiche).
- Le password sono salvate cifrate (bcrypt); dopo troppi tentativi sbagliati l’accesso a quel nome si blocca per qualche minuto.
- **Amici online**: nella lista amici (pulsante 👤) un pallino verde indica chi è collegato, con dove si trova («sta giocando a Wizard», «è al tavolo di Bang!, in attesa»); *Raggiungi* ti porta al suo tavolo.
- **Statistiche** (👤 → *Statistiche e classifica tra amici*): partite giocate e vinte per gioco, ultime partite e classifica tra te e i tuoi amici, per tutti i giochi o per uno. Contano le partite finite da quando hai l'account (non quelle di prova).

## Prove automatiche

In `tests/` ci sono le prove di tutto il progetto (regole, notifiche, database e partite vere nel browser con più telefoni simulati): vedi `tests/README.md`.
Le fa girare da solo il workflow **Prove** dopo ogni ricostruzione dei giochi e quando cambiano server, home o pagine: se qualcosa si rompe il pallino in *Actions* diventa rosso e arriva una email da GitHub.

## Configurare il server

Account, amici e notifiche usano un progetto **Supabase** gratuito. Va creato una volta sola; il resto lo fa GitHub da solo
(workflow *Server (Supabase)*: database, funzione `notify` che manda le notifiche Web Push, chiavi delle notifiche, `server.json` per il sito).
Finché il server non è configurato i giochi funzionano come prima, senza account.

1. Vai su [supabase.com](https://supabase.com), registrati (piano *Free*) e crea un **New project**: nome `board-games`,
   regione *Central EU (Frankfurt)*. Come **Database Password** tocca *Generate a password* e **copiala** subito.
2. **Project ref**: è il codice nell’indirizzo della dashboard, `supabase.com/dashboard/project/`**`abcdefghijklmnop`**
   (si trova anche in *Project Settings → General → Project ID*).
3. **Access token**: in alto a destra, avatar → *Account preferences* → *Access Tokens* → *Generate new token* (nome `github`), e copialo.
4. Su GitHub: repository → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*, tre volte:
   | Nome | Valore |
   |---|---|
   | `SUPABASE_ACCESS_TOKEN` | il token del punto 3 |
   | `SUPABASE_PROJECT_REF` | il project ref del punto 2 |
   | `SUPABASE_DB_PASSWORD` | la password del punto 1 |
5. *Actions* → **Server (Supabase)** → *Run workflow*. Dopo 2–3 minuti il workflow è verde, nel repository compare `server.json`
   e poco dopo nel sito appare *Accedi o registrati*.

Il workflow riparte da solo quando cambia `supabase/`, e ogni giorno fa una piccola richiesta al server perché il progetto gratuito
non venga messo in pausa per inattività. Le chiavi delle notifiche vengono create la prima volta e restano solo su Supabase.

## App Android

L’app è una *Trusted Web Activity*: apre il sito nel motore di Chrome a schermo intero, quindi ogni aggiornamento dei giochi arriva subito anche nell’app.
Sorgenti in `android/` (icone generate con `python3 tools/android/icone.py`). La costruisce il workflow **App Android**, che la pubblica
nelle *Releases* del repository; il sito la offre da `app.json`.

1. Aggiungi il segreto del repository **`ANDROID_KEYSTORE_PASSWORD`**: una password lunga (almeno 12 caratteri) che non userai altrove.
   **Conservala** (per esempio nel gestore delle password): senza di lei non si possono più pubblicare aggiornamenti dell’app.
2. *Actions* → **App Android** → *Run workflow*. La prima volta crea la chiave di firma `android/firma.p12` (protetta dalla password) e la salva nel repository;
   dopo 3–5 minuti l’APK è nelle *Releases* e nella home compare *Scarica l’app*. Ogni modifica in `android/` pubblica una nuova versione.
3. *Facoltativo, ma consigliato:* per togliere la barra con l’indirizzo in cima all’app, crea il repository pubblico **`alessandrop95.github.io`**
   (*Add file → Create new file*) con due file:
   - `.nojekyll` (vuoto);
   - `.well-known/assetlinks.json` con il contenuto di `android/assetlinks.json` (creato dal workflow al punto 2).

   Poi riapri l’app (se serve, cancellane i dati una volta): Android verifica il collegamento e la barra sparisce.
