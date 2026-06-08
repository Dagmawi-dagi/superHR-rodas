<template>
  <PrintPage>
    <div class="amharic-document">
      <!-- Header / Meta -->
      <div class="header-meta">
        <div class="meta-left">
          <span>ቁጥር</span> <span class="pl-2">{{ refNumber }}</span>
        </div>
        <div class="meta-right">
          <span>ቀን</span> <span class="pl-2">{{ date }}</span>
        </div>
      </div>

      <!-- Recipient -->
      <div class="recipient-section">
        <div>ለ <span>{{ recipientName }}</span></div>
        <div class="recipient-city">{{ recipientCity }}</div>
      </div>

      <!-- Subject -->
      <div class="subject-section">
        <span class="subject-label">ጉዳዩ ፡</span> <span class="subject-text">{{ subject }}</span>
      </div>

      <!-- Body -->
      <div class="document-body">
        <p>
          በድርጅታችን ሱፐር ደብል ቲ ጄኔራል ትሬዲንግ ኃ.የተ.የግል ማህበር ውስጥ ተቀጥረው እያገለገሉ ለሚገኙት ለአቶ/ወ/ሮ/ወ/ሪት <strong>{{ employeeName }}</strong> {{ senderDepartment }} በደብዳቤ ቁጥር <strong>{{ letterRefNumber }}</strong> በቀን <strong>{{ letterDate }}</strong> በተፃፈ ደብዳቤ አቶ/ወ/ሮ/ወ/ሪት <strong>{{ guarantorName }}</strong> ዋስትና ገብተዋል፡፡ አባሪው መመሪያ ወደ እናንተ ፖሊስ ጣቢያ የተላከ መሆኑ ተገልጿል፡፡
        </p>
        <p>
          በዚሁ መሰረት ሁሉም መስሪያ ቤቶች በሚፅፉልን ደብዳቤ ላይ ዋስትና የገባው ሰራተኛ በተለያዩ ምክንያቶች ስራውን መልቀቅ ቢፈልግ ከመልቀቁ በፊት ለድርጅታችን እንዲያሳውቁ ይገልፁልናል፡፡ ሆኖም ግን አንዳንድ መስሪያ ቤቶች ሰራተኛው ሲለቅ በተለያዩ ምክንያቶች አይነግሩንም፡፡ በመሆኑም ከላይ የተጠቀሱት የድርጅታችን ሰራተኛ በስራ ላይ ስለመሆናቸው በሚመለከተው አካል ፊርማ እና በድርጅቱ ማህተም ታረጋግጡልን ዘንድ በማክበር እንጠይቃለን፡፡
        </p>
      </div>

      <!-- Closing -->
      <div class="closing-section">
        <p>ከሰላምታ ጋር</p>
      </div>
    </div>
  </PrintPage>
</template>

<script setup lang="ts">
import PrintPage from '@/components/Print/PrintPage.vue';

interface Props {
  refNumber: string;
  date: string;
  recipientName: string;
  recipientCity?: string;
  subject?: string;
  employeeName: string;
  senderDepartment?: string;
  letterRefNumber: string;
  letterDate: string;
  guarantorName: string;
}

withDefaults(defineProps<Props>(), {
  recipientCity: 'አዲስ አበባ',
  subject: 'ትብብርን ይመለከታል',
  senderDepartment: 'ከአ/ከ/ፖ/መምሪያ አከባቢ ፖሊስ ጣቢያ',
});
</script>

<style scoped>
.amharic-document {
  font-family: 'Nyala', 'Abyssinica SIL', 'Visual Geez Unicode', sans-serif;
  color: #000;
  padding-top: 15mm;
}

/* Header Meta Elements */
.header-meta {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 11pt;
  margin-bottom: 20mm;
  padding: 0 10%; /* Indent 10% from left and right */
  letter-spacing: 0.5px;
}

/* Recipient Block */
.recipient-section {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 10mm;
  padding-left: 10%;
  letter-spacing: 0.5px;
}

.recipient-city {
  text-decoration: underline;
  margin-top: 4px;
}

/* Subject Line */
.subject-section {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 4mm;
  padding-left: 35%; /* Indent significantly to match the center-right alignment of the subject */
}

.subject-label {
  margin-right: 15px;
}

.subject-text {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* Document Body Paragraphs */
.document-body {
  padding: 0 10%; /* Match the general document margins */
}

.document-body p {
  text-align: justify;
  text-justify: inter-word;
  line-height: 2.2; /* Loose line height */
  font-size: 14px;
  margin-bottom: 12mm;
  letter-spacing: 0.2px;
}

.document-body strong {
  font-weight: bold;
  text-decoration: none; /* Removed underline from dynamic fields in paragraphs to match image */
}

/* Closing Block */
.closing-section {
  margin-top: 12mm;
  padding-left: 65%; /* Push to the right */
  font-size: 12pt;
  font-weight: normal;
}
</style>
