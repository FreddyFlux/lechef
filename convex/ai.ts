/**
 * AI Service Layer
 * Centralized service for OpenAI GPT-4o-mini integration
 */

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

interface AIConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
}

interface RecipeData {
  title: string;
  description?: string;
  cuisine: string[];
  skillLevel: string;
  cookTime: number; // minutes
  prepTime: number; // minutes
  cost: string; // "low", "medium", "high"
  canFreeze: boolean;
  canReheat: boolean;
  servings: number;
  ingredients: Array<{ name: string; amount: string }>;
  steps: string[];
}

interface WeeklyPlanData {
  recipes: Array<{
    dayOfWeek: number; // 0-6 (Monday-Sunday)
    recipe: RecipeData;
  }>;
}

/**
 * Get OpenAI API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Call OpenAI API with retry logic
 */
async function callOpenAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  config?: Partial<AIConfig>
): Promise<string> {
  const apiKey = config?.apiKey || getApiKey();
  const model = config?.model || DEFAULT_MODEL;
  const maxRetries = config?.maxRetries || MAX_RETRIES;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 && attempt < maxRetries - 1) {
          // Rate limited - wait longer before retry
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * (attempt + 1) * 2)
          );
          continue;
        }
        throw new Error(
          `OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      return content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries - 1) {
        // Wait before retrying
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * (attempt + 1))
        );
      }
    }
  }

  throw new Error(
    `Failed to call OpenAI API after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * Parse JSON response from AI
 */
function parseAIResponse<T>(response: string): T {
  try {
    // Try to extract JSON if wrapped in markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : response.trim();
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse AI response as JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate a recipe from a natural language prompt
 */
export async function generateRecipe(
  prompt: string,
  preferences?: {
    cuisine?: string[];
    dietaryRestrictions?: string[];
    skillLevel?: string;
    maxCookTime?: number;
    servings?: number;
  }
): Promise<RecipeData> {
  const systemPrompt = `You are a professional chef and recipe creator. Generate a complete recipe based on the user's request.

Return a JSON object with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description of the recipe",
  "cuisine": ["cuisine1", "cuisine2"],
  "skillLevel": "beginner" | "intermediate" | "advanced",
  "cookTime": number (minutes),
  "prepTime": number (minutes),
  "cost": "low" | "medium" | "high",
  "canFreeze": boolean,
  "canReheat": boolean,
  "servings": number,
  "ingredients": [
    {"name": "ingredient name", "amount": "2 cups"}
  ],
  "steps": ["step 1", "step 2", ...]
}

Make sure all fields are properly filled. Ingredients should have both name and amount. Steps should be clear and sequential.`;

  const userPrompt = preferences
    ? `Create a recipe for: ${prompt}

Preferences:
${preferences.cuisine ? `- Cuisine: ${preferences.cuisine.join(", ")}` : ""}
${preferences.dietaryRestrictions ? `- Dietary restrictions: ${preferences.dietaryRestrictions.join(", ")}` : ""}
${preferences.skillLevel ? `- Skill level: ${preferences.skillLevel}` : ""}
${preferences.maxCookTime ? `- Maximum cook time: ${preferences.maxCookTime} minutes` : ""}
${preferences.servings ? `- Servings: ${preferences.servings}` : ""}`
    : `Create a recipe for: ${prompt}`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const recipe = parseAIResponse<RecipeData>(response);

  // Validate required fields
  if (!recipe.title || !recipe.ingredients || !recipe.steps) {
    throw new Error("AI response missing required fields");
  }

  return recipe;
}

/**
 * Extract recipe from webpage content
 */
export async function extractRecipeFromUrl(url: string): Promise<RecipeData> {
  // First, fetch the webpage content
  let webpageContent: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RecipeBot/1.0; +https://lechef.app)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`
      );
    }

    webpageContent = await response.text();
  } catch (error) {
    throw new Error(
      `Failed to fetch webpage: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Extract text content (simplified - in production, use a proper HTML parser)
  const textContent = webpageContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 50000); // Limit to 50k characters

  const systemPrompt = `You are a recipe extraction expert. Extract recipe information from webpage content and return it in a structured JSON format.

Return a JSON object with this exact structure:
{
  "title": "Recipe title",
  "description": "Brief description (optional)",
  "cuisine": ["cuisine1", "cuisine2"],
  "skillLevel": "beginner" | "intermediate" | "advanced",
  "cookTime": number (minutes),
  "prepTime": number (minutes),
  "cost": "low" | "medium" | "high",
  "canFreeze": boolean,
  "canReheat": boolean,
  "servings": number,
  "ingredients": [
    {"name": "ingredient name", "amount": "2 cups"}
  ],
  "steps": ["step 1", "step 2", ...]
}

If information is missing, make reasonable estimates. Extract ingredients with amounts if available.`;

  const userPrompt = `Extract the recipe from this webpage content:

${textContent}

Source URL: ${url}`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const recipe = parseAIResponse<RecipeData>(response);

  // Validate required fields
  if (!recipe.title || !recipe.ingredients || !recipe.steps) {
    throw new Error("Failed to extract complete recipe from webpage");
  }

  return recipe;
}

/**
 * Generate a weekly meal plan
 */
export async function generateWeeklyPlan(
  prompt: string
): Promise<WeeklyPlanData> {
  const systemPrompt = `You are a meal planning expert. Generate a weekly meal plan (Monday through Sunday) with 7 different recipes.

Return a JSON object with this exact structure:
{
  "recipes": [
    {
      "dayOfWeek": 0, // 0=Monday, 1=Tuesday, ..., 6=Sunday
      "recipe": {
        "title": "Recipe title",
        "description": "Brief description",
        "cuisine": ["cuisine1"],
        "skillLevel": "beginner" | "intermediate" | "advanced",
        "cookTime": number (minutes),
        "prepTime": number (minutes),
        "cost": "low" | "medium" | "high",
        "canFreeze": boolean,
        "canReheat": boolean,
        "servings": number,
        "ingredients": [
          {"name": "ingredient name", "amount": "2 cups"}
        ],
        "steps": ["step 1", "step 2", ...]
      }
    }
  ]
}

Create 7 different recipes, one for each day of the week. Vary the cuisines and types of meals.`;

  const userPrompt = `Create a weekly meal plan based on the following preferences:

${prompt}

Generate 7 diverse recipes for Monday through Sunday. Make sure to incorporate all the preferences mentioned above.`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const plan = parseAIResponse<WeeklyPlanData>(response);

  // Validate structure
  if (!plan.recipes || plan.recipes.length !== 7) {
    throw new Error("Weekly plan must contain exactly 7 recipes");
  }

  // Validate each recipe has required fields
  for (const dayRecipe of plan.recipes) {
    if (
      dayRecipe.dayOfWeek < 0 ||
      dayRecipe.dayOfWeek > 6 ||
      !dayRecipe.recipe.title ||
      !dayRecipe.recipe.ingredients ||
      !dayRecipe.recipe.steps
    ) {
      throw new Error("Invalid recipe data in weekly plan");
    }
  }

  return plan;
}
