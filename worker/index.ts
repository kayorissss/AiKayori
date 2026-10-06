export interface Env {
  AI: any
  GOOGLE_KEY: string
}

const MODELS = [
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/meta/llama-3-8b-instruct",
  "@cf/mistral/mistral-7b-instruct-v0.2",
  "@cf/qwen/qwen1.5-7b-chat-awq",
  "@cf/stabilityai/stable-diffusion-xl-base-1.0"
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors })
    }

    if (url.pathname === "/ai/chat") {
      const { model, messages } = await request.json() as any
      if (!MODELS.includes(model)) {
        return new Response(JSON.stringify({ error: "Model not allowed" }), { status: 400, headers: cors })
      }
      const result = await env.AI.run(model, { messages })
      return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } })
    }

    if (url.pathname === "/ai/image") {
      const { prompt } = await request.json() as any
      const result = await env.AI.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", { prompt })
      return new Response(result, { headers: { ...cors, "Content-Type": "image/png" } })
    }

    return new Response("AI-Kayori Worker v1.0.0 - use /ai/chat and /ai/image", { headers: cors })
  }
}
