<template>
  <v-dialog v-model="isVisible" persistent max-width="800px">
    <v-card>
      <v-card-title>
        <span class="text-h5">局面编辑</span>
      </v-card-title>
      
      <v-card-text>
        <v-container>
          <!-- Action Buttons -->
          <v-row class="mb-4">
            <v-col cols="12">
              <div class="d-flex gap-2 flex-wrap">
                <v-btn @click="flipBoard" color="primary" variant="outlined">
                  🔄 上下翻转
                </v-btn>
                <v-btn @click="switchSide" color="secondary" variant="outlined">
                  ⚡ 切换先手
                </v-btn>
                <v-btn @click="resetPosition" color="warning" variant="outlined">
                  🔄 重置局面
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <!-- Board Editing Area -->
          <v-row>
            <v-col cols="8">
              <div class="position-editor-board">
                <div class="board-grid">
                  <div 
                    v-for="row in 10" 
                    :key="`row-${row-1}`" 
                    class="board-row"
                  >
                    <div 
                      v-for="col in 9" 
                      :key="`col-${col-1}`" 
                      class="board-cell"
                      :class="{ 
                        'selected': selectedCell.row === row-1 && selectedCell.col === col-1,
                        'has-piece': getPieceAt(row-1, col-1)
                      }"
                      @click="selectCell(row-1, col-1)"
                    >
                      <div v-if="getPieceAt(row-1, col-1)" class="piece-display">
                        <img 
                          :src="getPieceImageUrl(getPieceAt(row-1, col-1)!.name)" 
                          :alt="getPieceAt(row-1, col-1)!.name"
                          class="piece-img"
                        />
                        <v-btn 
                          v-if="!getPieceAt(row-1, col-1)!.isKnown"
                          icon="mdi-minus" 
                          size="x-small" 
                          color="error"
                          class="remove-btn"
                          @click.stop="removePiece(row-1, col-1)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-col>

            <!-- Piece Selector Panel -->
            <v-col cols="4">
              <div class="piece-selector">
                <h4>添加棋子</h4>
                
                <!-- Known Piece Selection -->
                <div class="piece-category">
                  <h5>明子</h5>
                  <div class="piece-grid">
                    <div 
                      v-for="piece in knownPieces" 
                      :key="piece.name"
                      class="piece-option"
                      @click="addPiece(piece.name, true)"
                    >
                      <img :src="getPieceImageUrl(piece.name)" :alt="piece.name" class="piece-img" />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>

                <!-- Unknown Piece Selection -->
                <div class="piece-category">
                  <h5>暗子</h5>
                  <div class="piece-grid">
                    <div 
                      v-for="piece in unknownPieces" 
                      :key="piece.name"
                      class="piece-option"
                      @click="addPiece(piece.name, false)"
                    >
                      <img :src="getPieceImageUrl('dark_piece')" :alt="piece.name" class="piece-img" />
                      <span class="piece-name">{{ piece.displayName }}</span>
                    </div>
                  </div>
                </div>

                <!-- Current Selection Info -->
                <div v-if="selectedCell.row !== -1" class="selected-info">
                  <p>选中位置: {{ String.fromCharCode(97 + selectedCell.col) }}{{ 9 - selectedCell.row }}</p>
                  <p v-if="getPieceAt(selectedCell.row, selectedCell.col)">
                    棋子: {{ getPieceDisplayName(getPieceAt(selectedCell.row, selectedCell.col)!.name) }}
                  </p>
                </div>
              </div>
            </v-col>
          </v-row>

          <!-- Validation Status -->
          <v-row>
            <v-col cols="12">
              <v-alert 
                :type="validationStatus === '正常' ? 'success' : 'error'"
                :title="validationStatus"
                variant="tonal"
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="error" variant="text" @click="cancelEdit">
          取消
        </v-btn>
        <v-btn color="primary" @click="applyChanges" :disabled="validationStatus !== '正常'">
          应用更改
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue';
import type { Piece } from '@/composables/useChessGame';

