# Board Games

Giochi da tavolo da giocare online con gli amici.

## Polvere & Piombo

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

## Presagio

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

## Gattomina

Gioco di carte esplosivo con i gatti, da 2 a 5 giocatori (regole equivalenti al gioco base dei gattini esplosivi, con nomi e grafica originali).

**Gioca:** https://alessandrop95.github.io/board-games/gattomina/

- 56 carte: 4 Gattomine, 6 Scatolette (disinnesco), Agguato, Pisolino, Fusa, Gomitolo, Sfera, Soffio! e cinque tipi di Micio da giocare in coppia.
- Ognuno riceve 7 carte e una Scatoletta; nel mazzo ci sono tante Gattomine quanti i giocatori meno uno.
- Dopo ogni carta giocata compare un annuncio con chi la gioca, su chi e che effetto avrà; ci sono 9 secondi (6–15 a scelta dell'host) per rispondere con un Soffio!, anche a catena. Se tutti toccano «Lascia passare» si prosegue subito.
- Combinazioni: coppia (rubi a caso), tris (chiedi una carta precisa), cinque diverse (prendi dagli scarti).
- Grafica: emoji 3D di [Noto Emoji](https://github.com/googlefonts/noto-emoji) di Google, licenza Apache 2.0 (copia in `gattomina/img/e/`), composte in carte cartoon.

## Musica e suoni

- Ogni gioco ha la sua musica di sottofondo e i suoi effetti (spari e cavalli nel western, cristalli e arpe in Presagio, miagolii ed esplosioni in Gattomina).
- Il pulsante con l'altoparlante accende o spegne separatamente musica ed effetti; la scelta resta salvata sul telefono.
- Musica di Kevin MacLeod (incompetech.com, CC BY 3.0) e «Maple Leaf Rag» suonata da Scott Joplin (1916, pubblico dominio); suoni registrati da Wikimedia Commons (pubblico dominio, CC0, CC BY-SA); gli altri effetti sono sintetizzati nel browser. Originali in `*/audio/src/`, conversione con `tools/process_audio.sh`.

## Installare i giochi sul telefono

- **Android (Chrome):** tocca *Installa app* nella pagina del gioco, oppure menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.
- **iPhone e iPad (Safari):** Condividi → *Aggiungi alla schermata Home* → *Aggiungi*.

## Tavoli aperti e chiusura

- Nella schermata iniziale di ogni gioco c'è la lista dal vivo dei **Tavoli aperti**.
- Chi apre un tavolo sceglie: **Aperto a tutti** (ci si siede con un tocco; in partita si può guardare) oppure **Solo su invito** (compare nella lista ma serve il codice o il link). L'host può cambiarlo dalla sala d'attesa.
- L'host può **chiudere il tavolo** (sala d'attesa o Menu): tutti tornano alla home e il tavolo sparisce dalla lista. I tavoli abbandonati spariscono da soli dopo poco più di un minuto.

## Chat al tavolo

- Pulsante **Chat** in alto, nella sala d'attesa e durante la partita, con il numero di messaggi nuovi e un'anteprima quando arriva un messaggio.
- Frasi rapide ("Ben giocata!", "Tocca a te!"…); chi entra dopo vede gli ultimi messaggi; i messaggi arrivano anche se l'host è assente.
- **Fissa sul tavolo**: gli ultimi messaggi restano sempre in vista sopra il tavolo (si sgancia con la ×). La scelta vale per il tuo telefono.

## Connessione e assenze

- Se la connessione cade o resta "appesa", il gioco se ne accorge e si ricollega da solo; quando riapri l'app dal background si ricollega subito.
- Se l'host sparisce, dopo circa 30 secondi il comando passa automaticamente a un altro giocatore.
- Timer di turno (opzione del tavolo, 60 secondi di base): chi resta fermo oltre il tempo gioca in automatico finché non tocca *Riprendo io*.

## Modificare i giochi

I sorgenti sono in `src/` (parte di rete condivisa in `src/shared/`). Dopo una modifica: `python3 build.py` rigenera le pagine.

**Modifiche dal telefono (o da github.com).** Modifica i file in `src/` e conferma con *Commit changes* sul ramo `main`.
L'azione *Ricostruisci i giochi* controlla che il codice non abbia errori di scrittura, rigenera le pagine con `build.py`
e le pubblica: dopo 1–2 minuti il gioco aggiornato è online. Se qualcosa va storto, la scheda *Actions* mostra l'errore in rosso
e il gioco online resta com'era. Non modificare a mano `*/index.html`: vengono riscritti a ogni ricostruzione.
