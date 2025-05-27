import { Api, Context, SessionFlavor } from "grammy";
import { Update, UserFromGetMe, Chat, User } from "@grammyjs/types";
import { SessionData } from "../middlewares/session";
import { Logger } from "../../logger";
type ExtendedContextFlavor = {
  logger: Logger;
};

export type CustomContext = Omit<Context, 'chat' | 'from' | 'session'> & {
  chat: Chat;
  from: User;
  session: SessionData & {
    save?: (callback: (err?: any) => void) => void;
    setCustom: (key: string, value: any) => void;
    getCustom: (key: string) => any;
    updateCustom: (updates: Record<string, any>) => void;
    deleteCustom: (key: string) => void;
  };
  __sessionKey?: string;
  config?: any;
} & ExtendedContextFlavor;

export const createContextConstructor = ({ logger }: { logger: Logger }) => {
  return class extends Context implements ExtendedContextFlavor {
    public logger = logger;

    constructor(update: Update, api: Api, me: UserFromGetMe) {
      super(update, api, me);

      this.logger = logger.child({
        update_id: this.update.update_id,
      });
    }
  } as unknown as new (
    update: Update,
    api: Api,
    me: UserFromGetMe
  ) => CustomContext;
};