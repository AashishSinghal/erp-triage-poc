type UpdateExpressionResult = {
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
};

export const buildUpdateExpression = <T extends object>(
  updates: Partial<T>,
  options: { addUpdatedAt?: boolean } = { addUpdatedAt: true },
): UpdateExpressionResult => {
  const updateExpression: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  if (options.addUpdatedAt) {
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      continue;
    }
    updateExpression.push(`#${key} = :${key}`);
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = value;
  }

  if (updateExpression.length === 0) {
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  }

  return {
    updateExpression: `SET ${updateExpression.join(', ')}`,
    expressionAttributeNames,
    expressionAttributeValues,
  };
};
