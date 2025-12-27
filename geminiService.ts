
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTable, TableRow } from "./types";

export const extractTableFromImage = async (base64Image: string): Promise<ExtractedTable[]> => {
  // Always create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Bạn là một chuyên gia OCR. Hãy trích xuất tất cả các bảng dữ liệu có trong hình ảnh này.
  Yêu cầu:
  1. Xác định tên bảng (nếu có) hoặc đặt tên mô tả.
  2. Xác định danh sách tiêu đề cột (headers).
  3. Trích xuất dữ liệu các hàng dưới dạng mảng các chuỗi, mỗi chuỗi tương ứng với một ô trong hàng.
  4. Đảm bảo số lượng phần tử trong mỗi hàng khớp với số lượng tiêu đề cột.
  5. Nếu có nhiều bảng, hãy trích xuất riêng biệt.`;

  try {
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
    
    // Map the array-of-arrays back to array-of-objects format
    return rawResult.tables.map((table: any) => {
      const rows: TableRow[] = table.data.map((rowArray: string[]) => {
        const rowObject: TableRow = {};
        table.headers.forEach((header: string, index: number) => {
          rowObject[header] = rowArray[index] || "";
        });
        return rowObject;
      });

      return {
        tableName: table.tableName,
        headers: table.headers,
        rows: rows
      };
    });
  } catch (error: any) {
    console.error("Gemini OCR Error:", error);
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new Error("API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình.");
    }
    throw error;
  }
};
