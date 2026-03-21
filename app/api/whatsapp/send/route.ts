import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message, type, mediaUrl, emoji } = body;

        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        let payload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
        };

        // 1. Logic for HEART (Reaction)
        if (type === "reaction") {
            payload.type = "reaction";
            payload.reaction = { message_id: "", emoji: emoji || "❤️" }; 
            // Note: Reaction ke liye purane message ki ID chahiye hoti hai, 
            // filhal hum ise simple emoji message ki tarah bhejenge niche.
        } 
        
        // 2. Logic for VOICE/AUDIO
        else if (type === "audio") {
            payload.type = "audio";
            payload.audio = { link: mediaUrl };
        }

        // 3. Logic for IMAGE (Camera/Gallery)
        else if (type === "image") {
            payload.type = "image";
            payload.image = { link: mediaUrl };
        }

        // 4. Default TEXT
        else {
            payload.type = "text";
            payload.text = { body: message };
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
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
