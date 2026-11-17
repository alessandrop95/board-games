/* ===== La Miniera: disegni (pepite, pericoli, idolo, lanterna, campo) ===== */
var MNArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    pick: '<path d="M4 9c4-5 12-5 16 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 6.5 7 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    tent: '<path d="M12 4 3 20h18z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 11l-3.2 9M12 11l3.2 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lamp: '<path d="M9 7h6l1 3v7a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 4h4M12 4v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="13.5" r="2.2" fill="currentColor"/>',
    chest: '<rect x="3.5" y="9" width="17" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M5 9c0-3 2-4.5 7-4.5S19 6 19 9" fill="none" stroke="currentColor" stroke-width="2"/><rect x="10.5" y="11" width="3" height="3.4" rx=".6" fill="currentColor"/>',
    nug: '<path d="M4 15 7.5 8.5 13 6.5l6 3.5 1 5.5-5.5 3H8z" fill="currentColor"/><path d="M7.5 8.5 10 13l3-6.5M10 13l-6 2M10 13l4.5 5.5M10 13l9.8 2.5" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>',
    skull: '<path d="M12 3a7.5 7.5 0 0 0-4.5 13.5V20h9v-3.5A7.5 7.5 0 0 0 12 3z" fill="currentColor"/><circle cx="9.3" cy="11" r="1.8" fill="#2a1b10"/><circle cx="14.7" cy="11" r="1.8" fill="#2a1b10"/><path d="M10.5 20v-2.5M13.5 20v-2.5" stroke="#2a1b10" stroke-width="1.2"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  // disegni grandi delle gallerie (viewBox 100×100)
  var HZ = {
    frana: '<path d="M10 92 30 58l16 10 14-26 20 22 10 28z" fill="#8a6a4c"/><path d="M22 42l9-10 11 6-4 12-12 2zM58 18l10-6 9 9-6 10-11-2zM40 22l6-4 5 5-4 6-6-1z" fill="#b08a62" stroke="#5b4129" stroke-width="2"/><path d="M30 58l16 10 14-26" fill="none" stroke="#5b4129" stroke-width="2.5"/><path d="M48 8v8M36 12l3 6M62 6l-2 6" stroke="#e8d3a8" stroke-width="2.5" stroke-linecap="round"/>',
    grisu: '<circle cx="34" cy="52" r="18" fill="#9bc46a" opacity=".85"/><circle cx="56" cy="40" r="22" fill="#b5d67f" opacity=".85"/><circle cx="66" cy="62" r="16" fill="#86b257" opacity=".85"/><circle cx="46" cy="66" r="14" fill="#a8cd72" opacity=".9"/><path d="M40 46c3-3 7-3 10 0M56 46c3-3 7-3 10 0" stroke="#3c5a1d" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M44 58q8 6 16 0" stroke="#3c5a1d" stroke-width="3" fill="none" stroke-linecap="round"/>',
    piena: '<path d="M6 56q11-10 22 0t22 0 22 0 22 0V94H6z" fill="#3d8bfd"/><path d="M6 70q11-10 22 0t22 0 22 0 22 0V94H6z" fill="#2a6bd1"/><path d="M6 82q11-8 22 0t22 0 22 0 22 0V94H6z" fill="#1d4f9f"/><path d="M50 14c8 12 12 18 12 24a12 12 0 0 1-24 0c0-6 4-12 12-24z" fill="#8fc3ff" stroke="#1d4f9f" stroke-width="2.5"/>',
    pipistrelli: '<g fill="#2b2140" stroke="#c9b6ff" stroke-width="1.5" stroke-linejoin="round"><path d="M50 40c-4-6-12-8-22-4 4 2 6 6 5 10-4-2-9-2-13 2 9 0 15 4 18 10 2-5 7-8 12-8s10 3 12 8c3-6 9-10 18-10-4-4-9-4-13-2-1-4 1-8 5-10-10-4-18-2-22 4z"/><path d="M30 74c-2-3-6-4-11-2 2 1 3 3 2 5-2-1-4-1-6 1 4 0 7 2 9 5 1-2 3-4 6-4s5 2 6 4c2-3 5-5 9-5-2-2-4-2-6-1-1-2 0-4 2-5-5-2-9-1-11 2z" transform="translate(4 -6)"/></g><circle cx="45" cy="46" r="1.6" fill="#ffd75e"/><circle cx="55" cy="46" r="1.6" fill="#ffd75e"/>',
    serpenti: '<path d="M20 80c0-12 16-12 22-4s20 10 22-2-14-12-18-20 6-18 18-16" fill="none" stroke="#5fae4a" stroke-width="11" stroke-linecap="round"/><path d="M20 80c0-12 16-12 22-4s20 10 22-2-14-12-18-20 6-18 18-16" fill="none" stroke="#2f6b26" stroke-width="11" stroke-linecap="round" stroke-dasharray="2 9"/><ellipse cx="68" cy="38" rx="11" ry="8" fill="#5fae4a" stroke="#2f6b26" stroke-width="2"/><circle cx="71" cy="35" r="1.8" fill="#1a1a1a"/><path d="M78 40l8 2-6 2 6 2" fill="none" stroke="#e8453c" stroke-width="2" stroke-linecap="round"/>'
  };
  var LAY = [[], [[50, 50]], [[34, 42], [64, 60]], [[50, 30], [32, 62], [68, 62]], [[33, 33], [67, 33], [33, 67], [67, 67]], [[30, 28], [70, 28], [50, 52], [30, 76], [70, 76]], [[30, 24], [70, 24], [30, 52], [70, 52], [30, 80], [70, 80]]];
  function gem(v) {
    var n = Math.min(6, Math.max(1, Math.ceil(v / 3))), o = '', pos = LAY[n], sc = n <= 2 ? 2.4 : n <= 4 ? 1.8 : 1.45;
    for (var i = 0; i < n; i++) o += '<g transform="translate(' + (pos[i][0] - 12 * sc) + ' ' + (pos[i][1] - 12.5 * sc) + ') scale(' + sc + ')"><path d="M4 15 7.5 8.5 13 6.5l6 3.5 1 5.5-5.5 3H8z" fill="#ffcf3f" stroke="#a26b00" stroke-width="1.2"/><path d="M7.5 8.5 10 13l3-6.5M10 13l-6 2M10 13l4.5 5.5" fill="none" stroke="#fff3b8" stroke-width=".9"/></g>';
    return o;
  }
  var IDOL = '<path d="M50 14c-10 0-16 8-16 18 0 6 2 10 5 13l-6 9h34l-6-9c3-3 5-7 5-13 0-10-6-18-16-18z" fill="#3fc1a5" stroke="#0d5c4c" stroke-width="2.5"/><circle cx="44" cy="31" r="3.2" fill="#ffd75e"/><circle cx="56" cy="31" r="3.2" fill="#ffd75e"/><path d="M44 40h12" stroke="#0d5c4c" stroke-width="2.5" stroke-linecap="round"/><path d="M30 54h40l-4 30H34z" fill="#2c9a83" stroke="#0d5c4c" stroke-width="2.5"/><path d="M38 64h24M40 74h20" stroke="#ffd75e" stroke-width="3" stroke-linecap="round"/>';
  // una galleria del sentiero, grande come una carta
  function card(c, cell) {
    var t = c.charAt(0), body, label, cls;
    if (t === 'g') { var v = +c.slice(1); body = gem(v); label = '<b>' + v + '</b> pepite'; cls = 'gem'; }
    else if (t === 'i') { body = IDOL; label = 'Idolo'; cls = 'idol'; }
    else { var h = c.slice(1); body = HZ[h]; label = MNEngine.HAZ_NAME[h]; cls = 'haz hz-' + h; }
    var floor = cell && t === 'g' && cell.left ? '<span class="floor">' + icon('nug') + cell.left + '</span>' : '';
    var taken = cell && t === 'i' && cell.taken ? ' taken' : '';
    return '<div class="gal ' + cls + taken + '"><svg viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg><span class="gl">' + label + '</span>' + floor + '</div>';
  }
  function hazIcon(h) { return '<svg class="hzi" viewBox="0 0 100 100" aria-hidden="true">' + HZ[h] + '</svg>'; }
  function hero() {
    return '<div class="hero-mine"><div class="hm-tun"></div>' + card('g9') + card('hfrana') + card('i') + '<span class="hm-lamp">' + icon('lamp') + '</span></div>';
  }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="mn-bg" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#7a4a1f"/><stop offset=".55" stop-color="#3b2312"/><stop offset="1" stop-color="#1a0f07"/></radialGradient></defs><rect width="512" height="512" fill="url(#mn-bg)"/>' +
      '<path d="M96 470V250c0-90 72-160 160-160s160 70 160 160v220" fill="#120a04" stroke="#8a5a2b" stroke-width="26"/><path d="M96 250h320M150 140l40 60M362 140l-40 60" stroke="#8a5a2b" stroke-width="20"/>' +
      '<g transform="translate(150 290) scale(9)"><path d="M4 15 7.5 8.5 13 6.5l6 3.5 1 5.5-5.5 3H8z" fill="#ffcf3f" stroke="#a26b00" stroke-width="1"/><path d="M7.5 8.5 10 13l3-6.5M10 13l-6 2M10 13l4.5 5.5M10 13l9.8 2.5" fill="none" stroke="#fff3b8" stroke-width=".8"/></g>' +
      '<g stroke="#e9e1d4" stroke-width="22" stroke-linecap="round" fill="none"><path d="M330 120c40-30 100-24 130 10"/><path d="M398 112 300 330"/></g></svg>';
  }
  return { icon: icon, card: card, hazIcon: hazIcon, hero: hero, defs: defs, logo: logo };
})();
