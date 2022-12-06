import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'

const _userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.62'
let _accessToken = null
export class ChatGPT {
    constructor({ sessionToken, conversationId = null }) {
        this._sessionToken = sessionToken
        this._Authorization = null
        this._conversationId = conversationId
        this._parentId = uuidv4();
        this._csrfToken = null;
    }

    async send(accessToken, message, conversationId, parentId) {
        console.log("Access token: " + accessToken)
        let response;
        try {
            response = await axios.post('https://chat.openai.com/backend-api/conversation', {
                action: 'next',
                messages: [
                    {
                        id: uuidv4(),
                        role: 'user',
                        content: {
                            content_type: 'text',
                            parts: [message],
                        },
                    },
                ],
                model: 'text-davinci-002-render',
                conversation_id: conversationId || this._conversationId,
                parent_message_id: parentId || this._parentId,
            }, {
                headers: {
                    'authority': 'chat.openai.com',
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'origin': 'https://chat.openai.com',
                    'referer': 'https://chat.openai.com/chat',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': _userAgent,

                }
            })
        } catch(err) {
            if(err.message.endsWith('401')) {
                throw new Error('Session token has expired, please contact admin to replace it')
            }
            return Promise.reject(err)
        }
        let res = response.data.split('\n');
        res = JSON.parse(res[res.length - 5].split('data: ')[1]);
        console.log(res);
        return { id: res.message.id, message: res.message.content.parts[0], conversationId: res.conversation_id }
    }

    async refreshAccessToken() {
        let res = await fetch('https://chat.openai.com/api/auth/session', {
            headers: {
                cookie: `__Secure-next-auth.session-token=${this._sessionToken}`,
                'user-agent': _userAgent
            }
        }).catch(err => Promise.reject(err))
        this._sessionToken = res.headers.get('set-cookie').split(';')[8].split('__Secure-next-auth.session-token=')[1];
        if (res.status !== 200) return Promise.reject('Invalid session token')
        res = await res.json()
        if (res.accessToken) return res.accessToken
        return Promise.reject('ChatGPT Server are down')
    }

    async login(email, password) {
        let login = await axios.get('https://chat.openai.com/auth/login', {
            headers: {
                'user-agent': _userAgent,
            }
        })
        if (login.status !== 200) return Promise.reject('Failed to login')
        let csrf = await axios.get("https://chat.openai.com/api/auth/csrf", {
            headers: {
                'user-agent': _userAgent,
            }
        })
        if (csrf.status !== 200) return Promise.reject('Failed to get CSRF token')
        csrf = csrf.data.csrfToken
        console.log(csrf)
        this._csrfToken = csrf;
        login = await axios.post('https://chat.openai.com/api/auth/signin/auth0?prompt=login', {
            callbackUrl: '/',
            csrfToken: csrf,
            json: true,
        }, {
            headers: {
                'user-agent': _userAgent,
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json, text/plain, */*',
                'referer': 'https://chat.openai.com/auth/login',
                'origin': 'https://chat.openai.com',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
            }
        })
        if (login.status !== 200) return Promise.reject('Failed to login')
        console.log(login.data.url)
        login = await axios.get(login.data.url, {
            headers: {
                'user-agent': _userAgent,
                'Referer': 'https://chat.openai.com/',
            }
        })
        console.log(login.status)
        if (login.status !== 200) return Promise.reject('Failed to login')
        // console.log(login)
    }

    async start() {
        _accessToken = await this.refreshAccessToken()
        setInterval(async () => {
            _accessToken = await this.refreshAccessToken()
        }, 1000 * 60) //refresh access token every 1 minute
    }
}