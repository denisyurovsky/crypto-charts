const API_KEY='71f82462b170f0904dcc21a95e50af524f680b4d438e99a3888fee58e37f5376'

const tickersHandlers = new Map();
const websocket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)

const aggrIndex = "5";

websocket.addEventListener('message', e => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: price} = JSON.parse(e.data)
    if (type !== aggrIndex) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(price))
})


function sendToWs(message) {
    const stringMessage = JSON.stringify(message)
    if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(stringMessage)
    }

    websocket.addEventListener('open', () => {
        websocket.send(stringMessage)
    }, {once: true})
}

export const subscribeToTickers = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb])
    sendToWs({
            "action": "SubAdd",
            subs: [`5~CCCAGG~${ticker}~USD`]
        }
    )
}

export const unsubscribeTicker = (ticker) => {
    tickersHandlers.delete(ticker)
    sendToWs({
        "action": "SubRemove",
        "subs": [`5~CCCAGG~${ticker}~USD`]
    })
}

