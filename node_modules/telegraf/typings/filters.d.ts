import type { CallbackQuery, CommonMessageBundle, Message, Update } from '@telegraf/types';
import { DistinctKeys, KeyedDistinct, Guarded } from './core/helpers/util';
export type Filter<U extends Update> = (update: Update) => update is U;
export { Guarded };
export type AllGuarded<Fs extends Filter<Update>[]> = Fs extends [
    infer A,
    ...infer B
] ? B extends [] ? Guarded<A> : B extends Filter<Update>[] ? Guarded<A> & AllGuarded<B> : never : never;
export declare const message: <Ks extends DistinctKeys<Message>[]>(...keys: Ks) => (update: Update) => update is Update.MessageUpdate<KeyedDistinct<Message, Ks[number]>>;
export declare const editedMessage: <Ks extends DistinctKeys<CommonMessageBundle>[]>(...keys: Ks) => (update: Update) => update is Update.EditedMessageUpdate<KeyedDistinct<CommonMessageBundle, Ks[number]>>;
export declare const channelPost: <Ks extends DistinctKeys<Message>[]>(...keys: Ks) => (update: Update) => update is Update.ChannelPostUpdate<KeyedDistinct<Message, Ks[number]>>;
export declare const editedChannelPost: <Ks extends DistinctKeys<CommonMessageBundle>[]>(...keys: Ks) => (update: Update) => update is Update.EditedChannelPostUpdate<KeyedDistinct<CommonMessageBundle, Ks[number]>>;
export declare const callbackQuery: <Ks extends DistinctKeys<CallbackQuery>[]>(...keys: Ks) => (update: Update) => update is Update.CallbackQueryUpdate<KeyedDistinct<CallbackQuery, Ks[number]>>;
/** Any of the provided filters must match */
export declare const anyOf: <Us extends Update[]>(...filters: { [UIdx in keyof Us]: Filter<Us[UIdx]>; }) => (update: Update) => update is Us[number];
/** All of the provided filters must match */
export declare const allOf: <U extends Update, Fs extends Filter<U>[]>(...filters: Fs) => (update: Update) => update is AllGuarded<Fs>;
//# sourceMappingURL=filters.d.ts.map