#import "AppDelegate.h"
// @generated begin react-native-maps-import - expo prebuild (DO NOT MODIFY) sync-f2f83125c99c0d74b42a2612947510c4e08c423a
#if __has_include(<GoogleMaps/GoogleMaps.h>)
#import <GoogleMaps/GoogleMaps.h>
#endif
// @generated end react-native-maps-import

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <Firebase.h>
#import <FirebaseMessaging/FirebaseMessaging.h> 
#import <UserNotifications/UserNotifications.h> 


@interface AppDelegate () <UNUserNotificationCenterDelegate>
@end

@implementation AppDelegate



- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // @generated begin react-native-maps-init - expo prebuild (DO NOT MODIFY) sync-2799b5b2e858c5fd23bf1d956b8980f3c6f6c8a3
  #if __has_include(<GoogleMaps/GoogleMaps.h>)
    [GMSServices provideAPIKey:@"AIzaSyBqrNqrA8NEOhdflFJ334PsAMUHSatgkwk"];
  #endif
  // @generated end react-native-maps-init

  // Inicializar Firebase
  [FIRApp configure];
UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
center.delegate = self;

  // Registrar para notificaciones remotas (APNs)
  [application registerForRemoteNotifications];

  self.moduleName = @"main";
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [super application:application openURL:url options:options] || [RCTLinkingManager application:application openURL:url options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// 🔔 Notificación: registro exitoso de APNs
- (void)application:(UIApplication *)application
    didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  NSLog(@"📱 didRegisterForRemoteNotificationsWithDeviceToken llamado");
  [FIRMessaging messaging].APNSToken = deviceToken;
}

// ❌ Notificación: error al registrar APNs
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  NSLog(@"❌ Error al registrar APNs: %@", error);
}

// 🔄 Recepción de notificaciones remotas en segundo plano
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

// 📬 Mostrar notificaciones incluso si la app está abierta (foreground)
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  completionHandler(UNNotificationPresentationOptionAlert | UNNotificationPresentationOptionSound);
}

// 📲 Manejar cuando el usuario toca la notificación
- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void(^)(void))completionHandler
{
  completionHandler();
}


@end
