<template>
  <div class="p-6 h-full overflow-auto bg-gray-100">
    <div class="mb-6 flex justify-between items-center no-print">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Document Templates Preview</h1>
        <p class="text-gray-500">Preview and test the dynamic Amharic letter layouts.</p>
        <div class="mt-4 flex flex-wrap gap-4">
          <button @click="activeDoc = 1" :class="activeDoc === 1 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'" class="px-4 py-2 rounded shadow font-medium">Document 1</button>
          <button @click="activeDoc = 2" :class="activeDoc === 2 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'" class="px-4 py-2 rounded shadow font-medium">Document 2</button>
          <button @click="activeDoc = 3" :class="activeDoc === 3 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'" class="px-4 py-2 rounded shadow font-medium">Document 3</button>
          <button @click="activeDoc = 4" :class="activeDoc === 4 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'" class="px-4 py-2 rounded shadow font-medium">Document 4</button>
          <button @click="activeDoc = 5" :class="activeDoc === 5 ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'" class="px-4 py-2 rounded shadow font-medium">Document 5</button>
        </div>
      </div>
      <button 
        @click="printDocument" 
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition duration-150 ease-in-out flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print Document
      </button>
    </div>

    <!-- Reusable Component Usage -->
    <Document1 v-if="activeDoc === 1"
      refNumber="ሱዳቲ/ስህ/2015/18"
      date="15/01/2018"
      recipientName="ኤልሚ ኢሊንዶ ኮንትራክተርስ ኃ/ የተ/የግ/ማ"
      recipientCity="አዲስ አበባ"
      subject="ትብብርን ይመለከታል"
      employeeName="መዲና ኑረዲን ሁሴን"
      letterRefNumber="356/ሲ/ኤልሚ/ፐርስ/18"
      letterDate="21/06/2018 ዓ.ም"
      guarantorName="ተመስገን እሸቱ"
    />

    <Document2 v-if="activeDoc === 2"
      refNumber="ሱዳቲ/ስህ/2016/18"
      date="15/08/2018"
      recipientName="ለ ኮልፌ ቀራኒዮ ክ/ከተማ ወረዳ 6 ጤና ጣቢያ የሰው ሃይል አስተዳደር ደጋፊ የስራ ሂደት"
      recipientCity="አዲስ አበባ"
      subject="የዋስትና ድጋሚ ማረጋገጥን ይመለከታል"
      employeeName="መድኃኒት ሀ/መስቀል"
      letterRefNumber="06/ጤ/ጣ/የሰው/ኃ/አስ/ደ/የ/ሂ/ሠ/158/72"
      letterDate="13/08/2018 ዓ.ም"
      guarantorName="ታደሰ ጤና"
    />

    <Document3 v-if="activeDoc === 3"
      refNumber="ሱዳቲ/ስህ/2013/18"
      date="15/01/2018"
      recipientName="አዲስ ከተማ ክ/ከተማ ፖሊስ መምሪያ ኮልፌ አካባቢ ፖሊስ ጣቢያ"
      recipientCity="አዲስ አበባ"
      subject="ትብብርን ይመለከታል"
      employeeName="ገነት ተሾመ"
      letterRefNumber="አ/መ/ፖ/አስር/11/2267/11"
      letterDate="12/08/2011 ዓ.ም"
      guarantorName="የሻረግ ይታያሉ ሃይሉ"
    />

    <Document4 v-if="activeDoc === 4"
      refNumber="ሱዳቲ/ስህ/2014/18"
      date="15/08/2018"
      recipientName="ቦሌ ክ/ክ/ፖሊስ መምሪያ ቦሌ ቡልቡላ አካባቢ ፖሊስ ጣቢያ"
      recipientCity="አዲስ አበባ"
      subject="ዋስትና ድጋሚ ማረጋገጥን ይመለከታል"
      employeeName="ጽዮን ምትኩ ከበደ"
      senderDepartment="ከ/ክ/ፖሊስ ጣቢያ"
      letterRefNumber="7ኛ አስ/ሰ/ፋ/777/2016"
      letterDate="12/01/2016 ዓ.ም"
      guarantorName="ኮንጆ ስውአስ ፈንታ ተገኝ"
    />

    

    <Document5 v-if="activeDoc === 5"
      refNumber="ሱዳቲ/ስህ/2016/18"
      date="15/08/2018"
      recipientName="ለ ኮልፌ ቀራኒዮ ክ/ከተማ ወረዳ 6 ጤና ጣቢያ የሰው ሃይል አስተዳደር ደጋፊ የስራ ሂደት"
      recipientCity="አዲስ አበባ"
      subject="የዋስትና ድጋሚ ማረጋገጥን ይመለከታል"
      employeeName="መድኃኒት ሀ/መስቀል"
      letterRefNumber="06/ጤ/ጣ/የሰው/ኃ/አስ/ደ/የ/ሂ/ሠ/158/72"
      letterDate="13/08/2018 ዓ.ም"
      guarantorName="ታደሰ ጤና"
    />

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Document1 from '@/components/Print/1የትብብር ደብዳቤ.vue';
import Document2 from '@/components/Print/2የትብብር ደብዳቤ.vue';
import Document3 from '@/components/Print/2ድጋሚ ዋስትና ማረጋገጫ.vue';
import Document4 from '@/components/Print/3የትብብር ደብዳቤ(ፖሊስ).vue';
import Document5 from '@/components/Print/3ድጋሚ ዋስትና ማረጋገጫ(ፖሊስ).vue';

const activeDoc = ref(4);

const printDocument = () => {
  window.print();
};
</script>

<style scoped>
/* Ensure the print button and header are hidden during printing */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
