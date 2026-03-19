import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message, templateName, languageCode, components } = body;

        // Vercel Environment Variables se data lena (Ye body mein nahi hona chahiye security ke liye)
        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!to || (!message && !templateName)) {
            return NextResponse.json({ error: "To and (Message or Template) are required" }, { status: 400 });
        }

        let payload;

        // 1. Agar 'message' hai toh Simple Text format (Chat ke liye)
        if (message) {
            payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "text",
                text: { body: message }
            };
        } 
        // 2. Agar 'templateName' hai toh Template format (Broadcast ke liye)
        else {
            payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: components || []
                }
            };
        }

        const response = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Meta API Error:", data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to send message" },
            { status: 500 }
        );
    }
}
