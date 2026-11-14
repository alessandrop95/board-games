/* ===== Tiro alla fune di parole: lettere e parole conosciute =====
   Le parole di questa lista valgono subito e senza discussioni, e sono quelle che cercano i giocatori
   automatici. Le altre parole trovate dalle persone valgono lo stesso, ma a fine round gli avversari possono
   contestarle e il tavolo vota. */
var FNData = (function () {
  var WORDS = ('ago ala ali alba albe alce alto alta alti alte ama amo ami ano ape api ara are aria arie arco arte asse asso aste asta atto ave avo ' +
    'bar bere bici boa bue buoi caro cara cari care casa case cane cani cena cene cera ceri cesto cielo ciao cima cime coda code collo colla cono cori coro corto corta corsa cosa cose costa coste crea ' +
    'dado dadi dama dame dare data date dato dati dente denti dio dire dita dito dodo dono doni dote dove due ' +
    'eco era ere erba erbe eroe esca est etto ' +
    'fame fare faro fata fate fede fico fila file filo fine fiore fiori foca foce fogli folla fonte forno forte foro fra frate ' +
    'gas gatto gatti gelo gene gente gesto gira giro gola gole gomma gonna gru ' +
    'idea idee idolo isola isole ira ' +
    'lago laghi lama lame lana lato lati latte lega legno lei lente leone lesso letto lieto lima lime lino lira lire lite lodo lodi loro lotto luna lune luce luci lupo lupi ' +
    'mai male mani mano mare mari mela mele meno mente mese mesi meta mete metro mie mio mira mite moda mode molto mondo monte mora more moro moto mulo muro mura muta ' +
    'nano nani nastro naso nasi neo nero nera neri nere neve nido nodo nodi noce noci noi nome nomi nona nono nord nota note notte nove nube nuoto nuova nuovo ' +
    'oca oche occhi occhio odio ogni olio olivo oliva ombra onda onde ora ore orco oro orso orsi orto osso ossa otto ovest ' +
    'pace pala pale palo pane papa pare pari parte passo pasta pena penne pera pere peso pesi pia piano pino pini pio pista pila pile pira piu poco poca poi polo pomo ponte porta porte porto posa posto pozzo prato premio pro prua pugno pura puro ' +
    're rana rane rapa rate rea regina remo remi rete reti rima rime riso rito riva rive roca rosa rose rosso rotta rotto rude ruota ' +
    'sala sale salto sano santo sapone sasso sera sere seta sete sedia sei sole soli sono sopra sordo sorte sosta spada spine sport stella sud suo sua suono suore ' +
    'tana tane tara tasca tasto tavola tela tele tema temi tempo tenda terra tesi teso testa tetto tigre tipo tiro toga tono topo topi tordo torre torta torte tosse tre trono tuo tua tuono tutto ' +
    'uno una uomo uova uovo urlo uso usi uva ' +
    'vaso vasi vela vele vena vene vento vero vera veri vespa via vie vino vini vita vite viso voce voci volo voto vuoto ' +
    'zaino zero zia zie zio zii zona zone zoo').split(' ');
  // frequenza delle lettere in italiano (in decimi di punto percentuale), senza H, J, K, Q, W, X, Y
  var FREQ = { a: 117, b: 9, c: 45, d: 37, e: 118, f: 12, g: 16, i: 113, l: 65, m: 25, n: 69, o: 98, p: 31, r: 64, s: 50, t: 56, u: 30, v: 21, z: 5 };
  return { WORDS: WORDS, FREQ: FREQ };
})();
if (typeof module !== 'undefined') module.exports = FNData;
