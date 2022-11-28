import play from 'play-dl'
export const initializeSoundCloud = (() => {
    play.getFreeClientID().then((clientID) => {
        play.setToken({
            soundcloud: {
                client_id: clientID
            }
        })
        console.log("Soundcloud ID:", clientID)
    })
})
