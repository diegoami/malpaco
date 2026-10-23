package io.github.diegoami.malpaco

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  @Volatile private var active = true
  private var gameView: WebView? = null
  private var backPending = false
  private val lifecycle by lazy { getSharedPreferences("malpaco_lifecycle", MODE_PRIVATE) }

  /** A tiny app-private lifecycle bridge; game data is handled separately. */
  inner class GameLifecycle {
    @JavascriptInterface fun isActive(): Boolean = active
    @JavascriptInterface fun requiresResume(): Boolean = lifecycle.getBoolean("resume_required", false)
    @JavascriptInterface fun acknowledgeResume(): Boolean =
      active && lifecycle.edit().putBoolean("resume_required", false).commit()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        if (backPending) return
        val view = gameView
        if (view == null) { moveTaskToBack(true); return }
        backPending = true
        view.evaluateJavascript(
          "!window.dispatchEvent(new Event('malpaco:native-back', {cancelable:true}))"
        ) { handled ->
          backPending = false
          if (handled != "true") moveTaskToBack(true)
        }
      }
    })
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    gameView = webView
    webView.addJavascriptInterface(GameLifecycle(), "MalpacoHost")
  }

  override fun onPause() {
    active = false
    // Keep the resume requirement even if the renderer is later recreated.
    lifecycle.edit().putBoolean("resume_required", true).commit()
    gameView?.evaluateJavascript("window.dispatchEvent(new Event('malpaco:native-background'))", null)
    super.onPause()
  }

  override fun onResume() {
    active = true
    super.onResume()
    gameView?.evaluateJavascript("window.dispatchEvent(new Event('malpaco:native-foreground'))", null)
  }

  override fun onDestroy() {
    active = false
    gameView?.removeJavascriptInterface("MalpacoHost")
    gameView = null
    super.onDestroy()
  }
}
