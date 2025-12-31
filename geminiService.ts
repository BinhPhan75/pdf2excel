
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTable, TableRow } from "./types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 4): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = String(error);
      const isRateLimit = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED");
      
      if (isRateLimit && i < maxRetries - 1) {
        // Tăng thời gian chờ lũy thừa: 3s, 7s, 15s...
        const waitTime = Math.pow(2, i + 1) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const extractTableFromImage = async (base64Image: string): Promise<ExtractedTable[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prompt được thiết kế cực kỳ chi tiết để ép AI không bỏ sót dữ liệu
  const prompt = `Bạn là một hệ thống OCR cao cấp chuyên trích xuất dữ liệu bảng biểu.
  NHIỆM VỤ: Phân tích hình ảnh và chuyển đổi TẤT CẢ các bảng thành dữ liệu cấu trúc.
  
  QUY TẮC TRÍCH XUẤT:
  1. Xác định chính xác các cột dựa trên lề và khoảng cách chữ.
  2. Tuyệt đối không được gộp các cột khác nhau vào làm một.
  3. Nếu một ô dữ liệu trống, hãy để là chuỗi rỗng "".
  4. Giữ nguyên định dạng số, ngày tháng, và ký hiệu tiền tệ.
  5. Nếu dữ liệu trải dài trên nhiều dòng trong cùng một ô, hãy nối chúng lại bằng dấu cách.
  6. Tên bảng (tableName) nên phản ánh nội dung bảng đó.
  
  ĐỊNH DẠNG ĐẦU RA: Phải là JSON thuần túy theo schema yêu cầu.`;

  const callApi = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Sử dụng model Pro để có độ chính xác cao nhất cho OCR
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Cho phép AI suy nghĩ kỹ hơn về cấu trúc bảng
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tableName: { type: Type.STRING },
                  headers: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING }
                  },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  }
                },
                required: ["tableName", "headers", "data"]
              }
            }
          },
          required: ["tables"]
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    try {
      const rawResult = JSON.parse(text);
      if (!rawResult.tables || !Array.isArray(rawResult.tables)) return [];

      return rawResult.tables.map((table: any) => {
        // Làm sạch headers
        const cleanHeaders = (table.headers || []).map((h: string) => h.trim());
        
        const rows: TableRow[] = (table.data || []).map((rowArray: any[]) => {
          const rowObject: TableRow = {};
          cleanHeaders.forEach((header: string, index: number) => {
            let value = rowArray[index];
            rowObject[header] = (value !== undefined && value !== null) ? String(value).trim() : "";
          });
          return rowObject;
        });

        return {
          tableName: (table.tableName || "Bảng trích xuất").trim(),
          headers: cleanHeaders,
          rows: rows
        };
      });
    } catch (e) {
      console.error("JSON Parsing Error:", e, text);
      return [];
    }
  };

  return retryWithBackoff(callApi);
};
