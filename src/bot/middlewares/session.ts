export type SessionData = {
  jwtToken?: string; // Add JWT token to session data
  custom?:{}
};

export const initial = (): SessionData & {
  setCustom: (key: string, value: any) => void;
  getCustom: (key: string) => any;
  updateCustom: (updates: Record<string, any>) => void;
  deleteCustom: (key: string) => void;
} => {
  return {
    jwtToken: undefined,
    custom: {},
    setCustom: () => {},
    getCustom: () => undefined,
    updateCustom: () => {},
    deleteCustom: () => {},
  };
};

//Manage your session data here and what you want your session look when it is created for a user you can add more variable here according to need
// YOU CAN ACCESS THIS SESSION DATA THROUGH REDIS AND ctx.session (telegram context)

export default async function sessionMiddleware(ctx: any, next: () => Promise<void>) {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.custom) {
    ctx.session.custom = {};
  }

  // CRUD helpers for session.custom
  ctx.session.setCustom = function(key: string, value: any) {
    this.custom[key] = value;
    if (typeof this.save === 'function') {
      this.save(() => {});
    }
  };
  ctx.session.getCustom = function(key: string) {
    return this.custom[key];
  };
  ctx.session.updateCustom = function(updates: Record<string, any>) {
    this.custom = { ...this.custom, ...updates };
    if (typeof this.save === 'function') {
      this.save(() => {});
    }
  };
  ctx.session.deleteCustom = function(key: string) {
    delete this.custom[key];
    if (typeof this.save === 'function') {
      this.save(() => {});
    }
  };

  if (typeof ctx.session.save !== 'function') {
    ctx.session.save = function(callback: (err?: any) => void) {
      const storage = ctx.__storageAdapter;
      const sessionKey = ctx.__sessionKey;
      if (storage && typeof storage.write === 'function' && sessionKey) {
        storage.write(sessionKey, ctx.session)
          .then(() => {
            callback();
          })
          .catch((err: any) => {
            callback(err);
          });
      } else {
        // Fallback: just log
        callback();
      }
    };
  }
  
  await next();
}

// Helper middleware to ensure ctx.session, ctx.chat, and ctx.from are always present
import { Middleware } from "grammy";
import { CustomContext } from "../context/CustomContext";

export const requireSessionAndChat: Middleware<CustomContext> = async (ctx, next) => {
  if (!ctx.session) throw new Error("Session is not initialized!");
  if (!ctx.chat) throw new Error("Chat is not available!");
  if (!ctx.from) throw new Error("From is not available!");
  await next();
};
  
