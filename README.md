# Board Games

Giochi da tavolo da giocare online con gli amici.

## Polvere & Piombo

Gioco di carte western a ruoli segreti, da 4 a 7 giocatori, ognuno dal proprio telefono.

**Gioca:** https://alessandrop95.github.io/board-games/polvere-e-piombo/

- Apri un tavolo, tocca **Invita amici** e manda il link: chi lo apre si siede al tavolo, senza registrarsi.
- I posti vuoti si riempiono con pistoleri automatici.
- Chi apre il tavolo (l'host) tiene la partita sul suo telefono. Se esce, dopo qualche secondo un altro giocatore può prendere il comando.

La sincronizzazione passa da broker MQTT pubblici e gratuiti (HiveMQ, EMQX, Mosquitto), senza server proprio né account.
Tutte le carte, i personaggi e le illustrazioni sono originali e disegnati in SVG nella pagina stessa.

## Presagio

Gioco di carte a prese con previsione, da 3 a 6 giocatori.

**Gioca:** https://alessandrop95.github.io/board-games/presagio/

- 60 carte: quattro casate (Fiamme, Maree, Foreste, Sabbie) da 1 a 13, 4 Arcimaghi (vincono sempre) e 4 Giullari (perdono sempre).
- A ogni mano le carte aumentano di una. Prima si prevede quante prese si faranno, poi si gioca.
- Previsione esatta: 20 punti + 10 per presa. Sbagliata: −10 per ogni presa di differenza.
- Opzione del tavolo: la somma delle previsioni non può essere uguale al numero di prese.
- Tavolo animato: le carte volano dalla mano al centro, la presa va al vincitore, la distribuzione parte dal mazzo.

Illustrazioni: incisioni antiche di pubblico dominio da Wikimedia Commons (Gustave Doré, l'incisione di Will Sommers,
il planisfero di Cellarius e la xilografia Flammarion), ricolorate in stile fantasy da `tools/process_assets.py`.
Originali e crediti in `presagio/img/src/` (scaricati dalla Action «assets»).

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

## Connessione e assenze

- Se la connessione cade o resta "appesa", il gioco se ne accorge e si ricollega da solo; quando riapri l'app dal background si ricollega subito.
- Se l'host sparisce, dopo circa 30 secondi il comando passa automaticamente a un altro giocatore.
- Timer di turno (opzione del tavolo, 60 secondi di base): chi resta fermo oltre il tempo gioca in automatico finché non tocca *Riprendo io*.

## Modificare i giochi

I sorgenti sono in `src/` (parte di rete condivisa in `src/shared/`). Dopo una modifica: `python3 build.py` rigenera le pagine.
