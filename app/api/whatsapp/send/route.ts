import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Frontend se aane wale saare fields
        const { to, message, type, imageUrl, audioUrl, emoji } = body;

        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        // Base Payload structure for Meta API
        let payload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
        };

        // --- LOGIC SWITCH BOARD ---

        // 1. IMAGE LOGIC (Camera/Gallery)
        if (type === "image") {
            payload.type = "image";
            payload.image = { 
                link: imageUrl,
                caption: message || "" // Photo ke saath agar koi text likha ho
            };
        } 
        
        // 2. AUDIO/VOICE LOGIC (Microphone)
        else if (type === "audio") {
            payload.type = "audio";
            payload.audio = { link: audioUrl };
        }

        // 3. REACTION LOGIC (Heart/Emoji)
        // Note: Reaction ke liye Meta 'message_id' maangta hai. 
        // Agar ID nahi hai toh hum use simple emoji message ki tarah bhejenge.
        else if (type === "reaction") {
            payload.type = "text";
            payload.text = { body: emoji || "❤️" };
        }

        // 4. DEFAULT TEXT LOGIC
        else {
            payload.type = "text";
            payload.text = { body: message };
        }

        // Meta Server Request
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

        // Error handling for Meta response
        if (!response.ok) {
            console.error("Meta API Error:", data);
            return NextResponse.json({ error: data.error?.message || "Meta API Error" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
