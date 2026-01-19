
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

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
