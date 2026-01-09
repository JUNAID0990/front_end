


// import { GoogleGenAI, Type } from "@google/genai";
// import { AIAnalysisResult, SuggestedQuestion, VitalEntry } from "../types";

// // Vite uses import.meta.env. VITE_ prefix is required for client exposure.
// const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || '';

// const ai = new GoogleGenAI({ apiKey: API_KEY });

// export const getClinicalAnalysis = async (
//   patientData: any,
//   vitals: VitalEntry[]
// ): Promise<AIAnalysisResult> => {
//   // If no key, fail gracefully with clear message
//   if (!API_KEY) {
//     console.warn("CareSync: Missing VITE_API_KEY. AI features disabled.");
//     return {
//       riskLevel: 'Monitor',
//       riskScore: 0,
//       factors: ['API Key missing'],
//       summary: 'AI analysis unavailable. Please configure VITE_API_KEY in .env file.'
//     };
//   }

//   const model = ai.models.generateContent({
//     model: 'gemini-1.5-flash',
//     contents: `Analyze this patient's recent data for a doctor's clinical review. 
//     Patient: ${JSON.stringify(patientData)}
//     Recent Vitals: ${JSON.stringify(vitals)}
//     Provide a clinical risk assessment. 
//     Be conservative and medical-grade.`,
//     config: {
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: Type.OBJECT,
//         properties: {
//           riskLevel: { type: Type.STRING, description: "Normal, Monitor, or Elevated" },
//           riskScore: { type: Type.NUMBER, description: "Numeric score from 0-100" },
//           factors: { type: Type.ARRAY, items: { type: Type.STRING } },
//           summary: { type: Type.STRING }
//         },
//         required: ["riskLevel", "riskScore", "factors", "summary"]
//       }
//     }
//   });

//   try {
//     const result = await model;
//     return JSON.parse(result.text || '{}');
//   } catch (error) {
//     console.error("Gemini Analysis Error:", error);
//     return {
//       riskLevel: 'Monitor',
//       riskScore: 50,
//       factors: ['Error during AI processing'],
//       summary: 'Data analysis currently unavailable.'
//     };
//   }
// };

// export const getSuggestedQuestions = async (
//   analysis: AIAnalysisResult
// ): Promise<SuggestedQuestion[]> => {
//   if (!API_KEY) return [];

//   const model = ai.models.generateContent({
//     model: 'gemini-1.5-flash',
//     contents: `Based on this patient risk analysis: ${JSON.stringify(analysis)}, suggest 3 priority follow-up questions a doctor should ask the patient.`,
//     config: {
//       responseMimeType: "application/json",
//       responseSchema: {
//         type: Type.ARRAY,
//         items: {
//           type: Type.OBJECT,
//           properties: {
//             id: { type: Type.STRING },
//             question: { type: Type.STRING },
//             priority: { type: Type.STRING, description: "High, Medium, or Low" }
//           },
//           required: ["id", "question", "priority"]
//         }
//       }
//     }
//   });

//   try {
//     const result = await model;
//     return JSON.parse(result.text || '[]');
//   } catch (error) {
//     return [];
//   }
// };
