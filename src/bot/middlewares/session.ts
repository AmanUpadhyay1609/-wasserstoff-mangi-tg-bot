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
  ctx.session.updateCustom = function(updates: any) {
    this.custom = { ...this.custom, ...updates };
  };
  
  if (typeof ctx.session.save !== 'function') {
    ctx.session.save = function(callback: (err?: any) => void) {
      if (ctx.redis && typeof ctx.redis.set === 'function' && ctx.session.sessionKey) {
        ctx.redis.set(ctx.session.sessionKey, JSON.stringify(ctx.session), (err: any) => {
          if (err) {
            console.error('Error saving session to Redis:', err);
          } else {
            console.log('Session successfully saved to Redis.');
          }
          callback(err);
        });
      } else {
        console.log('Session auto-save triggered:', ctx.session);
        callback();
      }
    };
  }
  
  await next();
  
  console.log('Session custom data after processing:', ctx.session.custom);
}
  
