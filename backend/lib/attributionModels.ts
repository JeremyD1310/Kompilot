export type AttributionModel = 'last_touch' | 'first_touch' | 'linear' | 'position_based';

export type AttributionTouch = {
  id: string;
  channel: string;
  occurredAt: string;
};

export type AttributionCredit = {
  channel: string;
  touchpointId: string;
  weight: number;
};

export const ATTRIBUTION_MODELS: AttributionModel[] = ['last_touch', 'first_touch', 'linear', 'position_based'];

export function normalizeAttributionModel(value: unknown): AttributionModel {
  return ATTRIBUTION_MODELS.includes(value as AttributionModel)
    ? value as AttributionModel
    : 'last_touch';
}

export function allocateAttribution(touches: AttributionTouch[], model: AttributionModel): AttributionCredit[] {
  const ordered = [...touches]
    .filter(touch => touch.id && touch.channel)
    .sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
  if (!ordered.length) return [];

  if (model === 'first_touch') {
    return [{ channel: ordered[0].channel, touchpointId: ordered[0].id, weight: 1 }];
  }
  if (model === 'last_touch') {
    const last = ordered[ordered.length - 1];
    return [{ channel: last.channel, touchpointId: last.id, weight: 1 }];
  }
  if (model === 'linear') {
    const weight = 1 / ordered.length;
    return ordered.map(touch => ({ channel: touch.channel, touchpointId: touch.id, weight }));
  }

  if (ordered.length === 1) {
    return [{ channel: ordered[0].channel, touchpointId: ordered[0].id, weight: 1 }];
  }
  if (ordered.length === 2) {
    return ordered.map(touch => ({ channel: touch.channel, touchpointId: touch.id, weight: 0.5 }));
  }
  const middleWeight = 0.2 / (ordered.length - 2);
  return ordered.map((touch, index) => ({
    channel: touch.channel,
    touchpointId: touch.id,
    weight: index === 0 || index === ordered.length - 1 ? 0.4 : middleWeight,
  }));
}
