import { MongoClient } from "mongodb"

export default class MongoDBClient {
    constructor(opt) {
        this.config = opt.config
        this.client = new MongoClient(opt.config.mongodb.url)

        this.db = null;
    }

    async loginClient() {
        await this.client.connect()
        this.db = this.client.db(this.config.mongodb.db)

    }

    findDocuments(collectionName, filter) {
        const collection = this.db.collection(collectionName)

        return collection.find(filter).toArray()
    }

    insertDocuments(collectionName, documents) {
        const collection = this.db.collection(collectionName)

        return collection.insertMany(documents)
    }

    updateDocument(collectionName, filter, update) {
        const collection = this.db.collection(collectionName)

        return collection.updateOne(filter, update)
    }

    removeDocuments(collectionName, filter) {
        const collection = this.db.collection(collectionName)

        return collection.deleteMany(filter)
    }
}