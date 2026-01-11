import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MarksRange {
  @Prop({ required: true })
  min!: number;

  @Prop({ required: true })
  max!: number;
}

@Schema({ _id: false })
export class CutoffCategory {
  @Prop({ required: true })
  category!: string;

  @Prop({ type: MarksRange, required: true })
  marksRange!: MarksRange;
}

@Schema({ _id: false })
export class OverallCutoff {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: [CutoffCategory], required: true })
  categories!: CutoffCategory[];
}

@Schema({ _id: false })
export class SectionalCutoff {
  @Prop({ required: true })
  sectionId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ type: [CutoffCategory], required: true })
  categories!: CutoffCategory[];
}

@Schema({ _id: false })
export class Cutoffs {
  @Prop({ type: OverallCutoff })
  overall?: OverallCutoff;

  @Prop({ type: [SectionalCutoff] })
  sectional?: SectionalCutoff[];
}