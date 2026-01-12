import { AsyncLocalStorage } from "node:async_hooks";

export type MedusaAuthOverride =
  | { type: "basic" | "bearer"; token: string }
  | { authorizationHeader: string };

export type RequestContext = {
  medusaAuthOverride?: MedusaAuthOverride;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}
