
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTable, TableRow } from "./types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error.message?.includes("429") || error.message?.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limited. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
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
  
  const prompt = `Bạn là một chuyên gia trích xuất dữ liệu (OCR). 
  Nhiệm vụ: Tìm và trích xuất TẤT CẢ các bảng dữ liệu có trong hình ảnh này.
  
  Yêu cầu quan trọng:
  1. Ngay cả khi bảng không có đường kẻ rõ ràng, hãy dựa vào khoảng cách giữa các chữ để xác định cột.
  2. Xác định tên bảng (tableName) một cách logic dựa vào tiêu đề phía trên bảng.
  3. Headers: Trích xuất chính xác tên các cột.
  4. Data: Trích xuất dữ liệu từng hàng. Mỗi hàng là một mảng các chuỗi tương ứng với headers.
  5. Nếu không thấy bảng nào rõ ràng, hãy cố gắng nhóm các thông tin có cấu trúc lặp lại thành một bảng.
  6. Tuyệt đối không bỏ sót hàng hoặc cột nào.
  7. Trả về kết quả dưới dạng JSON theo schema đã định nghĩa.`;

  const callApi = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tableName: { type: Type.STRING, description: "Tên của bảng" },
                  headers: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Danh sách tên các cột"
                  },
                  data: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Một hàng dữ liệu là một mảng các giá trị chuỗi"
                    },
                    description: "Danh sách các hàng dữ liệu"
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
    if (!text) throw new Error("Không nhận được phản hồi từ AI");
    
    const rawResult = JSON.parse(text);
    if (!rawResult.tables || !Array.isArray(rawResult.tables)) return [];

    return rawResult.tables.map((table: any) => {
      const rows: TableRow[] = (table.data || []).map((rowArray: string[]) => {
        const rowObject: TableRow = {};
        (table.headers || []).forEach((header: string, index: number) => {
          rowObject[header] = rowArray[index] !== undefined ? rowArray[index] : "";
        });
        return rowObject;
      });

      return {
        tableName: table.tableName || "Bảng không tên",
        headers: table.headers || [],
        rows: rows
      };
    });
  };

  return retryWithBackoff(callApi);
};
