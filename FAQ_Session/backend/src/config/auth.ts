import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { admin } from 'better-auth/plugins/admin';

import mongoose from 'mongoose';

import { env } from './env';
import { sendEmail } from './mailer';
import { resetPasswordTemplate, emailVerificationTemplate } from './emailTemplates';

import { Roles } from '../core/constants/roles';
import { DatabaseError } from '../core/errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let authInstance: any;

const createAuth = () => {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    database: mongodbAdapter(mongoose.connection.db!),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
       minPasswordLength: 6,

      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { name?: string; email: string };
        url: string;
      }) => {
        await sendEmail({
          to: user.email,
          ...resetPasswordTemplate(user.name || 'there', url),
        });
      },
    },

    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: true,
      expiresIn: 86400,

      sendVerificationEmail: async ({
        user,
        url,
      }: {
        user: { name?: string; email: string };
        url: string;
      }) => {
        await sendEmail({
          to: user.email,
          ...emailVerificationTemplate(user.name || 'there', url),
        });
      },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        enabled: true,
      },
    },

    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: Roles.STUDENT,
          input: false,
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },

    plugins: [
      admin({
        defaultRole: Roles.STUDENT,
        adminRole: [Roles.ADMIN],
      }),
    ],

    trustedOrigins: [env.CORS_ORIGIN],
  });
};

export const getAuth = () => {
  if (!mongoose.connection.db) {
    throw new DatabaseError('MongoDB connection is not initialized');
  }

  if (!authInstance) {
    authInstance = createAuth();
  }

  return authInstance;
};