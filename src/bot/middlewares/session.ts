export type SessionData = {
  jwtToken?: string; // Add JWT token to session data
  custom?:{}
};

export const initial = (): SessionData => {
  return {
    jwtToken: undefined,
    custom : {},
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
  };
  ctx.session.getCustom = function(key: string) {
    return this.custom[key];
  };
  ctx.session.updateCustom = function(updates: Record<string, any>) {
    this.custom = { ...this.custom, ...updates };
  };
  ctx.session.deleteCustom = function(key: string) {
    delete this.custom[key];
  };

  if (typeof ctx.session.save !== 'function') {
    ctx.session.save = function(callback: (err?: any) => void) {
      const storage = ctx.__storageAdapter;
      const sessionKey = ctx.__sessionKey;
      if (storage && typeof storage.write === 'function' && sessionKey) {
        storage.write(sessionKey, ctx.session)
          .then(() => {
            console.log('Session successfully saved to Redis via adapter');
            callback();
          })
          .catch((err: any) => {
            console.error('Error saving session via adapter:', err);
            callback(err);
          });
      } else {
        // Fallback: just log
        console.log('Session auto-save triggered (no Redis available):', ctx.session);
        callback();
      }
    };
  }
  
  await next();
  
  console.log('Session custom data after processing:', ctx.session.custom);
}
  
