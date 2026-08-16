import { OneSignal } from '@onesignal/capacitor-plugin';
import { supabase } from '@/lib/supabase';

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export async function initializePushNotifications(userId: string) {
  try {
    // 1. Initialize OneSignal
    await OneSignal.initialize(ONESIGNAL_APP_ID);

    // 2. Request permission (prompts native dialog)
    const permission = await OneSignal.Notifications.requestPermission(true);
    if (!permission) {
      console.warn('Push permission denied');
      return;
    }

    // 3. Get OneSignal player ID
    const playerId = await OneSignal.User.getOnesignalId();
    if (!playerId) {
      console.warn('No OneSignal player ID');
      return;
    }

    // 4. Store player ID in database (upsert)
    await supabase.from('user_push_subscriptions').upsert({
      user_id: userId,
      onesignal_player_id: playerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, onesignal_player_id' });

    // 5. Link external user ID for OneSignal (optional)
    await OneSignal.User.setExternalUserId(userId);

    console.log('Push notifications initialised for user', userId);
  } catch (err) {
    console.error('Push init error:', err);
  }
}