<template>
  <v-dialog v-model="isDialogVisible" persistent max-width="500px">
    <!-- Use v-if to ensure the dialog is shown only when pendingFlip is fully ready -->
    <v-card v-if="gameState.pendingFlip.value">
      <v-card-title>
        <span class="text-h5">选择要翻开的棋子</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col
              v-for="item in availablePieces"
              :key="item.name"
              cols="4" sm="3" md="2"
              class="text-center"
            >
              <div @click="selectPiece(item.name)" class="piece-option">
                <img :src="getPieceImageUrl(item.name)" :alt="item.name" class="piece-image" />
                <div>{{ item.count }}</div>
              </div>
            </v-col>
          </v-row>
          <v-row v-if="availablePieces.length === 0">
             <v-col>
                <p>错误：暗子池里没有符合当前位置颜色的棋子了！请先在侧边栏调整暗子池。</p>
             </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="cancelFlip">
          取消
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';

const gameState: any = inject('game-state');

const isDialogVisible = computed(() => gameState.pendingFlip.value !== null);

const availablePieces = computed(() => {
  if (!gameState.pendingFlip.value) return [];
  const requiredSide = gameState.pendingFlip.value.side;
  
  return Object.entries(gameState.unrevealedPieceCounts.value)
    .map(([char, count]) => {
      const name = gameState.getPieceNameFromChar(char);
      return { name, char, count };
    })
    .filter(item => {
      const pieceSide = item.name.startsWith('red') ? 'red' : 'black';
      return pieceSide === requiredSide && (item.count as number) > 0;
    });
});

function selectPiece(pieceName: string) {
  if (gameState.pendingFlip.value) {
    gameState.pendingFlip.value.callback(pieceName);
  }
}

function cancelFlip() {
if (gameState.pendingFlip.value) {
  // When the dialog is closed directly, flip a piece randomly based on probability
  const requiredSide = gameState.pendingFlip.value.side;
  const pool = Object.entries(gameState.unrevealedPieceCounts.value)
    .filter(([, count]) => (count as number) > 0)
    .flatMap(([char, count]) => {
      const name = gameState.getPieceNameFromChar(char);
      return name.startsWith(requiredSide) ? Array(count as number).fill(name) : [];
    });

  if (pool.length > 0) {
    // Randomly select a piece
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosenName = pool[randomIndex];
    gameState.pendingFlip.value.callback(chosenName);
  } else {
    // If no pieces are available, just cancel
    gameState.pendingFlip.value = null;
  }
}
}

function getPieceImageUrl(pieceName: string): string {
  const imageName = pieceName || 'dark_piece';
  return new URL(`../assets/${imageName}.svg`, import.meta.url).href;
};
</script>

<style scoped>
.piece-option {
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}
.piece-option:hover {
  background-color: #f0f0f0;
}
.piece-image {
  width: 40px;
  height: 40px;
}
</style>