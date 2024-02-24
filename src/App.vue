<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import {subscribeToTickers, unsubscribeTicker} from "./api.js";
import AddTicker from "./components/add-ticker.vue";
import CoinGraph from "./components/coin-graph.vue";
import CoinTicker from "./components/coin-ticker.vue";
const selectedTicker = ref(null);
const tickers = ref([]);
const graph = ref([]);
const filterSearch = ref('');
const page = ref(1);
const graphRef = ref()
const maxGraphElems = ref(1);
const error = ref();
function add(name) {
  if (!name) return;
  const newTicker = {
      id: Math.random(),
      title: name,
      price: null
}

  if (tickers.value.find(elem => elem.title === newTicker.title)) {
    error.value = true;
    return;
  }

  tickers.value.push(newTicker);
  localStorage.setItem('crypto-list', JSON.stringify(tickers.value))

  filterSearch.value = '';
  subscribeToTickers(newTicker.title, (p) =>updateTicker(name, p))
  error.value = false;
}
function selectTicker(ticker) {
  selectedTicker.value = ticker;
}

const normalizedGraph = computed(() => {
  const max = Math.max(...graph.value)
  const min = Math.min(...graph.value)

  if (max === min) {
    return graph.value.map(() => 50)
  }

  return graph.value.map(price => 5 + ((price - min) * 95) / (max - min))

})
function deleteTicker(tickerTitle) {
  tickers.value = tickers.value.filter((item) => item.title !== tickerTitle);
  localStorage.setItem('crypto-list', JSON.stringify(tickers.value))
  if (tickerTitle.toLowerCase() === selectedTicker.value?.title.toLowerCase()) {
    selectedTicker.value = null
  };

  unsubscribeTicker(tickerTitle)
}

onMounted(() => {
  const windowData = Object.fromEntries(new URL(window.location).searchParams);
  if (windowData.filter) {
    filterSearch.value = windowData.filter
  }
  if (windowData.page) {
    page.value = Number(windowData.page)
  }

  getTickersNames();
  tickers.value = JSON.parse(localStorage.getItem('crypto-list')) ?? [];

    tickers.value.forEach((ticker) => {
      subscribeToTickers(ticker.title, (p) => updateTicker(ticker.title, p))
    })

  window.addEventListener('resize', calcMaxGraphElems)
})

onUnmounted(() => {
  window.removeEventListener(calcMaxGraphElems)
})

function updateTicker(ticker, price) {
  tickers.value.filter(t => t.title == ticker).forEach(t => {
    if (t == selectedTicker.value) {
      graph.value.push(price)
    }
    console.log(graph.value.length, maxGraphElems.value)
    while (graph.value.length > maxGraphElems.value) {
      graph.value.shift()
    }
    t.price = price
  })
}

function calcMaxGraphElems() {
  if (!graphRef.value) return;
  maxGraphElems.value = Number(graphRef.value.clientWidth) / 38;
}

async function getTickersNames() {
  let res = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');
  res = await res.json();
  localStorage.setItem('tickers', JSON.stringify(res.Data))
}

const filteredTickers = computed(() => {
  if (!filterSearch.value) {
    return tickers.value
  }
    return tickers.value.filter((item) => item.title.toLowerCase().includes(filterSearch.value))
})

const start = computed(() => {
  return (page.value -1) * 6
})

const end = computed(() => {
  return page.value * 6;
})

const tickersPaged = computed(() => {
  return filteredTickers.value.slice(start.value,end.value)
})

const hasNextPage = computed(() => {
  if (!filterSearch.value) {
    return tickers.value[6 * page.value] !== undefined
  } else {
    return filteredTickers.value[6 * page.value] !== undefined
  }
})

const pageStateOptions = computed(() => {
  return {
    filter: filterSearch.value,
    page: page.value
  }
})

watch(filterSearch, () => {
  page.value = 1;
})

watch(pageStateOptions, (v) => {
  const { pathname } = window.location;
  history.pushState(null, document.title, `${pathname}?filter=${v.filter}&page=${v.page}`)
})

watch(selectedTicker, () => {
  graph.value = [];
  nextTick().then(calcMaxGraphElems)
})

watch(tickersPaged, () => {
  if (tickersPaged.value.length === 0 && page.value > 1) {
    page.value -= 1;
  }
})
</script>

<template>
  <div class="min-h-dvh mx-auto flex flex-col items-center bg-gray-100 p-4">
    <div class="container">
      <add-ticker :error="error" @add-ticker="add"/>

      <hr v-if="tickersPaged.length" class="w-full border-t border-gray-600 my-4" />
      <div class="w-full flex flex-col gap-6">
        <div>
          <button v-if="page > 1" @click="page = page - 1">Назад</button>
          <button v-if="hasNextPage" @click="page = page + 1">Вперед</button>
        </div>
        <div class="text-black">Фильтр: <input v-model="filterSearch" /></div>
      </div>
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <coin-ticker
            v-for="ticker in tickersPaged"
            :key="ticker.title"
            :ticker="ticker"
            @click="selectTicker(ticker)"
            @delete-ticker="deleteTicker"
            :selected="ticker.title === selectedTicker?.title"
          />
      </dl>
      <hr v-if="selectedTicker" class="w-full border-t border-gray-600 my-4" />
      <coin-graph ref="graphRef" @close-graph="selectedTicker = null" :selected-ticker="selectedTicker" :normalized-graph="normalizedGraph" />
    </div>
  </div>
</template>