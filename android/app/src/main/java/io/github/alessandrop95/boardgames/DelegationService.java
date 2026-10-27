package io.github.alessandrop95.boardgames;

/** Riceve dal browser le notifiche del sito e le mostra come notifiche dell'app (con il suo nome e la sua icona). */
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
    }
}
