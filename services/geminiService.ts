
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, MaterialType, MaterialPrice } from "../types";

export const getConstructionAdvice = async (history: ChatMessage[], message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We use generateContent instead of chat for search-grounded technical advice
  // to ensure building codes (which change frequently) are up-to-date.
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      { role: 'user', parts: [{ text: `Previous conversation history: ${JSON.stringify(history.slice(-4))}` }] },
      { role: 'user', parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `You are an expert Pakistani Civil Engineer and Building Code Consultant. 
      Specialize in regulations for:
      - LDA (Lahore Development Authority)
      - CDA (Capital Development Authority - Islamabad)
      - SBCA (Sindh Building Control Authority - Karachi)
      - KDA (Karachi Development Authority)
      - PDA (Peshawar Development Authority)
      
      Provide precise technical advice on:
      1. Setbacks (front, rear, side) based on plot size (e.g., 5 Marla, 10 Marla, 1 Kanal).
      2. FAR (Floor Area Ratio) and Ground Coverage limits.
      3. Zoning (Residential vs Commercial) and Commercialization fees.
      4. Building height limits and number of storeys allowed.
      
      Use local terminology. Always cite the specific authority's bylaws. If Google Search provides grounding chunks, ensure you mention them as sources.`,
      tools: [{ googleSearch: {} }],
    },
  });

  let text = response.text || "I'm sorry, I couldn't find specific data for that query.";
  
  // Extract grounding chunks for citations
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && chunks.length > 0) {
    const citations: string[] = [];
    chunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        citations.push(`- [${chunk.web.title || 'Official Source'}](${chunk.web.uri})`);
      }
    });
    
    if (citations.length > 0) {
      const uniqueCitations = Array.from(new Set(citations));
      text += `\n\n**Regulatory Sources:**\n${uniqueCitations.join('\n')}`;
    }
  }

  return text;
};

export const fetchLiveMarketData = async (city: string): Promise<MaterialPrice[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
