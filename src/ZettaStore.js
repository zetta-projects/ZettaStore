// @ts-check

const EventStore = require("orbit-db-eventstore")
const ZettaIndex = require("./ZettaIndex.js")

class ZettaStore extends EventStore {
    constructor(ipfs, id, dbname, options) {
        if (!options) options = {}
        if (!options.Index) Object.assign(options, { Index: ZettaIndex })
        super(ipfs, id, dbname, options)
        this._type = ZettaStore.type

        // @ts-ignore
        this._raw_query = super._query
        this._raw_add = super.add
    }

    add(data) {
        return this._raw_add(JSON.stringify(data))
    }

    /**
     * @param {string} hash 
     */
    remove(hash) {
        return this.del(hash)
    }

    /**
     * @param {string} hash 
     */
    del(hash) {
        const operation = {
            op: "DEL",
            key: null,
            value: hash
        }
        return this._addOperation(operation)
    }

    init() {
        const operation = {
            op: "INIT",
            key: null,
            value: {
                date: new Date().toISOString(),
                creator: this.identity.publicKey,
            }
        }
        return this._addOperation(operation)
    }

    /**
     * @param {string[]} admins 
     */
    setAdmins(admins) {
        admins = Array.isArray(admins) ? admins.concat() : []
        if (this._index) {
            // @ts-ignore
            this._index._administrators = admins
        }
    }

    /**
     * 判断数据库是否已经同步完全
     * @param {string} creator 数据库的创建者
     */
    isSynced(creator) {
        try {
            const entries = this.all.concat()
            const isInitedByCreator = entries.some((entry) => {
                return entry.payload.op == "INIT" && entry.key == creator
            })
            // @ts-ignore
            const loaded = this.replicationStatus.progress >= this.replicationStatus.max
            return isInitedByCreator && loaded
        } catch (err) {
            return false
        }
    }

    /**
     * 加载并同步数据库
     * @param {string} creator 数据库的创建者
     */
    async loadAndSync(creator) {
        await this.load()

        /** 当前用户公钥 */
        const key = this.identity.publicKey
        // 数据库由当前用户创建
        if (key == creator) {
            return
        }

        // 数据库已经同步完全
        if (this.isSynced(creator)) {
            return
        }

        // 等待数据库同步完全
        await new Promise((resolve) => {
            const listener = () => {
                if (this.isSynced(creator)) {
                    this.events.removeListener("replicated", listener)
                    resolve()
                }
            }
            this.events.on("replicated", listener)
        })

    }

    _query(opts) {
        if (!opts) opts = {}
        const result = this._raw_query(opts).concat()
        if (opts.reverse) {
            result.reverse()
        }
        return result.filter(entry => {
            return entry.payload.op !== "INIT"
        }).map(entry => {
            // deep copy
            entry = JSON.parse(JSON.stringify(entry))
            entry.payload.value = JSON.parse(entry.payload.value)
            return entry
        })
    }

    static get type() {
        return "zetta"
    }

}

module.exports = ZettaStore

