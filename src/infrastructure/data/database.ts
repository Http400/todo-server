import { Mongoose, Document, Schema } from 'mongoose';

export class Database {
    private readonly dbInstance: Mongoose;

    constructor(uri: string) {
        this.dbInstance = new Mongoose();

        this.dbInstance.connect(uri, { useNewUrlParser: true })
            .then(() => {
                console.log('Connection with DB initialized.');
            }).catch((error: any) => console.log(error));
    }

    setModel<T extends Document>(name: string, schema: Schema) {
        return this.dbInstance.model<T>(name, schema);
    }

    disconnect(): Promise<void> {
        return this.dbInstance.disconnect();
    }
}