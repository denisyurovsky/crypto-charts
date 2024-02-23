const API_KEY='71f82462b170f0904dcc21a95e50af524f680b4d438e99a3888fee58e37f5376'

const tickersHandlers = new Map();
export const loadTicker =  async () => {
    if (tickersHandlers.size === 0) {
        return;
    }
    const f = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[...tickersHandlers.keys()].join(',')}&tsyms=USD&api_key=${API_KEY}`)
    const res =  await f.json()
    const updatedPrices =  Object.fromEntries(Object.entries(res).map(([key, value]) => [key, value.USD]))

    Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
        const handlers = tickersHandlers.get(currency) ?? [];
        handlers.forEach(fn => fn(newPrice))
    })
}

export const subscribeToTickers = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb])
}

export const unsubscribeTicker = (ticker) => {
    // const subscribers = tickersHandlers.get(ticker) || [];
    // tickersHandlers.set(ticker, subscribers.filter(fn => fn !== cb))
    tickersHandlers.delete(ticker)
}

setInterval(loadTicker, 5000)
