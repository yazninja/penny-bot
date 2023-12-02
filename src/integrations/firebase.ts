import consola from 'consola';
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/** INITIALIZE FIREBASE */
const app = initializeApp({ credential: cert(serviceAccount as ServiceAccount), databaseURL: 'https://cider-collective-default-rtdb.europe-west1.firebasedatabase.app/' });
//I am **very** aware this is hardcoded -q
const webApiKey = 'AIzaSyCYhHEBH-bkXBADELuwQX4NsoqaH7460pA';
const firestore = getFirestore(app);
const database = getDatabase(app);
consola.success('\x1b[32m%s\x1b[0m', '[firebase]', 'Connected');

export const firebase = {
    async setConversation(discordId: string, conversationId: string, lastMessageId: string) {
        try {
            let analytics = firestore.doc(`cider-bot/users/conversations/${discordId}`);
            analytics.set({ conversationId, lastMessageId });
        } catch (e) {
            consola.error(e);
        }
    },
    async getConversation(discordId: string) {
        try {
            let analytics = firestore.doc(`cider-bot/users/conversations/${discordId}`);
            let data = await analytics.get();
            return data.data();
        } catch (e) {
            consola.error(e);
        }
    },
    async resetConversation(discordId: string) {
        try {
            let analytics = firestore.doc(`cider-bot/users/conversations/${discordId}`);
            analytics.delete();
        } catch (e) {
            consola.error(e);
        }
    }
};
