import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { to, message, type, imageUrl, audioUrl, emoji } = body;

        const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!phoneNumberId || !accessToken) {
            return NextResponse.json({ error: "Meta Keys missing in Vercel settings!" }, { status: 500 });
        }

        let payload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
        };

        // --- IMPROVED LOGIC SWITCH ---

        // 1. IMAGE LOGIC (Camera/Gallery)
        if (type === "image" && imageUrl) {
            payload.type = "image";
            payload.image = { 
                // Meta require valid file extension in URL
                link: imageUrl.match(/\.(jpeg|jpg|gif|png)$/) ? imageUrl : `${imageUrl}.jpg`,
                caption: message || "" 
            };
        } 
        
        // 2. AUDIO/VOICE LOGIC (Microphone)
        else if (type === "audio" && audioUrl) {
            payload.type = "audio";
            payload.audio = { 
                // Voice note ke liye ogg/webm extension force karein
                link: audioUrl.match(/\.(ogg|webm|mp3|wav|m4a)$/) ? audioUrl : `${audioUrl}.ogg`
            };
        }

        // 3. REACTION/HEART LOGIC
        else if (type === "reaction") {
            payload.type = "text";
            payload.text = { body: emoji || "❤️" };
        }

        // 4. DEFAULT TEXT LOGIC
        else {
            if (!message) return NextResponse.json({ error: "Empty message" }, { status: 400 });
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

        if (!response.ok) {
            console.error("Meta API Failure Logs:", data);
            return NextResponse.json({ error: data.error?.message || "Meta API Error" }, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Critical Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
