import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
    env: { get(key: string): string | undefined };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
};
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
};

type ImageRequestBody = {
    title: string;
    description?: string;
    plating?: string;
    category?: string;
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: corsHeaders,
    });
}

function buildImagePrompt({ title, description, plating, category }: ImageRequestBody) {
    return [
        "Crée une photographie culinaire premium ultra réaliste d'un plat gastronomique.",
        `Nom du plat : ${title}.`,
        category ? `Catégorie : ${category}.` : "",
        description ? `Description culinaire : ${description}.` : "",
        plating ? `Dressage : ${plating}.` : "",
        "Style restaurant gastronomique français.",
        "Assiette élégante, textures réalistes, lumière naturelle douce, cadrage éditorial haut de gamme.",
        "Sans texte, sans watermark, sans logo."
    ]
        .filter(Boolean)
        .join(" ");
}

async function startConversation(apiKey: string, agentId: string, inputs: string) {
    const response = await fetch("https://api.mistral.ai/v1/conversations", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            agent_id: agentId,
            inputs,
        }),
    });

    const raw = await response.text();

    if (!response.ok) {
        throw new Error(`Mistral conversation error: ${response.status} - ${raw}`);
    }

    return JSON.parse(raw);
}

function extractFileId(payload: any): string | null {
    const outputs = payload?.outputs;
    if (!Array.isArray(outputs) || outputs.length === 0) return null;

    for (const output of outputs) {
        const content = output?.content;
        if (!Array.isArray(content)) continue;

        for (const chunk of content) {
            if (chunk?.file_id) return chunk.file_id;
            if (chunk?.type === "tool_file" && chunk?.file_id) return chunk.file_id;
            if (chunk?.type === "file" && chunk?.file_id) return chunk.file_id;
        }
    }

    return null;
}

async function downloadFileAsBase64(apiKey: string, fileId: string) {
    const response = await fetch(`https://api.mistral.ai/v1/files/${fileId}/content`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
        },
    });

    if (!response.ok) {
        const raw = await response.text();
        throw new Error(`Mistral file download error: ${response.status} - ${raw}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {
            status: 200,
            headers: corsHeaders,
        });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
        const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
        const mistralImageAgentId = Deno.env.get("MISTRAL_IMAGE_AGENT_ID");

        if (!mistralApiKey) {
            return jsonResponse({ error: "MISTRAL_API_KEY is not configured" }, 500);
        }

        if (!mistralImageAgentId) {
            return jsonResponse({ error: "MISTRAL_IMAGE_AGENT_ID is not configured" }, 500);
        }

        const body = (await req.json()) as ImageRequestBody;

        if (!body?.title?.trim()) {
            return jsonResponse({ error: "title is required" }, 400);
        }

        const prompt = buildImagePrompt(body);

        const conversation = await startConversation(
            mistralApiKey,
            mistralImageAgentId,
            prompt,
        );

        const fileId = extractFileId(conversation);

        if (!fileId) {
            return jsonResponse(
                {
                    error: "No generated image file_id returned by Mistral",
                    raw: conversation,
                },
                500,
            );
        }

        const imageBase64 = await downloadFileAsBase64(mistralApiKey, fileId);

        return jsonResponse({
            success: true,
            imageBase64,
            mimeType: "image/png",
            prompt,
            provider: "mistral",
            fileId,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown server error";

        return jsonResponse(
            {
                error: "Unhandled function error",
                details: message,
            },
            500,
        );
    }
});