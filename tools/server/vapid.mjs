// Genera una coppia di chiavi VAPID per le notifiche push (usato dall'azione «Server» la prima volta).
import { generateKeys } from '../../supabase/functions/_shared/webpush.js';
console.log(JSON.stringify(await generateKeys()));
