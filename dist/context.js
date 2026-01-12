import { AsyncLocalStorage } from "node:async_hooks";
const storage = new AsyncLocalStorage();
export function runWithContext(ctx, fn) {
    return storage.run(ctx, fn);
}
export function getContext() {
    return storage.getStore();
}
