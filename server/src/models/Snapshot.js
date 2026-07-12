import mongoose from 'mongoose';

const snapshotSchema = new mongoose.Schema({
  tipo: { type: String, required: true, index: true },
  dados: { type: mongoose.Schema.Types.Mixed, required: true },
  geradoEm: { type: Date, default: Date.now, index: true },
});

snapshotSchema.index({ tipo: 1, geradoEm: -1 });

export const Snapshot = mongoose.model('Snapshot', snapshotSchema);