interface Props {
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'position-changed', pieces: Piece[], sideToMove: 'red' | 'black'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const gameState: any = inject('game-state');

// Dialog visibility
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Editing state
const editingPieces = ref<Piece[]>([]);
const editingSideToMove = ref<'red' | 'black'>('red');
const selectedCell = ref({ row: -1, col: -1 });

// Piece options
const knownPieces = [
  { name: 'red_chariot', displayName: '红车' },
  { name: 'red_horse', displayName: '红马' },
  { name: 'red_elephant', displayName: '红象' },
  { name: 'red_advisor', displayName: '红士' },
  { name: 'red_king', displayName: '红帅' },
  { name: 'red_cannon', displayName: '红炮' },
  { name: 'red_pawn', displayName: '红兵' },
  { name: 'black_chariot', displayName: '黑车' },
  { name: 'black_horse', displayName: '黑马' },
  { name: 'black_elephant', displayName: '黑象' },
  { name: 'black_advisor', displayName: '黑士' },
  { name: 'black_king', displayName: '黑将' },
  { name: 'black_cannon', displayName: '黑炮' },
  { name: 'black_pawn', displayName: '黑卒' },
];

const unknownPieces = [
  { name: 'unknown', displayName: '暗子' },
];

// Initialize editing state
watch(isVisible, (visible) => {
  if (visible) {
    // Deep copy the current board state, but keep the unknown state of unknown pieces
    editingPieces.value = gameState.pieces.value.map((piece: any) => ({
      ...piece,
      id: piece.id, // Keep the original ID
      // If it's an unknown piece, ensure it remains unknown
      isKnown: piece.isKnown,
      name: piece.isKnown ? piece.name : (
        gameState.isBoardFlipped ? 
          (piece.row < 5 ? 'red_unknown' : 'black_unknown') :
          (piece.row >= 5 ? 'red_unknown' : 'black_unknown')
      )
    }));
    editingSideToMove.value = gameState.sideToMove.value;
    selectedCell.value = { row: -1, col: -1 };
  }
});

// Get the piece at a specific position
const getPieceAt = (row: number, col: number): Piece | null => {
  return editingPieces.value.find(p => p.row === row && p.col === col) || null;
};

// Select a cell
const selectCell = (row: number, col: number) => {
  selectedCell.value = { row, col };
};

// Add a piece
const addPiece = (pieceName: string, isKnown: boolean) => {
  if (selectedCell.value.row === -1) return;
  
  const existingPiece = getPieceAt(selectedCell.value.row, selectedCell.value.col);
  if (existingPiece) {
    // Remove the existing piece
    editingPieces.value = editingPieces.value.filter(p => p.id !== existingPiece.id);
  }
  
  // For unknown pieces, determine red/black based on position
  let finalPieceName = pieceName;
  if (pieceName === 'unknown') {
    // Need to consider if the board is flipped
    const isRedSide = gameState.isBoardFlipped ? 
      selectedCell.value.row < 5 : 
      selectedCell.value.row >= 5;
    finalPieceName = isRedSide ? 'red_unknown' : 'black_unknown';
  }
  
  const newPiece: Piece = {
    id: Date.now() + Math.random(), // Generate a unique ID
    name: finalPieceName,
    row: selectedCell.value.row,
    col: selectedCell.value.col,
    isKnown,
    initialRole: gameState.getRoleByPosition ? gameState.getRoleByPosition(selectedCell.value.row, selectedCell.value.col) : '',
    initialRow: selectedCell.value.row,
    initialCol: selectedCell.value.col,
  };
  
  editingPieces.value.push(newPiece);
};

// Remove a piece
const removePiece = (row: number, col: number) => {
  editingPieces.value = editingPieces.value.filter(p => !(p.row === row && p.col === col));
};

// Flip the board vertically (visual flip, also affects main interface display)
const flipBoard = () => {
  editingPieces.value = editingPieces.value.map(piece => ({
    ...piece,
    row: 9 - piece.row,
    initialRow: 9 - piece.initialRow,
  }));
  
  // Use the game state's flip function
  if (gameState.toggleBoardFlip) {
    gameState.toggleBoardFlip();
  }
};

// Switch side to move
const switchSide = () => {
  editingSideToMove.value = editingSideToMove.value === 'red' ? 'black' : 'red';
};

// Reset position
const resetPosition = () => {
  const startFen = "xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX A2B2N2R2C2P5a2b2n2r2c2p5 w - - 0 1";
  if (gameState.loadFen) {
    gameState.loadFen(startFen, false);
    editingPieces.value = JSON.parse(JSON.stringify(gameState.pieces.value));
    editingSideToMove.value = 'red';
  }
};

// Validation status
const validationStatus = computed(() => {
  // Check for duplicate piece positions
  const positions = editingPieces.value.map(p => `${p.row},${p.col}`);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    return '错误: 存在重复的棋子位置';
  }
  
  return '正常';
});

