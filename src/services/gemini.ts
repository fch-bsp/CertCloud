import { GoogleGenAI, Type } from "@google/genai";
import { Domain, Question, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const parseExamGuide = async (pdfBase64: string, language: Language): Promise<Domain[]> => {
  const langText = language === "pt" ? "português" : "inglês";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: `Extraia os domínios do exame deste Guia de Exame AWS. Para cada domínio, forneça: nome, peso percentual e uma lista de tópicos principais. Retorne os dados como um array JSON de objetos com as chaves: name (string), weight (number, ex: 20 para 20%) e topics (array de strings). Retorne todos os textos em ${langText}.`,
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: "LOW" as any },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            weight: { type: Type.NUMBER },
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["name", "weight", "topics"],
        },
      },
    },
  });

  try {
    const domains = JSON.parse(response.text || "[]");
    return domains.map((d: any, index: number) => ({
      ...d,
      id: `domain-${index}`,
    }));
  } catch (e) {
    console.error("Failed to parse domains", e);
    return [];
  }
};

export const parseQuestionBank = async (pdfBase64: string, targetCount: number, language: Language): Promise<Question[]> => {
  const langText = language === "pt" ? "português" : "inglês";
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64,
            },
          },
          {
            text: `Extraia exatamente ${targetCount} questões deste Banco de Questões AWS. Se houver mais questões no documento, escolha ${targetCount} aleatórias. Para cada questão, forneça: o texto da pergunta, 4 opções (A, B, C, D), o ID da opção correta e uma explicação CONCISA (máximo 2 frases). Retorne como um array JSON de objetos com as chaves: text, options (array de {id, text}), correctOptionId e explanation. É MANDATÓRIO que você retorne exatamente ${targetCount} itens no array JSON. Retorne todos os textos (pergunta, opções, explicação) em ${langText}.`,
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: "LOW" as any },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["id", "text"],
              },
            },
            correctOptionId: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["text", "options", "correctOptionId", "explanation"],
        },
      },
    },
  });

  try {
    const questions = JSON.parse(response.text || "[]");
    return questions.map((q: any, index: number) => ({
      ...q,
      id: `q-${index}`,
    }));
  } catch (e) {
    console.error("Failed to parse questions", e);
    return [];
  }
};

export const analyzeResults = async (
  domains: Domain[],
  questions: Question[],
  userAnswers: any[],
  timeUsed: number,
  language: Language,
  candidateName: string,
  candidateAge: number
): Promise<string> => {
  const langText = language === "pt" ? "português" : "inglês";
  const prompt = `
    Analyze the following AWS simulation results for a candidate named ${candidateName} at CertaCloud.
    
    Candidate Info: Name: ${candidateName}, Age: ${candidateAge}
    
    Exam Domains: ${JSON.stringify(domains)}
    Questions and Explanations: ${JSON.stringify(questions)}
    User Answers: ${JSON.stringify(userAnswers)}
    Time Used: ${timeUsed} seconds
    
    Provide a detailed feedback report in Markdown.
    Include:
    1. Overall Performance Summary.
    2. Breakdown by Domain: For EACH wrong answer, explicitly state which AWS Domain it belongs to (from the provided Guide) and why.
    3. Specific analysis for wrong answers and marked-for-review questions.
    4. A prioritized study plan based on impact (Domain Weight % * Error Rate in that domain).
    5. Encouraging professional closing.
    
    CRITICAL: Every time you mention a question that was answered incorrectly, you MUST prefix or suffix it with the corresponding Domain Name (e.g., "[Domain 1: Design Secure Architectures] Question text...").
    
    Use a professional tone suitable for CertaCloud internal training.
    The entire report MUST be written in ${langText}.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "No analysis generated.";
};

export const translateQuestion = async (question: Question, targetLanguage: Language): Promise<Question> => {
  const langText = targetLanguage === "pt" ? "português" : "inglês";
  const prompt = `
    Traduza a seguinte questão de certificação AWS para ${langText}.
    Mantenha a estrutura técnica e os termos específicos da AWS.
    
    Questão: ${question.text}
    Opções:
    ${question.options.map(o => `${o.id}: ${o.text}`).join("\n")}
    Explicação: ${question.explanation}
    
    Retorne APENAS um objeto JSON com as chaves: text, options (array de {id, text}), e explanation.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ["id", "text"],
            },
          },
          explanation: { type: Type.STRING },
        },
        required: ["text", "options", "explanation"],
      },
    },
  });

  try {
    const translated = JSON.parse(response.text || "{}");
    return {
      ...question,
      ...translated,
    };
  } catch (e) {
    console.error("Failed to translate question", e);
    return question;
  }
};
