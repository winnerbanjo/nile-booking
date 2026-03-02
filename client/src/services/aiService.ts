// AI Service for optimizing service descriptions
// Uses internal Express backend API endpoint

export const optimizeServiceDescription = async (
  currentDescription: string,
  serviceName: string,
  category: string
): Promise<string> => {
  try {
    // Call internal backend API endpoint
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentDescription,
        serviceName,
        category,
      }),
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    return data.optimizedDescription || currentDescription;
  } catch (error) {
    console.error('AI optimization error:', error);
    // Fallback to manual enhancement
    return enhanceDescriptionManually(currentDescription, serviceName, category);
  }
};

const enhanceDescriptionManually = (
  description: string,
  serviceName: string,
  category: string
): string => {
  // Simple enhancement without AI
  let enhanced = description.trim();

  // Add engaging opening if missing
  if (!enhanced.match(/^(Experience|Discover|Enjoy|Book)/i)) {
    enhanced = `Experience ${enhanced.charAt(0).toLowerCase() + enhanced.slice(1)}`;
  }

  // Ensure it ends with a call to action
  if (!enhanced.match(/\.$/)) {
    enhanced += '.';
  }
  if (!enhanced.match(/(book|reserve|schedule)/i)) {
    enhanced += ' Book now to secure your spot!';
  }

  return enhanced;
};
