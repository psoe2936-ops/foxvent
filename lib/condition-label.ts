type TFunc = (key: string) => string

const CONDITION_KEYS: Record<string, string> = {
  new: 'conditionNew',
  like_new: 'conditionLikeNew',
  good: 'conditionGood',
  fair: 'conditionFair',
}

export function getConditionLabel(t: TFunc, condition: string): string {
  const key = CONDITION_KEYS[condition]
  return key ? t(key) : condition
}
