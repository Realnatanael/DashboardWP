import express from 'express';
import Habit from '../models/Habit.js';
import HabitEntry from '../models/HabitEntry.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const habits = await Habit.find().sort({ isActive: -1, updatedAt: -1, createdAt: -1 });
  res.json({ habits });
});

router.post('/', async (req, res) => {
  const { name, description = '', color = '#8EF6A3' } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Informe o nome da habilidade.' });
  }

  const habit = await Habit.create({
    name: name.trim(),
    description: description.trim(),
    color,
  });

  return res.status(201).json({ habit });
});

router.put('/:id', async (req, res) => {
  const { name, description = '', color = '#8EF6A3', isActive = true } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ message: 'Informe o nome da habilidade.' });
  }

  const habit = await Habit.findByIdAndUpdate(
    req.params.id,
    {
      name: name.trim(),
      description: description.trim(),
      color,
      isActive,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!habit) {
    return res.status(404).json({ message: 'Habilidade nao encontrada.' });
  }

  return res.json({ habit });
});

router.patch('/:id/archive', async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'Envie o campo isActive como booleano.' });
  }

  const habit = await Habit.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!habit) {
    return res.status(404).json({ message: 'Habilidade nao encontrada.' });
  }

  return res.json({ habit });
});

router.delete('/:id', async (req, res) => {
  const habit = await Habit.findByIdAndDelete(req.params.id);

  if (!habit) {
    return res.status(404).json({ message: 'Habilidade nao encontrada.' });
  }

  await HabitEntry.deleteMany({ habitId: req.params.id });
  return res.status(204).send();
});

export default router;
