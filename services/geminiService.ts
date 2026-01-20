
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, MaterialType, MaterialPrice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getConstructionAdvice = async (history: ChatMessage[], message: string) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an expert Pakistani Civil Engineer and Construction Consultant. 
      Help users with construction planning, materials, building codes (LDA, CDA, SBCA, KDA), and cost-saving tips specifically for the Pakistan market. 
      Use local terminology like Marla, Kanal, Grey Structure, and Finishing. 
      Always provide advice within the context of Pakistan's climate, material availability, and economic conditions.`,
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const fetchLiveMarketData = async (city: string): Promise<MaterialPrice[]> => {
  try {
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `Find the most recent and accurate construction material prices in ${city}, Pakistan as of ${today}. 
    Specifically look for: 
    1. Cement price per bag (e.g. Lucky, Maple Leaf, Bestway)
    2. Steel price per ton (Grade 60)
    3. Bricks price per 1000 units (A-quality)
    4. Sand price per trolley (Ravi or Chenab)
    
    Return the data as a JSON array of objects with these keys: type, unit, price (number), trend (up/down/stable), availability (In Stock/Low Stock/Out of Stock), change24h (estimated percentage number).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              unit: { type: Type.STRING },
              price: { type: Type.NUMBER },
              trend: { type: Type.STRING },
              availability: { type: Type.STRING },
              change24h: { type: Type.NUMBER }
            },
            required: ["type", "unit", "price", "trend", "availability", "change24h"]
          }
        }
      },
    });

    const results = JSON.parse(response.text || "[]");
    return results.map((item: any) => ({
      ...item,
      lastUpdated: 'Live from Search',
      type: item.type as MaterialType
    }));
  } catch (error) {
    console.error("Failed to fetch live prices:", error);
    throw error;
  }
};

export const analyzeConstructionSite = async (base64Image: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "Analyze this construction site photo. Identify the current stage of construction (e.g., foundation, lintel, roofing, finishing), potential safety issues, and common materials visible. Give advice based on Pakistan building standards." }
      ]
    }
  });
  return response.text;
};

export const generateArchitecturalImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
};
