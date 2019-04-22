// @ts-check

class ZettaIndex {

    /**
     * @param {string} publicKey 当前用户公钥
     */
    constructor(publicKey) {
        this._index = {}

        /** 当前用户公钥 */
        this._key = publicKey

        /** @type {string[]} */
        this._administrators = []
    }

    get() {
        return Object.keys(this._index).map((f) => this._index[f])
    }

    /**
     * @param {string} hash 
     */
    canDelete(hash) {
        const admins = this._administrators.concat()
        return admins.includes("*")  // 任何人都是管理员
            || admins.includes(this._key)  // 当前用户是管理员
            || (this._index[hash] && this._index[hash].key == this._key)  // 删除自己发布的内容
    }

    updateIndex(oplog) {
        this._index = {}
        oplog.values.reduce((handled, item) => {
            if (!handled.includes(item.hash)) {
                handled.push(item.hash)
                if (item.payload.op === 'ADD' || item.payload.op === 'INIT') {
                    this._index[item.hash] = item
                } else if (item.payload.op === 'DEL' && this.canDelete(item.payload.value)) {
                    delete this._index[item.payload.value]
                }
            }
            return handled
        }, [])
    }

    /**
     * @param {string[]} admins 
     */
    setAdmins(admins) {
        this._administrators = admins.concat()
    }

}

module.exports = ZettaIndex
