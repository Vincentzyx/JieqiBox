<template>
  <v-dialog v-model="isFenInputDialogVisible" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="text-h5">输入或编辑FEN</span>
      </v-card-title>
      <v-card-text>
        <v-textarea
          label="FEN字符串"
          v-model="fenInput"
          rows="3"
          variant="outlined"
          auto-grow
          clearable
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="closeDialog">
          取消
        </v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="confirm">
          确认
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue';

// Inject properties and methods from the main game state composable.
const {
  isFenInputDialogVisible,
  confirmFenInput,
  generateFen,
}: any = inject('game-state');

const fenInput = ref('');

// Watch for the dialog's visibility state changes.
watch(isFenInputDialogVisible, (newValue) => {
  // When the dialog becomes visible, populate the textarea with the current game's FEN string.
  if (newValue) {
    fenInput.value = generateFen();
  }
});


function closeDialog() {
  isFenInputDialogVisible.value = false;
}

function confirm() {
  confirmFenInput(fenInput.value);
}
</script>