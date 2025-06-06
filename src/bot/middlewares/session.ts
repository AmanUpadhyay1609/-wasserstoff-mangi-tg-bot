export type SessionData = {
  jwtToken?: string; // Add JWT token to session data
  custom?: {};
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

export default async function sessionMiddleware(
  ctx: any,
  next: () => Promise<void>
) {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.custom) {
    ctx.session.custom = {};
  }

  // CRUD helpers for session.custom
  ctx.session.setCustom = function (key: string, value: any) {
    if (!this.custom) this.custom = {};

    const keys = key.split(".");
    let current = this.custom;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];

      if (!current[k] || typeof current[k] !== "object") {
        // Overwrite if path doesn't exist or is not an object
        current[k] = {};
      }

      current = current[k];
    }

    current[keys[keys.length - 1]] = value;

    if (typeof this.save === "function") {
      this.save(() => {});
    }

    return true;
  };

  ctx.session.getCustom = function (key: string) {
    if (!this.custom) return undefined;

    const keys = key.split(".");
    let current = this.custom;

    for (let i = 0; i < keys.length; i++) {
      if (!current || typeof current !== "object") return undefined;
      current = current[keys[i]];
    }

    return current;
  };

  ctx.session.updateCustom = function (updates: Record<string, any>) {
    if (!this.custom) return false;
    if (typeof updates !== "object" || updates === null) return false;

    for (const [fullKey, value] of Object.entries(updates)) {
      const keys = fullKey.split(".");
      let current = this.custom;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];

        if (
          !(k in current) ||
          typeof current[k] !== "object" ||
          current[k] === null
        ) {
          return false; // Intermediate path is missing or invalid
        }

        current = current[k];
      }

      const finalKey = keys[keys.length - 1];
      if (!(finalKey in current)) {
        return false; // Final key does not exist
      }

      current[finalKey] = value;
    }

    if (typeof this.save === "function") {
      this.save(() => {});
    }

    return true;
  };

  ctx.session.deleteCustom = function (key: string) {
    if (!this.custom) return false;

    const keys = key.split(".");
    let current = this.custom;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
        return false;
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (!(lastKey in current)) return false;

    delete current[lastKey];

    if (typeof this.save === "function") {
      this.save(() => {});
    }

    return true;
  };

  if (typeof ctx.session.save !== "function") {
    ctx.session.save = function (callback: (err?: any) => void) {
      const storage = ctx.__storageAdapter;
      const sessionKey = ctx.__sessionKey;
      if (storage && typeof storage.write === "function" && sessionKey) {
        storage
          .write(sessionKey, ctx.session)
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

export const requireSessionAndChat: Middleware<CustomContext> = async (
  ctx,
  next
) => {
  if (!ctx.session) throw new Error("Session is not initialized!");
  if (!ctx.chat) throw new Error("Chat is not available!");
  if (!ctx.from) throw new Error("From is not available!");
  await next();
};
