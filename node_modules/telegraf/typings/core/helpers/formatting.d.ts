import { MessageEntity, User } from '@telegraf/types';
import { Any } from './util';
export type Nestable<Kind extends string> = string | number | boolean | FmtString<Kind>;
export type MaybeNestableList<Kind extends string> = Nestable<Kind> | readonly Nestable<Kind>[];
export interface FmtString<Brand extends string> {
    text: string;
    entities?: MessageEntity[];
    parse_mode?: undefined;
    __to_nest: Brand;
}
export declare class FmtString<Brand extends string = string> implements FmtString<Brand> {
    text: string;
    constructor(text: string, entities?: MessageEntity[]);
    static normalise(content: Nestable<string>): FmtString<string>;
}
/**
 * Given an `Iterable<FmtString | string | Any>` and a separator, flattens the list into a single FmtString.
 * Analogous to Array#join -> string, but for FmtString
 */
export declare const join: (fragments: Iterable<FmtString | string | Any>, separator?: string | FmtString) => FmtString<string>;
/** Internal constructor for all fmt helpers */
export declare function createFmt(kind?: MessageEntity['type'], opts?: object): (parts: MaybeNestableList<string>, ...items: Nestable<string>[]) => FmtString<string>;
export declare const linkOrMention: (content: Nestable<string>, data: {
    type: 'text_link';
    url: string;
} | {
    type: 'text_mention';
    user: User;
}) => FmtString<string>;
//# sourceMappingURL=formatting.d.ts.map