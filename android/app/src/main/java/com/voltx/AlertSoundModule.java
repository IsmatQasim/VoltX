package com.voltx;  // make sure this matches your actual package

import android.media.MediaPlayer;
import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AlertSoundModule extends ReactContextBaseJavaModule {
    private static MediaPlayer beepPlayer = null;
    private static MediaPlayer buzzPlayer = null;

    public AlertSoundModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AlertSound";
    }

    @ReactMethod
    public void playBeep() {
        Context context = getReactApplicationContext();
        if (beepPlayer == null) {
            beepPlayer = MediaPlayer.create(context, R.raw.beep);  // put beep.mp3 in res/raw
        }
        if (beepPlayer != null) {
            beepPlayer.start();
        }
    }

    @ReactMethod
    public void playBuzz() {
        Context context = getReactApplicationContext();
        if (buzzPlayer == null) {
            buzzPlayer = MediaPlayer.create(context, R.raw.buzz); // put buzz.mp3 in res/raw
        }
        if (buzzPlayer != null) {
            buzzPlayer.start();
        }
    }
}
