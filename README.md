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

## Musica e suoni

- Ogni gioco ha la sua musica di sottofondo e i suoi effetti (spari e cavalli nel western, cristalli e arpe in Presagio, miagolii ed esplosioni in Gattomina).
- Il pulsante con l'altoparlante accende o spegne separatamente musica ed effetti; la scelta resta salvata sul telefono.
- Musica di Kevin MacLeod (incompetech.com, CC BY 3.0) e «Maple Leaf Rag» suonata da Scott Joplin (1916, pubblico dominio); suoni registrati da Wikimedia Commons (pubblico dominio, CC0, CC BY-SA); gli altri effetti sono sintetizzati nel browser. Originali in `*/audio/src/`, conversione con `tools/process_audio.sh`.

## Installare i giochi sul telefono

- **Android:** nella home tocca *Scarica l’app* e installa `board-games.apk` (la prima volta Android chiede di consentire l’installazione da Chrome).
  È una vera app: icona, schermo intero e notifiche anche a telefono bloccato. Gli aggiornamenti si installano sopra la versione precedente.
  In alternativa, dal browser: *Installa dal browser*, oppure menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.
- **iPhone e iPad (Safari):** Condividi → *Aggiungi alla schermata Home* → *Aggiungi*. Le notifiche su iPhone arrivano solo aprendo i giochi dall’icona sulla Home (iOS 16.4 o successivo).

## Tavoli aperti e chiusura

- Nella schermata iniziale di ogni gioco c'è la lista dal vivo dei **Tavoli aperti**.
- Chi apre un tavolo sceglie: **Aperto a tutti** (ci si siede con un tocco; in partita si può guardare), **Solo su invito** (compare nella lista ma serve il codice o il link) oppure, con l'account, **Solo amici** (lo vedono e ricevono la notifica solo i tuoi amici, che si siedono con un tocco). L'host può cambiarlo dalla sala d'attesa.
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
