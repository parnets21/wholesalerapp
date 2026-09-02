package com.wholesalerapp

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createNotificationChannels()
  }

  /**
   * Create all FCM notification channels required by the app.
   *
   * Android 8.0+ (API 26+) requires channels to be registered before
   * a notification can be displayed with sound / vibration.
   *
   * Channel IDs referenced in the backend FCM message:
   *   • "approval_channel"  — registration approval notifications (HIGH importance)
   *
   * This method is idempotent: calling it multiple times has no effect because
   * Android ignores createNotificationChannel() if the channel already exists.
   */
  private fun createNotificationChannels() {
    // Channels are only available on Android 8.0+ (API 26+)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager

    // ── Approval channel ─────────────────────────────────────────────────
    // Used when Super Admin approves a wholesaler registration.
    NotificationChannel(
      "approval_channel",                          // must match backend channelId
      "Registration Approvals",                    // user-visible name
      NotificationManager.IMPORTANCE_HIGH          // heads-up notification + sound
    ).apply {
      description = "Notifications for wholesaler registration approval status updates"
      enableLights(true)
      enableVibration(true)
      setShowBadge(true)
    }.also { channel ->
      manager.createNotificationChannel(channel)
    }

    // ── General channel ──────────────────────────────────────────────────
    // Fallback channel for all other EzyEnquiry notifications.
    NotificationChannel(
      "default_channel",
      "General Notifications",
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "General EzyEnquiry notifications (orders, enquiries, etc.)"
      setShowBadge(true)
    }.also { channel ->
      manager.createNotificationChannel(channel)
    }
  }
}