// Get piece image URL
const getPieceImageUrl = (pieceName: string): string => {
  const imageName = pieceName === 'red_unknown' || pieceName === 'black_unknown' || pieceName === 'unknown' ? 'dark_piece' : pieceName;
  return new URL(`../assets/${imageName}.svg`, import.meta.url).href;
};

// Get piece display name
const getPieceDisplayName = (pieceName: string): string => {
  const knownPiece = knownPieces.find(p => p.name === pieceName);
  if (knownPiece) return knownPiece.displayName;
  
  if (pieceName === 'red_unknown') return '红暗子';
  if (pieceName === 'black_unknown') return '黑暗子';
  if (pieceName === 'unknown') return '暗子';
  
  return pieceName;
};

// Cancel edit
const cancelEdit = () => {
  isVisible.value = false;
};

// Apply changes
const applyChanges = () => {
  if (validationStatus.value !== '正常') return;
  
  // Record the edit operation in history
  const editData = `position_edit:${editingPieces.value.length}_pieces`;
  if (gameState.recordAndFinalize) {
    gameState.recordAndFinalize('adjust', editData);
  }
  
  // Directly apply the edited piece positions
  // If the board was flipped, the main interface will also remain flipped
  gameState.pieces.value = editingPieces.value;
  gameState.sideToMove.value = editingSideToMove.value;
  
  // Reset the zIndex of all pieces during position editing
  gameState.pieces.value.forEach((p: any) => p.zIndex = undefined);
  
  // Trigger the arrow clear event
  if (gameState.triggerArrowClear) {
    gameState.triggerArrowClear();
  }
  
  emit('position-changed', editingPieces.value, editingSideToMove.value);
  isVisible.value = false;
};
</script>

<style lang="scss" scoped>
.position-editor-board {
  border: 2px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5dc;
}

.board-grid {
  display: grid;
  grid-template-rows: repeat(10, 1fr);
  aspect-ratio: 9/10;
}

.board-row {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
}

.board-cell {
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  min-height: 40px;
  
  &:hover {
    background-color: #e3f2fd;
  }
  
  &.selected {
    background-color: #bbdefb;
    border-color: #1976d2;
  }
  
  &.has-piece {
    background-color: #f0f8ff;
  }
}

.piece-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.piece-img {
  width: 30px;
  height: 30px;
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 10;
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
}

.piece-selector {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  height: 100%;
  overflow-y: auto;
}

.piece-category {
  margin-bottom: 20px;
  
  h5 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 14px;
  }
}

.piece-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.piece-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  
  &:hover {
    background-color: #e3f2fd;
    border-color: #1976d2;
  }
  
  .piece-img {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
  }
  
  .piece-name {
    font-size: 10px;
    text-align: center;
    color: #666;
  }
}

.selected-info {
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
  
  p {
    margin: 4px 0;
    font-size: 12px;
    color: #666;
  }
}

.gap-2 {
  gap: 8px;
}

.flex-wrap {
  flex-wrap: wrap;
}
</style> 