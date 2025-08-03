import { Deunionize } from './core/helpers/deunionize';
import * as tg from './core/types/typegram';
export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export declare const Digit: Set<string>;
export type Reaction = tg.TelegramEmoji | `${Digit}${string}` | Deunionize<tg.ReactionType>;
type ReactionCtx = {
    update: Partial<tg.Update.MessageReactionUpdate>;
};
export declare class ReactionList {
    protected list: tg.ReactionType[];
    [index: number]: Deunionize<tg.ReactionType>;
    protected constructor(list: tg.ReactionType[]);
    static fromArray(list?: tg.ReactionType[]): ReactionList;
    static has(reactions: tg.ReactionType[], reaction: Reaction): boolean;
    toArray(): tg.ReactionType[];
    filter(filterFn: (value: tg.ReactionType, index: number) => boolean): ReactionList;
    has(reaction: Reaction): boolean;
    get count(): number;
    [Symbol.iterator](): IterableIterator<tg.ReactionType>;
}
export declare class MessageReactions extends ReactionList {
    ctx: ReactionCtx;
    private constructor();
    static from(ctx: ReactionCtx): MessageReactions;
    get old(): ReactionList;
    get new(): ReactionList;
    get added(): ReactionList;
    get removed(): ReactionList;
    get kept(): ReactionList;
}
export {};
//# sourceMappingURL=reactions.d.ts.map