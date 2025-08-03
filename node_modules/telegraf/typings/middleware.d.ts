import { Context } from './context';
import { Update } from './core/types/typegram';
export type MiddlewareFn<C extends Context<U>, U extends Update = Update> = (ctx: C, next: () => Promise<void>) => Promise<unknown> | void;
export interface MiddlewareObj<C extends Context<U>, U extends Update = Update> {
    middleware: () => MiddlewareFn<C, U>;
}
export type Middleware<C extends Context<U>, U extends Update = Update> = MiddlewareFn<C, U> | MiddlewareObj<C, U>;
//# sourceMappingURL=middleware.d.ts.map