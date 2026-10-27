package io.github.alessandrop95.boardgames;

import android.content.pm.ActivityInfo;
import android.os.Build;
import android.os.Bundle;

/** Apre il sito a schermo intero nel browser del telefono (Trusted Web Activity). */
public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Sulle versioni vecchie di Android fissare l'orientamento con lo sfondo trasparente fa chiudere l'app.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }
}
