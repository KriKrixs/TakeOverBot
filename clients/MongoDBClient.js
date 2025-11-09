/* Modules */
import { MongoClient } from "mongodb"

/**
 * MongoDBClient class
 */
export default class MongoDBClient {

    /**
     * MongoDBClient's constructor
     * @param opt this of PlotBot object
     */
    constructor(opt) {
        this.loggers = opt.loggers

        // Creating the client
        this.client = new MongoClient(process.env.MONGODB_URL)
        this.db     = null;
    }

    /**
     * Log the mongo client in and select the database
     * @returns {Promise<void>} Don't care
     */
    async loginClient() {
        try {
            this.loggers.logger.log("INFO", this.constructor.name, "Attempting mongodb login")

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Mongodb login timed out')), process.env.MONGODB_LOGIN_TIMEOUT)
            );

            const loginPromise = this.client.connect()

            await Promise.race([loginPromise, timeoutPromise]);

            this.loggers.logger.log("INFO", this.constructor.name, "Mongodb successfully logged in")

            this.db = this.client.db(process.env.MONGODB_DB)
        } catch (e) {
            this.loggers.logger.log("CRITICAL", this.constructor.name, "Can't login to mongodb - " + e.message, e, true)
        }
    }

    /**
     * Find documents
     * @param collectionName    Collection name to search in
     * @param filter            Filter
     * @returns {*}             Array of documents or false if an error occurred
     */
    findDocuments(collectionName, filter) {
        try {
            const collection = this.db.collection(collectionName)

            return collection.find(filter).toArray()
        } catch (e) {
            this.loggers.logger.log("WARNING", this.constructor.name, "Can't find documents - " + e.message, e)

            return false
        }
    }

    /**
     * Insert documents
     * @param collectionName    Collection name to insert in
     * @param documents         Array of documents
     * @returns {*}             The documents inserted or false if an error occurred
     */
    insertDocuments(collectionName, documents) {
        try {
            const collection = this.db.collection(collectionName)

            return collection.insertMany(documents)
        } catch (e) {
            this.loggers.logger.log("WARNING", this.constructor.name, "Can't insert documents - " + e.message, e)

            return false
        }
    }

    /**
     * Update a document
     * @param collectionName    Collection name to update a document in
     * @param filter            Filter
     * @param update            What to update in the document
     * @returns {*}             The updated document or false if an error occurred
     */
    updateDocument(collectionName, filter, update) {
        try {
            const collection = this.db.collection(collectionName)

            return collection.updateOne(filter, update)
        } catch (e) {
            this.loggers.logger.log("WARNING", this.constructor.name, "Can't update a document - " + e.message, e)

            return false
        }
    }

    /**
     * Remove documents
     * @param collectionName    Collection name to remove a document
     * @param filter            Filter
     * @returns {*}             The removed document or false if an error occurred
     */
    removeDocuments(collectionName, filter) {
        try {
            const collection = this.db.collection(collectionName)

            return collection.deleteMany(filter)
        } catch (e) {
            this.loggers.logger.log("WARNING", this.constructor.name, "Can't remove documents - " + e.message, e)

            return false
        }
    }

    /**
     * Create index
     * @param collectionName    Collection name to create an index
     * @param indexName         Index name to create
     * @returns {*}             The created index or false if an error occurred
     */
    createIndex(collectionName, indexName) {
        try {
            const collection = this.db.collection(collectionName)

            const index = {}
            index[indexName] = 1

            return collection.createIndex(index)
        } catch (e) {
            this.loggers.logger.log("WARNING", this.constructor.name, "Can't create index - " + e.message, e)

            return false
        }
    }
}