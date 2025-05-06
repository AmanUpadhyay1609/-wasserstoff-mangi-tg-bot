export type SessionData = {
  jwtToken?: string; // Add JWT token to session data
};

export const initial = (): SessionData => {
  return {
    jwtToken: undefined,
  };
};

//Manage your session data here and what you want your session look when it is created for a user you can add more variable here according to need
// YOU CAN ACCESS THIS SESSION DATA THROUGH REDIS AND ctx.session (telegram context)
  
