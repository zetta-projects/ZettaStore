// Type definitions for ZettaStore
// Project: https://github.com/zetta-projects/ZettaStore/

import { Store } from "orbit-db-store"

interface Entry {
    cid: string;
    key: string;
    payload: {
        op: string;
        key?: string | null;
        value: Object;
    };
    [x: string]: any;
}

export interface EntryIterator<T extends Entry> extends IterableIterator<T> {
    [Symbol.iterator](): EntryIterator<T>,
    collect(): T[]
}

export declare class ZettaStore<T extends Entry> extends Store {
    add(data: any): Promise<string>;
    get(hash: string): T;

    remove(hash: string): Promise<string>;

    init(): Promise<string>;

    setAdmins(admins: string[]): void;

    isSynced(creator: string): boolean;
    loadAndSync(creator: string): Promise<void>;

    iterator(options?: {
        gt?: string,
        gte?: string,
        lt?: string,
        lte?: string,
        limit?: number,
        reverse?: boolean
    }): EntryIterator<T>;
}

export default ZettaStore
