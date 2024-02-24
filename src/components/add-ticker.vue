<template>
  <section>
    <div class="flex flex-col">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700">
          Тикер
        </label>
        <div class="mt-1 relative rounded-md shadow-md">
          <input
              v-model="search"
              @keydown.enter="addTicker"
              type="text"
              name="wallet"
              id="wallet"
              class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
              placeholder="Например DOGE"
          />
        </div>
        <div v-if="search && suggestedTickers" class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap">
            <span @click="addTicker(suggestedT.Symbol)" v-for="suggestedT in suggestedTickers" :key="suggestedT.Symbol" class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer">
              {{suggestedT.Symbol}}
            </span>
        </div>
        <div v-if="error" class="text-sm text-red-600">Такой тикер уже добавлен</div>
      </div>
      <add-button @click="addTicker" class="my-4"/>
    </div>
  </section>
</template>

<script setup>
import AddButton from "./add-button.vue";
import {computed, ref} from "vue";
const emit = defineEmits(['add-ticker']);
const search = ref();

defineProps({
  error: Boolean
})

const suggestedTickers = computed(() => {
  if (!localStorage.getItem('tickers')) {
    return [];
  }
  const suggested = JSON.parse(localStorage.getItem('tickers'))
  return Object.values(suggested).filter((item) => item.Symbol.includes(search.value.toUpperCase())).splice(0,4);
})


function addTicker(name) {
  emit('add-ticker', typeof name === 'string' ? name : search.value.toUpperCase())
  search.value = '';
}
</script>