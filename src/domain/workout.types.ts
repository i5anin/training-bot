export type WorkoutSplit =
  | 'back_traps'
  | 'chest_calves'
  | 'deadlift'
  | 'shoulders_abs'
  | 'legs'
  | 'arms';

export type SessionStep = 'idle' | 'choose_split' | 'collecting';

export type ISODate = string; // YYYY-MM-DD

export type SetEntry =
  | Readonly<{
      kind: 'parsed';
      weight?: number;
      reps?: number;
      sets?: number;
      note?: string;
      raw: string;
    }>
  | Readonly<{
      kind: 'raw';
      raw: string;
    }>;

export type Exercise = Readonly<{
  name: string;
  sets: ReadonlyArray<SetEntry>;
}>;

export type Workout = Readonly<{
  date: ISODate;
  split: WorkoutSplit;
  exercises: ReadonlyArray<Exercise>;
}>;

export type WorkoutSession = Readonly<{
  step: SessionStep;
  date: ISODate;
  split?: WorkoutSplit;
  currentExercise?: string;
  exercises: ReadonlyArray<Exercise>;
  cardMessageId?: number;
}>;
