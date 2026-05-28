import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins';
import mongoose from 'mongoose';

import { env } from './env';
import { Roles } from '../core/constants/roles';
import { DatabaseError } from '../core/errors';
import { logger } from '../core/utils/logger';

let authInstance: any;

/**
 * Creates and configures the betterAuth instance with:
 * - Email & password authentication (local)
 * - Google OAuth provider
 * - Admin role plugin
 * - MongoDB adapter
 */
const createAuth = () => {
  logger.info('Initializing betterAuth with email/password and Google OAuth...');

  const config: any = {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    database: mongodbAdapter(mongoose.connection.db!),

    // ─── Local Authentication (Email & Password) ───────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      sendResetPasswordEmail: async (user: any, url: string) => {
        // TODO: Implement email sending (SendGrid, Resend, etc.)
        logger.info(`Password reset URL for ${user.email}: ${url}`);
      },
    },

    // ─── OAuth Providers ─────────────────────────────────────────────────
    socialProviders: {
      google: {
        enabled: true,
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    // ─── User Configuration ─────────────────────────────────────────────
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: Roles.STUDENT,
          input: false, // Prevent client from setting role directly
        },
        profileImageUrl: {
          type: 'string',
          defaultValue: null,
          input: false,
        },
        lastLoginAt: {
          type: 'date',
          defaultValue: new Date(),
          input: false,
        },
      },
    },

    // ─── Admin Plugin ────────────────────────────────────────────────────
    plugins: [
      admin({
        defaultRole: Roles.STUDENT,
        adminRole: [Roles.ADMIN],
      }),
    ],

    // ─── CORS & Security ────────────────────────────────────────────────
    trustedOrigins: [env.CORS_ORIGIN],

    // ─── Session Configuration ──────────────────────────────────────────
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAgeUnitInSeconds: 60 * 60 * 24, // Update age once per day
    },

    callbacks: {
      // Hook after successful sign-in (email or OAuth)
      async onSignInSuccess({ user }: any) {
        logger.info(`User signed in: ${user.email} [ID: ${user.id}]`);
        // Update lastLoginAt in database
        try {
          await mongoose.connection.db
            ?.collection('user')
            .updateOne(
              { id: user.id },
              { $set: { lastLoginAt: new Date() } },
            );
        } catch (error) {
          logger.warn('Failed to update lastLoginAt', error);
        }
      },

      // Hook after successful sign-up
      async onSignUpSuccess({ user }: any) {
        logger.info(`New user registered: ${user.email} [ID: ${user.id}]`);
      },

      // Hook after successful OAuth sign-in
      async onOAuthSuccess({ user, profile }: any) {
        logger.info(
          `OAuth sign-in successful: ${user.email} via ${profile.provider}`,
        );
        // Save OAuth profile image if available
        if (profile.image) {
          try {
            await mongoose.connection.db
              ?.collection('user')
              .updateOne(
                { id: user.id },
                { $set: { profileImageUrl: profile.image } },
              );
          } catch (error) {
            logger.warn('Failed to update profile image', error);
          }
        }
      },
    },
  };

  return betterAuth(config);
};

/**
 * Singleton getter for betterAuth instance.
 * Ensures database connection is established before initialization.
 */
export const getAuth = () => {
  if (!mongoose.connection.db) {
    throw new DatabaseError(
      'MongoDB connection is not initialized. Ensure connectDB() is called before getAuth().',
    );
  }

  if (!authInstance) {
    try {
      authInstance = createAuth();
      logger.info('betterAuth instance created successfully');
    } catch (error) {
      logger.error('Failed to initialize betterAuth', error);
      throw error;
    }
  }

  return authInstance;
};

/**
 * Reset the auth instance (useful for testing or reconnection scenarios).
 */
export const resetAuthInstance = () => {
  authInstance = null;
};
