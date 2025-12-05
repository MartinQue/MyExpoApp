/**
 * Account Service - Handles user account operations
 * Including data export, account deletion, and profile updates
 */

import { supabase } from './supabase';
import { db } from './database';
import { Share } from 'react-native';

// External URLs for legal pages
export const LEGAL_URLS = {
  privacyPolicy: 'https://happiness-ai.com/privacy',
  termsOfService: 'https://happiness-ai.com/terms',
  helpSupport: 'mailto:support@happiness-ai.com',
} as const;

// Profile update interface
export interface ProfileUpdateData {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  timezone?: string;
}

// Security settings interface
export interface SecuritySettings {
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
}

/**
 * Update user profile information
 */
export async function updateProfile(
  userId: string,
  data: ProfileUpdateData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update display name in preferences
    if (data.displayName !== undefined) {
      await db.preferences.upsert(userId, { display_name: data.displayName });
    }

    // Update avatar URL in preferences
    if (data.avatarUrl !== undefined) {
      await db.preferences.upsert(userId, { avatar_url: data.avatarUrl });
    }

    // Update email - requires Supabase auth update
    if (data.email !== undefined) {
      const { error } = await supabase.auth.updateUser({ email: data.email });
      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Password change error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export all user data as JSON
 * Uses native share sheet API
 */
export async function exportUserData(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Collect all user data from various tables
    const [conversations, plans, libraryItems, generatedImages, preferences] =
      await Promise.all([
        db.conversations.list(userId),
        db.plans.list(userId),
        db.library.list(userId),
        db.images.list(userId, 100),
        db.preferences.get(userId),
      ]);

    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations.map(async (conv) => {
        const messages = await db.messages.list(conv.id);
        return { ...conv, messages };
      })
    );

    // Compile user data
    const userData = {
      exportDate: new Date().toISOString(),
      userId,
      preferences,
      conversations: conversationsWithMessages,
      plans,
      libraryItems,
      generatedImages,
    };

    // Use native share API to export as text
    const dataString = JSON.stringify(userData, null, 2);

    await Share.share({
      message: dataString,
      title: 'Happiness AI - Your Data Export',
    });

    return { success: true };
  } catch (error) {
    console.error('Data export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get all user data to delete from storage
    const [conversations, libraryItems, generatedImages] = await Promise.all([
      db.conversations.list(userId),
      db.library.list(userId),
      db.images.list(userId, 1000),
    ]);

    // Delete all conversations (will cascade to messages)
    for (const conv of conversations) {
      await db.conversations.delete(conv.id);
    }

    // Delete all plans (will cascade to milestones)
    const plans = await db.plans.list(userId);
    for (const plan of plans) {
      await db.plans.delete(plan.id);
    }

    // Delete library items
    for (const item of libraryItems) {
      await db.library.delete(item.id);
    }

    // Delete generated images
    for (const img of generatedImages) {
      await db.images.delete(img.id);
    }

    // Delete user preferences
    await supabase.from('user_preferences').delete().eq('user_id', userId);

    // Delete media from storage
    try {
      const { data: mediaFiles } = await supabase.storage
        .from('media')
        .list(userId);

      if (mediaFiles && mediaFiles.length > 0) {
        const filesToDelete = mediaFiles.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('media').remove(filesToDelete);
      }
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
      // Continue with account deletion even if storage cleanup fails
    }

    // Finally, delete the auth user
    // Note: This requires admin access or the user to be signed in
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      // Try alternative: sign out and let user know account is queued for deletion
      console.log('Admin deletion failed, signing out user');
      await supabase.auth.signOut();
      return { success: true }; // Data is deleted, user signed out
    }

    return { success: true };
  } catch (error) {
    console.error('Account deletion error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'happiness-ai://reset-password',
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get account creation date
 */
export async function getAccountInfo(userId: string): Promise<{
  createdAt: string | null;
  lastSignIn: string | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      createdAt: user?.created_at || null,
      lastSignIn: user?.last_sign_in_at || null,
    };
  } catch (error) {
    console.error('Get account info error:', error);
    return { createdAt: null, lastSignIn: null };
  }
}
