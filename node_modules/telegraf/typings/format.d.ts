import { User } from '@telegraf/types';
import { FmtString } from './core/helpers/formatting';
export { FmtString };
type Nestable<Kind extends string> = string | number | boolean | FmtString<Kind>;
type Nesting<Kind extends string> = [
    parts: Nestable<Kind> | readonly Nestable<Kind>[],
    ...items: Nestable<Kind>[]
];
type Nests<Is extends string, Kind extends string> = (...args: Nesting<Kind>) => FmtString<Is>;
export declare const join: Nests<"fmt", string>;
export declare const fmt: Nests<"fmt", string>;
export declare const bold: Nests<"bold", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "fmt">;
export declare const italic: Nests<"italic", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "fmt">;
export declare const spoiler: Nests<"spoiler", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "fmt">;
export declare const strikethrough: Nests<"strikethrough", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "fmt">;
export declare const underline: Nests<"underline", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "fmt">;
export declare const quote: Nests<"blockquote", "bold" | "italic" | "underline" | "strikethrough" | "spoiler" | "code" | "fmt">;
export declare const code: Nests<"code", never>;
export declare const pre: (language: string) => Nests<"pre", never>;
export declare const link: (content: Nestable<'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code'>, url: string) => FmtString<"text_link">;
export declare const mention: (name: Nestable<'fmt' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'spoiler' | 'code'>, user: number | User) => FmtString<"text_link"> | FmtString<"text_mention">;
//# sourceMappingURL=format.d.ts.map